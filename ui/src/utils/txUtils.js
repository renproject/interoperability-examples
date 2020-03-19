import RenJS from "@renproject/ren";
import { ShiftInStatus, ShiftOutStatus } from "@renproject/gateway-js";

import adapterABI from './exchangeAdapterSimpleABI.json'
import streamAdapterABI from './streamAdapterSimpleABI.json'
import transferAdapterABI from './simpleTransferAdapterABI.json'
import proxyABI from './btcVaultProxyABI.json'
import erc20Abi from './erc20ABI.json'
import BigNumber from 'bignumber.js'

// export const API_URL = 'http://localhost:3000'
export const API_URL = ''
export const MIN_CLAIM_AMOUNT = 0.00010001
export const TRANSFER_ADAPTER_TEST = '0x083A7E086C27024d54556f876F09E2a0d7dD5E86'
export const TRANSFER_ADAPTER_MAIN = '0x9F60E2e51a79609821DA32880Fc2b92e34F5Cf2e'
export const SWAP_ADAPTER_TEST = '0xade8792c3ee90320cabde200ccab34b27cc88651'
export const SWAP_ADAPTER_MAIN = '0x35Db75fc0D5457eAb9C21AFb5857716427F8129D'
export const STREAM_ADAPTER_TEST = '0x1B1994b62Ca8d6f8A79CEc0505de2DF728FCcbb7'
export const STREAM_ADAPTER_MAIN = '0x57bE80A340C310Bf4211C8bFED8c846bD92c5c55'
export const COLLATERALIZE_PROXY_ADDRESS_TEST = '0xf026B91Eb32fE6e2F3FcFb3081715723E1983e48'
export const COLLATERALIZE_DIRECT_PROXY_ADDRESS_TEST = '0xCb56D0859fD0aE5D9e7F13636b4Bb78936ddA2f8'
export const ZBTC_ADDRESS_TEST = '0xc6069E8DeA210C937A846db2CEbC0f58ca111f26'
export const DAI_ADDRESS_TEST = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'


let swapMonitor = null

// transaction state
export const addTx = (store, tx) => {
    let storeString = ''
    if (tx.type === 'swap') {
        storeString = 'swap.transactions'
    } else if (tx.type === 'stream') {
        storeString = 'stream.transactions'
    } else if (tx.type === 'transfer') {
        storeString = 'transfer.transactions'
    } else if (tx.type === 'collateralize') {
        storeString = 'collateralize.transactions'
    }

    let txs = store.get(storeString)
    txs.push(tx)
    store.set(storeString, txs)
    localStorage.setItem(storeString, JSON.stringify(txs))
    // for debugging
    window[storeString] = txs
}

export const updateTx = (store, newTx) => {
    let storeString = ''
    if (newTx.type === 'swap') {
        storeString = 'swap.transactions'
    } else if (newTx.type === 'stream') {
        storeString = 'stream.transactions'
    } else if (newTx.type === 'transfer') {
        storeString = 'transfer.transactions'
    } else if (newTx.type === 'collateralize') {
        storeString = 'collateralize.transactions'
    }

    const txs = store.get(storeString).map(t => {
        if (t.id === newTx.id) {
            // const newTx = Object.assign(t, props)
            return newTx
        }
        return t
    })
    store.set(storeString, txs)
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window[storeString] = txs
}

export const removeTx = (store, tx) => {
    let storeString = ''
    if (tx.type === 'swap') {
        storeString = 'swap.transactions'
    } else if (tx.type === 'stream') {
        storeString = 'stream.transactions'
    } else if (tx.type === 'transfer') {
        storeString = 'transfer.transactions'
    } else if (tx.type === 'collateralize') {
        storeString = 'collateralize.transactions'
    }

    let txs = store.get(storeString).filter(t => (t.id !== tx.id))
    // console.log(txs)
    store.set(storeString, txs)
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window[storeString] = txs
}

// stream
export const streamExists = function(streams, beneficiary, startTime) {
    return streams.filter(stream => (stream.destAddress === beneficiary && stream.startTime === startTime)).length > 0
}

