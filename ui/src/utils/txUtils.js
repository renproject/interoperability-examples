import RenJS from "@renproject/ren";
import adapterABI from './exchangeAdapterSimpleABI.json'
import streamAdapterABI from './streamAdapterSimpleABI.json'
import BigNumber from 'bignumber.js'

// const API_URL = ''
const API_URL = 'http://localhost:3000'
let swapMonitor = null

export const addTx = (store, tx) => {
    const storeString = tx.type === 'swap' ? 'swap.transactions' : 'stream.transactions'
    let txs = store.get(storeString)
    txs.push(tx)
    store.set(storeString, txs)
    localStorage.setItem(storeString, JSON.stringify(txs))
    // for debugging
    window[storeString] = txs
}

export const updateTx = (store, newTx) => {
    const storeString = newTx.type === 'swap' ? 'swap.transactions' : 'stream.transactions'
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
    const storeString = tx.type === 'swap' ? 'swap.transactions' : 'stream.transactions'
    let txs = store.get(storeString).filter(t => (t.id !== tx.id))
    // console.log(txs)
    store.set(storeString, txs)
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window[storeString] = txs
}

export const txExists = function(tx) {
    return this.props.store.get('transactions').filter(t => t.id === tx.id).length > 0
}

export const getStreams = async function() {
    // console.log('search', destAddress)
    const { store }  = this.props
    const web3 = store.get('web3')
    // const web3Context = store.get('web3Context')
    const adapterAddress = store.get('stream.adapterAddress')
    const adapterContract = new web3.eth.Contract(streamAdapterABI, adapterAddress)
    console.log(adapterContract)
    window.adapter = adapterContract
    const schedules = await adapterContract.methods.getSchedules().call()
    console.log(schedules)
    return schedules
}

export const recoverStreams = async function(destAddress) {
    const { store } = this.props
    const web3 = store.get('web3')
    const schedules = await getStreams.bind(this)()
    const beneficiary = web3.utils.fromAscii(destAddress)

    schedules.map(s => {
        console.log(s.beneficiary)
        if (s.beneficiary === beneficiary) {
            const amount = new BigNumber(s.amount)
            const tx = {
                id: 'tx-' + Math.random().toFixed(6),
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
                schedule: s
            }

            addTx(store, tx)
        } else {
            // show no results ui
        }
    })
}

// make this better
export const updateStreamInfo = async function(tx) {
    const { store } =  this.props
    const web3 = store.get('web3')
    const adapterAddress = store.get('stream.adapterAddress')
    const { startTime, destAddress } = tx

    const adapterContract = new web3.eth.Contract(streamAdapterABI, adapterAddress)

    const beneficiary = web3.utils.fromAscii(destAddress)
    const schedules = await getStreams.bind(this)()

    const schedule = schedules.filter(s => (
        Number(s.startTime) === Number(startTime) &&
        s.beneficiary === beneficiary
    ))[0]

    console.log('updateStreamInfo', schedules, schedule)

    if (schedule) {
        updateTx(store, Object.assign(tx, {
            schedule
        }))
    }
}

export const claim = async function(tx) {
    const { store }  = this.props
    const web3 = store.get('web3')
    const web3Context = store.get('web3Context')

    const adapterAddress = store.get('stream.adapterAddress')
    const { destAddress, schedule } = tx

    const adapterContract = new web3.eth.Contract(streamAdapterABI, adapterAddress)
    const gasPrice = await web3Context.lib.eth.getGasPrice()

    console.log('claiming tx', tx, schedule, schedule.id)

    try {
        const result = await adapterContract.methods.claim(
            schedule.id
        ).send({
            from: web3Context.accounts[0],
            gasPrice: Math.round(gasPrice * 1.5),
            gasLimit: 300000
        })
        console.log('result', result)
        updateStreamInfo.bind(this)(tx)
    } catch(e) {
        console.log(e)
    }
}

