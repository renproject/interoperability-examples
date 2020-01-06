const RenJS = require("@renproject/ren");
const Web3 = require("web3");
const Tx = require('ethereumjs-tx').Transaction;

const express = require('express');
const router = express.Router();

const ren = new RenJS('chaosnet')
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2'))

const adapterAddress = '0x15efc392e1803db6d69c52c3ef6ce54ed00bbfe5'
const adapterABI = require('../utils/adapterABI.json')
const adapter = new web3.eth.Contract(adapterABI, adapterAddress)
const walletAddress = 'YOUR_ADDRESS';
const walletKey = Buffer.from('YOUR_KEY', 'hex')

const gatewayStatusMap = {
    // address: {
    //     status: 'pending' | 'completed',
    //     txHash: '0x'
    // }
}

// Swap using contract funds
const swap = async function (amount, dest, gateway) {
    const nonce = await web3.eth.getTransactionCount(walletAddress)
    const rawTx = {
        "from": walletAddress,
        "gasPrice": web3.utils.toHex(5 * 1e9),
        "gasLimit": web3.utils.toHex(310000),
        "to": adapterAddress,
        "value": "0x0",
        "data": adapter.methods.swap(dest, amount).encodeABI(),
        "nonce": web3.utils.toHex(nonce)
    }

    const transaction = new Tx(rawTx);
    transaction.sign(walletKey);
    web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
        .on('transactionHash', hash => {
            console.log('swap hash', hash)
            gatewayStatusMap[gateway].status = 'complete'
            gatewayStatusMap[gateway].txHash = hash
        });
}

// Complete the shift once RenVM verifies the tx
const completeShiftIn = async function (shiftIn, signature, response) {
    const params = shiftIn.params
    const msg = params.contractParams[0].value
    const amount = params.sendAmount
    const nHash = response.args.nhash

    const nonce = await web3.eth.getTransactionCount(walletAddress)
    const rawTx = {
        "from": walletAddress,
        "gasPrice": web3.utils.toHex(5 * 1e9),
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

    const initalConf = await shiftIn.waitForDeposit(confsTillSwap);
    swap(shiftIn.params.sendAmount, dest, gateway)

    const fullConf = await shiftIn.waitForDeposit(confsTillShiftIn);
    const renvm = await deposit.submitToRenVM()
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

module.exports = router;
