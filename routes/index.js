const RenJS = require("@renproject/ren");
const Web3 = require("web3");
const Tx = require('ethereumjs-tx').Transaction;

const express = require('express');
const router = express.Router();

// const ren = new RenJS('chaosnet')
// const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2'))
const ren = new RenJS('testnet')
const web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2'))

const adapterAddress = process.env.ADAPTER_ADDRESS;
const adapterABI = require('../utils/adapterSimpleABI.json')
const adapter = new web3.eth.Contract(adapterABI, adapterAddress)
const walletAddress = process.env.WALLET_ADDRESS;
const walletKey = new Buffer.from(process.env.WALLET_KEY, 'hex')

web3.eth.defaultAccount = walletAddress

const gatewayStatusMap = {
    // address: {
    //     status: 'pending' | 'completed',
    //     txHash: '0x'
    // }
}

// Swap using contract funds
const swap = async function (amount, dest, gateway) {
    const nonce = await web3.eth.getTransactionCount(walletAddress)
    console.log('nonce', nonce)

    web3.eth.getGasPrice(function(e, r) { console.log('gas price', r) })

    console.log('swap amount', amount)

    const rawTx = {
        "from": walletAddress,
        "gasPrice": web3.utils.toHex(10000000000),
        "gasLimit": web3.utils.toHex(200000),
        "to": adapterAddress,
        "value": "0x0",
        "data": adapter.methods.swap(amount, dest).encodeABI(),
        "nonce": web3.utils.toHex(nonce),
        "chainId": web3.utils.toHex(42)
    }

    console.log('rawTx', rawTx)

    const transaction = new Tx(rawTx);
    transaction.sign(walletKey);
    const serializedTx = transaction.serialize().toString('hex');
    web3.eth.sendSignedTransaction('0x' + serializedTx)
        .on('receipt', console.log)
        .on('transactionHash', hash => {
            console.log('swap hash', hash)
            gatewayStatusMap[gateway].status = 'complete'
            gatewayStatusMap[gateway].txHash = hash
        });
}

// Complete the shift once RenVM verifies the tx
const completeShiftIn = async function (shiftIn, signature, response) {
    console.log('completeShiftIn', signature, response)
    const params = shiftIn.params
    const msg = params.contractParams[0].value
    const amount = params.sendAmount
    const nHash = response.args.nhash

    const nonce = await web3.eth.getTransactionCount(walletAddress)
    const rawTx = {
        "from": walletAddress,
        "gasPrice": web3.utils.toHex(50 * 1e9),
        "gasLimit": web3.utils.toHex(210000),
        "to": adapterAddress,
        "value": "0x0",
        "data": adapter.methods.shiftIn(
            msg,
            amount,
            nhash,
            signature
        ).encodeABI(),
        "nonce": web3.utils.toHex(nonce)
    }

    const transaction = new Tx(rawTx);
    transaction.sign(walletKey);
    web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
        .on('transactionHash', hash => {
            console.log('shift in hash', hash)
        });
}

// Stagger Swap and Shift-in based on tx confirmations
const monitorShiftIn = async function (shiftIn, dest) {
    const gateway = shiftIn.gatewayAddress
    const confsTillSwap = 0
    const confsTillShiftIn = 2

    console.log('awaiting initial tx', gateway, shiftIn.params.sendAmount)
    // const initalConf = await shiftIn.waitForDeposit(confsTillSwap);
    console.log('calling swap', shiftIn.params.sendAmount, dest, gateway)
    swap(shiftIn.params.sendAmount, dest, gateway)

    console.log('awaiting final confs', gateway)
    const fullConf = await shiftIn.waitForDeposit(confsTillShiftIn);
    console.log('submitting to renvm', fullConf)
    const renvm = await fullConf.submitToRenVM()
    console.log('renvm response', renvm)
    completeShiftIn(shiftIn, renvm.signature, renvm.response)
}


// Routes
router.post('/swap-gateway/create', function(req, res, next) {
    const params = req.body
    const amount = params.sourceAmount
    const dest = params.destinationAddress
    const shiftIn = ren.shiftIn({
        // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
        sendToken: RenJS.Tokens.BTC.Btc2Eth,

        // Amount of BTC we are sending (in Satoshis)
        sendAmount: Math.floor(amount * (10 ** 8)), // Convert to Satoshis

        // The contract we want to interact with
        sendTo: adapterAddress,

        // The name of the function we want to call
        contractFn: "shiftIn",

        // Arguments expected for calling `deposit`
        contractParams: [
            {
                name: "_msg",
                type: "bytes",
                value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
            }
        ],
    });
    const gatewayAddress = shiftIn.gatewayAddress
    gatewayStatusMap[gatewayAddress] = {
        status: 'pending',
        txHash: ''
    }

    monitorShiftIn(shiftIn, dest)
    res.json({ gatewayAddress })
});

router.get('/swap-gateway/status', function(req, res, next) {
    const id = req.query.gateway
    res.json(id && gatewayStatusMap[id] ? gatewayStatusMap[id] : {});
});

router.get('/', function(req, res, next) {
    res.render('../ui/build/index')
});

module.exports = router;