export const completeDeposit = async function(tx) {
    const { store }  = this.props
    const web3 = store.get('web3')
    const web3Context = store.get('web3Context')

    // const adapterAddress = store.get('adapterAddress')
    const { type, params, awaiting, renResponse, renSignature } = tx

    let adapterContract
    if (type === 'swap') {
        adapterContract = new web3.eth.Contract(adapterABI, store.get('adapterAddress'))
    } else if (type === 'stream') {
        adapterContract = new web3.eth.Contract(streamAdapterABI, store.get('stream.adapterAddress'))
    }

    const gasPrice = await web3Context.lib.eth.getGasPrice()

    updateTx(store, Object.assign(tx, { awaiting: 'eth-settle' }))

    console.log('completeDeposit', tx)

    try {
        let result
        if (type === 'swap') {
            result = await adapterContract.methods.shiftInWithSwap(
                params.contractParams[0].value,
                params.sendAmount,
                renResponse.args.nhash,
                renSignature
            ).send({
                from: web3Context.accounts[0],
                gasPrice: Math.round(gasPrice * 1.5),
                gasLimit: 200000
            })
        } else if (type === 'stream') {
            result = await adapterContract.methods.addVestingSchedule(
                params.contractParams[0].value,
                params.contractParams[1].value,
                Number(params.contractParams[2].value),
                params.sendAmount,
                renResponse.args.nhash,
                renSignature
            ).send({
                from: web3Context.accounts[0],
                gasPrice: Math.round(gasPrice * 1.5),
                gasLimit: 350000
            })
            await updateStreamInfo.bind(this)(tx)
        }
        updateTx(store, Object.assign(tx, { awaiting: '', txHash: result.transactionHash }))
    } catch(e) {
        console.log(e)
        updateTx(store, Object.assign(tx, { error: true }))
    }
}

export const initShiftIn = function(tx) {
    const {
      type,
      amount,
      renBtcAddress,
      params,
      ethSig,
      destAddress,
      // stream
      startTime,
      duration
    } = tx
    const {
        sdk,
        web3
    } = this.props.store.getState()

    let adapterAddress = ''
    let contractFn = ''
    let contractParams = []

    if (type === 'swap') {
        adapterAddress = this.props.store.get('adapterAddress')
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
    }

    // recreate shift in and override with existing data
    let shiftIn
    if (ethSig) {
        shiftIn = sdk.shiftIn({
            messageID: ethSig.messageID,
            sendTo: adapterAddress,
            contractFn,
            contractParams,
        });
    } else {
        const amt = new BigNumber(amount)
        let data = {
            sendToken: RenJS.Tokens.BTC.Btc2Eth,
            sendAmount: amt.times(10 ** 8).toNumber(), // Convert to Satoshis
            sendTo: adapterAddress,
            contractFn,
            contractParams,
        }

        if (params && params.nonce) {
            data.nonce = params.nonce
        }

        shiftIn = sdk.shiftIn(data)
    }

    if (renBtcAddress && params) {
        shiftIn.params = params
        shiftIn.gatewayAddress = renBtcAddress
    }

    return shiftIn
}

export const initDeposit = async function(tx) {
    const { store }  = this.props
    const { params, awaiting, renResponse, renSignature, error } = tx

    console.log('initDeposit', tx)

    // completed
    if (!awaiting) return

    // clear error when re-attempting
    if (error) {
        updateTx(store, Object.assign(tx, { error: false }))
    }

    // ren already exposed a signature
    if (renResponse && renSignature) {
        completeDeposit.bind(this)(tx)
    } else {
        // create or re-create shift in
        const shiftIn = await initShiftIn.bind(this)(tx)

        console.log('initDeposit shiftin', shiftIn)

        if (!params) {
            addTx(store, Object.assign(tx, {
                params: shiftIn.params,
                renBtcAddress: shiftIn.addr()
            }))
        }

        // wait for btc
        const deposit = await shiftIn.waitForDeposit(2);

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

export const initInstantSwap = async function(tx) {
    const { store }  = this.props
    const { params, awaiting, renResponse, renSignature, error } = tx

    // async getGateway() {
        const {
            amount,
            address
        } = this.props.store.getState()


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

export const initInstantMonitoring = function() {
    swapMonitor = setInterval(async () => {
        const transactions = this.props.store.get('swap.transactions')
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

    const txs = store.get('swap.transactions').concat(store.get('stream.transactions'))
    console.log('initMonitoring', txs)
    txs.map(tx => {
        if (tx.awaiting) {
            initDeposit.bind(this)(tx)
        } else if (tx.type === 'stream') {
            updateStreamInfo.bind(this)(tx)
        }
    })
}

export default {
    addTx,
    updateTx,
    removeTx,
    txExists,
    completeDeposit,
    initShiftIn,
    initDeposit,
    initMonitoring
}