export const getStreams = async function() {
    // console.log('search', destAddress)
    const { store }  = this.props
    const web3 = store.get('web3')
    console.log(store.getState())
    // const web3Context = store.get('web3Context')
    const adapterAddress = store.get('stream.adapterAddress')
    const adapterContract = new web3.eth.Contract(streamAdapterABI, adapterAddress)
    // console.log(adapterContract)
    window.adapter = adapterContract
    const schedules = await adapterContract.methods.getSchedules().call()
    // console.log(schedules)
    return schedules
}

export const recoverStreams = async function(destAddress) {
    const { store } = this.props
    const web3 = store.get('web3')
    const schedules = await getStreams.bind(this)()
    const beneficiary = web3.utils.fromAscii(destAddress)
    const network = store.get('selectedNetwork')
    const transactions = store.get('stream.transactions').filter(t => t.network === network)

    schedules.map(s => {
        const alreadyExists = streamExists(transactions, web3.utils.toAscii(s.beneficiary), s.startTime)
        // console.log(s.beneficiary)
        if (s.beneficiary === beneficiary && !alreadyExists) {
            const amount = new BigNumber(s.amount)
            const tx = {
                id: 'tx-' + Math.random().toFixed(6),
                network,
                type: 'stream',
                instant: false,
                awaiting: '',
                source: 'btc',
                dest: 'eth',
                destAddress,
                amount: amount.div(10 ** 8).toNumber(),
                startTime: s.startTime,
                duration: s.duration,
                error: false,
                txHash: '',
                schedule: s,
                claimTransactions: []
            }

            addTx(store, tx)
        } else {
            // show no results ui
        }
    })
}

export const calculateStreamProgress = function(tx) {
    const schedule = tx.schedule

    if (schedule) {
        const start = Number(schedule.startTime)
        const now = Math.floor(Date.now() / 1000)
        const end = Number(schedule.startTime) + (Number(schedule.duration * 60))
        const period = end - start
        let totalClaimablePercentrage = 0
        let amountClaimedPercentage = 0
        if (now > end) {
            totalClaimablePercentrage = 100
        } else {
            totalClaimablePercentrage = Number((((now - start) / period) * 100).toFixed(1))
        }
        amountClaimedPercentage = Number(((schedule.amountClaimed / schedule.amount) * 100).toFixed(1))
        const amountClaimablePercentage = Number((totalClaimablePercentrage - amountClaimedPercentage).toFixed(1))

        const amount = tx.schedule ? (tx.schedule.amount / (10 ** 8)).toFixed(6) : 0
        const totalClaimableAmount = amount * (totalClaimablePercentrage / 100)
        const claimedAmount = Number(amount * (amountClaimedPercentage / 100))
        const claimableAmount = Number(amount * (amountClaimablePercentage / 100))

        return {
            amount,
            totalClaimablePercentrage,
            totalClaimableAmount,
            amountClaimedPercentage,
            claimedAmount,
            amountClaimablePercentage,
            claimableAmount,
            remaingDuration: end - start
        }
    } else {
        return {
            amount: 0,
            totalClaimablePercentrage: 0,
            totalClaimableAmount: 0,
            amountClaimedPercentage: 0,
            claimedAmount: 0,
            amountClaimablePercentage: 0,
            claimableAmount: 0,
            remaingDuration: 0
        }
    }


}

export const updateStreamInfo = async function(tx) {
    const { store } =  this.props
    const web3 = store.get('web3')
    const { startTime, destAddress } = tx

    const beneficiary = web3.utils.fromAscii(destAddress)
    const schedules = await getStreams.bind(this)()

    const schedule = schedules.filter(s => (
        Number(s.startTime) === Number(startTime) &&
        s.beneficiary === beneficiary
    ))[0]

    console.log('schedule', schedule, schedules)

    if (schedule && schedule.beneficiary) {
        // console.log('updateStreamInfo', schedules, schedule)
        const sched = {
            id: schedule.id,
            beneficiary: schedule.beneficiary,
            startTime: schedule.startTime,
            duration: schedule.duration,
            amount: schedule.amount,
            amountClaimed: schedule.amountClaimed,
            minutesClaimed: schedule.minutesClaimed
        }
        // in-case tx was never updated
        let newTx = Object.assign(tx, {
            awaiting: '',
            error: false
        })
        newTx.schedule = sched
        updateTx(store, tx, newTx)
        return newTx
    }
}

