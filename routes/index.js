const RenJS = require("@renproject/ren").default;
const Web3 = require("web3");
const ethers = require('ethers');
const Tx = require('ethereumjs-tx').Transaction;
const { fromConnection } = require('@openzeppelin/network/lib')

const express = require('express');
const router = express.Router();

// console.log(RenJS, typeof RenJS, RenJS.default('testnet'))

// const ren = new RenJS('chaosnet')
const ren = new RenJS('testnet')

const adapterAddress = process.env.ADAPTER_ADDRESS;
const adapterABI = require('../utils/exchangeAdapterSimpleABI.json')

const walletAddress = process.env.WALLET_ADDRESS;
const walletKey = new Buffer.from(process.env.WALLET_KEY, 'hex')

const url = 'https://kovan.infura.io/v3/7ae0954512994011a37062e1f805f619';

// for gas price
// const web3 = new Web3(url)

const REACT_APP_TX_FEE = 100;
const signKey = {
    privateKey: walletKey,
    address: walletAddress
};


let web3Context = null;

(async function() {
    // const gasPriceResult = await web3.eth.getGasPrice()
    // console.log(gasPriceResult)
    // const gasPrice = 10000000000;
    const relay_client_config = {
      txfee: REACT_APP_TX_FEE,
      // force_gasPrice: gasPrice, //override requested gas price
      // gasPrice: gasPrice, //override requested gas price
      force_gasLimit: 200000, //override requested gas limit.
      gasLimit: 200000, //override requested gas limit.
      verbose: true
    };
    web3Context = await fromConnection(
        "https://kovan.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2",
        {
            gsn: { signKey, ...relay_client_config }
        }
    )
    // console.log(gas)
})()

const gatewayStatusMap = {
    // address: {
    //     created: 0,
    //     status: 'pending' | 'completed' | error,
    //     txHash: '0x',
    //     error: {}
    // }
}

const gatewaySwapIntervalMap = {
    // address: { function }
}

const gatewaySwapAttemptMap = {
    // address: count
}

// prune completed gateways from memory 24 hours after completed
setInterval(() => {
    const now = Date.now()
    Object.keys(gatewayStatusMap).map(g => {
        if (gatewayStatusMap[g].created < (now - (1000 * 60 * 60 * 24))) {
            delete gatewayStatusMap[g]
            delete gatewaySwapIntervalMap[g]
            delete gatewaySwapAttemptMap[g]
        }
    })
}, (1000 * 60 * 60))

// Swap using contract funds
const swap = async function (amount, dest, gateway) {
    console.log('swap amount', amount, dest)

    gatewaySwapAttemptMap[gateway] = 0

    // in case transaction is rejected by GSN, retry every 30 secs
    gatewaySwapIntervalMap[gateway] = setInterval(async () => {
        // 3 attempts max
        gatewaySwapAttemptMap[gateway] = gatewaySwapAttemptMap[gateway] + 1
        if (gatewaySwapAttemptMap[gateway] > 3) {
            gatewayStatusMap[gateway].status = 'error'
            return clearInterval(gatewaySwapIntervalMap[gateway])
        }

        const adapterContract = new web3Context.lib.eth.Contract(adapterABI, adapterAddress)
        const gasPrice = await web3Context.lib.eth.getGasPrice()

        try {
            const result = await adapterContract.methods.swap(
                amount,
                dest
            ).send({
                from: web3Context.accounts[0],
                gasPrice: Math.round(gasPrice * 1.5)
            })
            // console.log('result', result)
            gatewayStatusMap[gateway].status = 'complete'
            gatewayStatusMap[gateway].txHash = result.transactionHash
            clearInterval(gatewaySwapIntervalMap[gateway])
        } catch(e) {
            console.log(e)
            gatewayStatusMap[gateway].status = 'error'
            gatewayStatusMap[gateway].error = e
        }
    }, (1000 * 30))
}

// Complete the shift once RenVM verifies the tx
const completeShiftIn = async function (mint, signature, response) {
    console.log('completeShiftIn', signature, response)
    const params = mint.params
    const msg = params.contractCalls[0].contractParams[0].value
    const amount = params.sendAmount
    const nHash = response.autogen.nhash
    const adapterContract = new web3Context.lib.eth.Contract(adapterABI, adapterAddress)
    const gasPrice = await web3Context.lib.eth.getGasPrice()

    try {
        const result = await adapterContract.methods.mint(
            msg,
            amount,
            nHash,
            signature
        ).send({
            from: web3Context.accounts[0],
            gasPrice: Math.round(gasPrice * 1.5)
            // nonce: 15
        })
        console.log('shift in hash for ' + mint.gatewayAddress, result.transactionHash)
    } catch(e) {
        console.log(e)
        gatewayStatusMap[gateway].status = 'error'
        gatewayStatusMap[gateway].error = e
    }
}

// Stagger Swap and Shift-in based on tx confirmations
const monitorMint = async function (mint, dest) {
    const gateway = mint.gatewayAddress
    const confsTillSwap = 0
    const confsTillShiftIn = 2

    console.log('awaiting initial tx', gateway, mint.params.sendAmount)
    const initalConf = await mint.wait(confsTillSwap);
    console.log('calling swap', mint.params.sendAmount, dest, gateway)
    swap(mint.params.sendAmount, dest, gateway)

    console.log('awaiting final confs', gateway)
    const fullConf = await mint.wait(confsTillShiftIn);
    console.log('submitting to renvm', fullConf)
    const renvm = await fullConf.submit()
    console.log('renvm response', renvm)
    completeShiftIn(mint, renvm.signature, renvm.renVMResponse)
}

// Routes
router.post('/swap-gateway/create', function(req, res, next) {
    const params = req.body
    const amount = params.sourceAmount
    const dest = params.destinationAddress

    const mint = ren.lockAndMint({
        sendToken: RenJS.Tokens.BTC.Btc2Eth,
        sendAmount: Math.floor(amount * (10 ** 8)), // Convert to Satoshis
        sendTo: adapterAddress,
        contractFn: "mint",
        contractParams: [
            {
                name: "_msg",
                type: "bytes",
                value: web3Context.lib.utils.fromAscii(`Depositing ${amount} BTC`),
            }
        ],
    });
    const gatewayAddress = mint.gatewayAddress
    gatewayStatusMap[gatewayAddress] = {
        created: Date.now(),
        status: 'pending',
        txHash: ''
    }

    monitorMint(mint, dest)
    res.json({ gatewayAddress })
});

router.get('/swap-gateway/status', function(req, res, next) {
    const id = req.query.gateway
    res.json(id && gatewayStatusMap[id] ? gatewayStatusMap[id] : {});
});

router.get('/', function(req, res, next) {
    res.render('../ui/build/index')
});

router.get('/stream', function(req, res, next) {
    res.render('../ui/build/index')
});

module.exports = router;
