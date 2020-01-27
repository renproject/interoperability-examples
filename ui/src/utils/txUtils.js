import RenJS from "@renproject/ren";
import adapterABI from './exchangeAdapterSimpleABI.json'

const API_URL = ''
// const API_URL = 'http://localhost:3000'
let swapMonitor = null

export const addTx = (store, tx) => {
    let txs = store.get('transactions')
    txs.push(tx)
    store.set('transactions', txs)
    localStorage.setItem('transactions', JSON.stringify(txs))
    // for debugging
    window.txs = txs
}

export const updateTx = (store, newTx) => {
    // console.log('updateTx', newTx)
    const txs = store.get('transactions').map(t => {
        if (t.id === newTx.id) {
            // const newTx = Object.assign(t, props)
            return newTx
        }
        return t
    })
    store.set('transactions', txs)
    localStorage.setItem('transactions', JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const removeTx = (store, id) => {
    let txs = store.get('transactions').filter(t => (t.id !== id))
    // console.log(txs)
    store.set('transactions', txs)
    localStorage.setItem('transactions', JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const txExists = function(tx) {
    return this.props.store.get('transactions').filter(t => t.id === tx.id).length > 0
}

export const completeDeposit = async function(tx) {
    const { store }  = this.props
    const web3 = store.get('web3')
    const web3Context = store.get('web3Context')

    const adapterAddress = store.get('adapterAddress')
    const { params, awaiting, renResponse, renSignature } = tx

    const adapterContract = new web3.eth.Contract(adapterABI, adapterAddress)
    const gasPrice = await web3Context.lib.eth.getGasPrice()

    updateTx(store, Object.assign(tx, { awaiting: 'eth-settle' }))

    try {
        const result = await adapterContract.methods.shiftInWithSwap(
            params.contractParams[0].value,
            params.sendAmount,
            renResponse.args.nhash,
            renSignature
        ).send({
            from: web3Context.accounts[0],
            gasPrice: Math.round(gasPrice * 1.5)
        })
        console.log('result', result)
        updateTx(store, Object.assign(tx, { awaiting: '', txHash: result.transactionHash }))
    } catch(e) {
        console.log(e)
        updateTx(store, Object.assign(tx, { error: true }))
    }
}

export const initShiftIn = function(tx) {
    const { amount, renBtcAddress, params, ethSig, destAddress } = tx
    const {
        sdk,
        adapterAddress
    } = this.props.store.getState()

    // recreate shift in and override with existing data
    let shiftIn
    if (ethSig) {
        shiftIn = sdk.shiftIn({
            messageID: ethSig.messageID,
            sendTo: adapterAddress,
            contractFn: "shiftInWithSwap",
            contractParams: [
                {
                    name: "_to",
                    type: "address",
                    value: destAddress,
                }
            ],
        });
    } else {
        let data = {
            sendToken: RenJS.Tokens.BTC.Btc2Eth,
            sendAmount: Math.floor(amount * (10 ** 8)), // Convert to Satoshis
            sendTo: adapterAddress,
            contractFn: "shiftInWithSwap",
            contractParams: [
                {
                    name: "_to",
                    type: "address",
                    value: destAddress,
                }
            ],
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
        const transactions = this.props.store.get('transactions')
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
    const transactions = this.props.store.get('transactions')
    const pending = transactions.filter(t => (t.awaiting))
    pending.map(p => {
        initDeposit.bind(this)(p)
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