export const claim = async function(tx) {
    const { store }  = this.props
    const web3 = store.get('web3')
    const web3Context = store.get('web3Context')

    const adapterAddress = store.get('stream.adapterAddress')
    const { destAddress, schedule } = tx

    store.set('stream.claimRequesting', true)

    const {
        totalClaimablePercentrage,
        amountClaimedPercentage
    } = calculateStreamProgress(tx)

    const claimAmount = (((totalClaimablePercentrage - amountClaimedPercentage) / 100) * tx.amount).toFixed(6)

    const adapterContract = new web3.eth.Contract(streamAdapterABI, adapterAddress)
    const gasPrice = await web3Context.lib.eth.getGasPrice()

    console.log('gasPrice', gasPrice)

    // console.log('claiming tx', tx, schedule, schedule.id)

    return new Promise(async (resolve, reject) => {
        try {
            const result = await adapterContract.methods.claim(
                schedule.id
            ).send({
                from: web3Context.accounts[0],
                gasPrice: Math.round(gasPrice * 1.5),
                gasLimit: 150000
            }).on('transactionHash', (hash) => {
                updateTx(store, Object.assign(tx, {
                    claimTransactions: tx.claimTransactions.concat([{
                        timestamp: Date.now(),
                        amount: claimAmount,
                        txHash: hash,
                        network: tx.network
                    }])
                }))
            }).on('confirmation', (confirmationNumber, receipt) => {
                if (confirmationNumber === 1) {
                    store.set('stream.claimRequesting', false)
                    console.log('confirmation', confirmationNumber, receipt)
                    updateStreamInfo.bind(this)(tx)
                    resolve()
                }
            })
            // console.log('result', result)
        } catch(e) {
            console.log('error completing', e)
            store.set('stream.claimRequesting', false)
            reject()
        }
    })
}

// exchange
export const completeDeposit = async function(tx) {
    const { store }  = this.props
    const web3 = store.get('web3')
    const localWeb3 = store.get('localWeb3')
    const localWeb3Address = store.get('localWeb3Address')
    const web3Context = store.get('web3Context')
    const pendingShiftIns = store.get('pendingShiftIns')

    // const adapterAddress = store.get('adapterAddress')
    const { id, type, params, renResponse, renSignature } = tx

    let adapterContract
    if (type === 'swap') {
        adapterContract = new web3.eth.Contract(adapterABI, store.get('swap.adapterAddress'))
    } else if (type === 'stream') {
        adapterContract = new web3.eth.Contract(streamAdapterABI, store.get('stream.adapterAddress'))
    } else if (type === 'transfer') {
        adapterContract = new localWeb3.eth.Contract(transferAdapterABI, store.get('transfer.adapterAddress'))
    } else if (type === 'collateralize') {
        adapterContract = new localWeb3.eth.Contract(proxyABI, store.get('collateralize.adapterAddress'))
    }

    const gasPrice = await web3Context.lib.eth.getGasPrice()

    console.log('gasPrice', gasPrice)

    updateTx(store, Object.assign(tx, { awaiting: 'eth-settle' }))

    console.log('completeDeposit', tx, adapterContract)

    const utxoAmount = Number(renResponse.in.utxo.amount)

    try {
        let result
        if (type === 'swap') {
            result = await adapterContract.methods.shiftInWithSwap(
                params.contractCalls[0].contractParams[0].value,
                utxoAmount,
                renResponse.autogen.nhash,
                renSignature
            ).send({
                from: web3Context.accounts[0],
                gasPrice: Math.round(gasPrice * 1.5),
                gasLimit: 200000
            })
        } else if (type === 'stream') {
            result = await adapterContract.methods.addVestingSchedule(
                params.contractCalls[0].contractParams[0].value,
                params.contractCalls[0].contractParams[1].value,
                Number(params.contractCalls[0].contractParams[2].value),
                utxoAmount,
                renResponse.autogen.nhash,
                renSignature
            ).send({
                from: web3Context.accounts[0],
                gasPrice: Math.round(gasPrice * 1.5),
                gasLimit: 350000
            })
            await updateStreamInfo.bind(this)(tx)
        } else if (type === 'transfer') {
            result = await adapterContract.methods.deposit(
                params.contractCalls[0].contractParams[0].value,
                utxoAmount,
                renResponse.autogen.nhash,
                renSignature
            ).send({
                from: localWeb3Address
            })
        } else if (type === 'collateralize') {
            result = await adapterContract.methods.mintDai(
                params.contractCalls[0].contractParams[1].value,
                params.contractCalls[0].contractParams[2].value,
                utxoAmount,
                renResponse.autogen.nhash,
                renSignature
            ).send({
                from: localWeb3Address,
            })
        }
        store.set('pendingShiftIns', pendingShiftIns.filter(p => p !== id))
        updateTx(store, Object.assign(tx, { awaiting: '', txHash: result.transactionHash, error: false }))
    } catch(e) {
        console.log(e)
        updateTx(store, Object.assign(tx, { error: true }))
    }
}

export const initShiftIn = function(tx) {
    const {
      type,
      amount,
      params,
      destAddress,
      // stream
      startTime,
      duration,
      // collateralize borrow
      daiAmount,
      btcAddress,
      ethAddress
    } = tx
    const { store } = this.props
    const {
        sdk,
        gjs,
        web3,
    } = store.getState()

    let adapterAddress = ''
    let contractFn = ''
    let contractParams = []

    if (type === 'swap') {
        adapterAddress = this.props.store.get('swap.adapterAddress')
        contractFn = 'shiftInWithSwap'
        contractParams = [
            {
                name: "_to",
                type: "address",
                value: destAddress
            }
        ]
    } else if (type === 'stream') {
        adapterAddress = this.props.store.get('stream.adapterAddress')
        contractFn = 'addVestingSchedule'
        contractParams = [
            {
                name: "_beneficiary",
                type: "bytes",
                value: web3.utils.fromAscii(destAddress),
            },
            {
                name: "_startTime",
                type: "uint256",
                value: startTime,
            },
            {
                name: "_duration",
                type: "uint16",
                value: duration,
            }
        ]
    } else if (type === 'collateralize') {
        adapterAddress = this.props.store.get('collateralize.adapterAddress')
        contractFn = 'mintDai'
        contractParams = [
            {
                name: "_sender",
                type: "address",
                value: ethAddress,
            },
            {
                name: "_dart",
                type: "int256",
                value: web3.utils.toWei(daiAmount),
            },
            {
                name: "_btcAddr",
                type: "bytes",
                value: web3.utils.fromAscii(btcAddress),
            }
        ]
    }

    // // store data or update params with nonce
    const data = {
        sendToken: RenJS.Tokens.BTC.Btc2Eth,
        sendAmount: RenJS.utils.value(amount, "btc").sats(), // Convert to Satoshis
        sendTo: adapterAddress,
        contractFn,
        contractParams,
        nonce: params && params.nonce ? params.nonce : RenJS.utils.randomNonce(),
    }

    const shiftIn = sdk.shiftIn(data)

    window.shiftIns.push(shiftIn)

    return shiftIn
}

export const initDeposit = async function(tx) {
    const { store }  = this.props
    const {
        id,
        params,
        awaiting,
        renResponse,
        renSignature,
        error,
    } = tx

    const pendingShiftIns = store.get('pendingShiftIns')
    if (pendingShiftIns.indexOf(id) < 0) {
        store.set('pendingShiftIns', pendingShiftIns.concat([id]))
    }

    // console.log('initDeposit', tx)

    console.log('initDeposit', tx)

    // completed
    if (!awaiting) return

    // clear error when re-attempting
    if (error) {
        updateTx(store, Object.assign(tx, { error: false }))
    }

    // ren already exposed a signature
    if (renResponse && renSignature && !error) {
        completeDeposit.bind(this)(tx)
    } else {
        // create or re-create shift in
        const shiftIn = await initShiftIn.bind(this)(tx)

        // console.log('initDeposit shiftin', shiftIn)

        if (!params) {
            addTx(store, Object.assign(tx, {
                params: shiftIn.params,
                renBtcAddress: shiftIn.addr()
            }))
        }

        // wait for btc
        const deposit = await shiftIn
            .waitForDeposit(2)
            .on("deposit", dep => {
                // console.log('on deposit', dep)
                if (dep.utxo) {
                    if (awaiting === 'btc-init') {
                        updateTx(store, Object.assign(tx, {
                            awaiting: 'btc-settle',
                            btcConfirmations: dep.utxo.confirmations,
                            btcTxHash: dep.utxo.txid
                        }))
                    } else {
                        updateTx(store, Object.assign(tx, {
                            btcConfirmations: dep.utxo.confirmations,
                            btcTxHash: dep.utxo.txid
                        }))
                    }
                }
            })

        updateTx(store, Object.assign(tx, { awaiting: 'ren-settle' }))

        try {
            const signature = await deposit.submitToRenVM();
            updateTx(store, Object.assign(tx, {
                renResponse: signature.response,
                renSignature: signature.signature
            }))

            completeDeposit.bind(this)(tx)
        } catch(e) {
            console.log(e)
        }
    }
}

// transfers
export const initGJSDeposit = async function(tx) {
    const {
      amount,
      params,
      destAddress,
    } = tx
    const { store } = this.props
    const {
        sdk,
        gjs,
        web3,
    } = store.getState()

    const adapterAddress = this.props.store.get('transfer.adapterAddress')
    const contractFn = 'deposit'
    const contractParams = [
        {
            name: "_recipient",
            type: "address",
            value: destAddress,
        }
    ]

    const data = {
        sendToken: RenJS.Tokens.BTC.Btc2Eth,
        sendAmount: RenJS.utils.value(amount, "btc").sats(), // Convert to Satoshis
        sendTo: adapterAddress,
        contractFn,
        contractParams,
        nonce: params && params.nonce ? params.nonce : RenJS.utils.randomNonce(),
    }

    gjs.open(data);
}

export const recoverTrades = async function() {
    const { store } = this.props
    const gjs = store.get('gjs')

    // Re-open incomplete trades
    const previousGateways = await gjs.getGateways();
    for (const trade of Array.from(previousGateways.values())) {
        if (trade.status === ShiftInStatus.ConfirmedOnEthereum || trade.status === ShiftOutStatus.ReturnedFromRenVM) { continue; }
        const gateway = gjs.open(trade);
        console.log(gateway)
        gateway.pause();
        // gateway.cancel();
        gateway.result()
            .on("status", (status) => console.log(`[GOT STATUS] ${status}`))
            .then(console.log)
            .catch(console.error);
    }
}

export const initInstantSwap = async function(tx) {
    const { store }  = this.props
    const { params, awaiting, renResponse, renSignature, error } = tx

    const address = store.get('swap.address')
    const amount = store.get('swap.amount')

    const request = await fetch(`${API_URL}/swap-gateway/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sourceAmount: amount,
            sourceAsset: 'BTC',
            destinationAsset: 'ETH',
            destinationAddress: address
        })
    })
    const data = await request.json()
    addTx(store, Object.assign(tx, {
        renBtcAddress: data.gatewayAddress
    }))
}

// monitoring
export const initInstantMonitoring = function() {
    const store = this.props.store
    const network = store.get('selectedNetwork')

    swapMonitor = setInterval(async () => {
        const transactions = store.get('swap.transactions').filter(t => t.network === network)
        transactions.filter((t) => (t.instant && t.awaiting === 'btc-init')).map(async tx => {
            const req = await fetch(`${API_URL}/swap-gateway/status?gateway=${tx.renBtcAddress}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
            })

            const data = await req.json()
            if (data.status === 'complete') {
                updateTx(this.props.store, Object.assign(tx, {
                    awaiting: '',
                    txHash: data.txHash
                }))
            }
        })
    }, 1000)
}

export const initMonitoring = function() {
    const store = this.props.store
    const network = store.get('selectedNetwork')
    const pendingShiftIns = store.get('pendingShiftIns')
    let txs = store.get('swap.transactions')
        .concat(store.get('stream.transactions'))
        .filter(t => t.network === network)

    console.log('initMonitoring', store.getState())

    if (store.get('localWeb3Address')) {
        txs = txs.concat(store.get('collateralize.transactions'))
            .filter(t => t.network === network)
    }

    txs.map(tx => {
        if (tx.awaiting && !tx.instant) {
            if (pendingShiftIns.indexOf(tx.id) < 0) {
                initDeposit.bind(this)(tx)
            }
        } else if (tx.type === 'stream') {
            updateStreamInfo.bind(this)(tx)
        }
    })

    // transfers via gateway js
    recoverTrades.bind(this)()
}


window.shiftIns = []

export default {
    addTx,
    updateTx,
    removeTx,
    completeDeposit,
    initShiftIn,
    initDeposit,
    initMonitoring
}
