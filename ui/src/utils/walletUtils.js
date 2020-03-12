import Web3 from 'web3'
import Web3Modal from 'web3modal'
import Authereum from "authereum"
import Torus from "@toruslabs/torus-embed"

import proxyABI from './btcVaultProxyABI.json'
import erc20Abi from './erc20ABI.json'

import {
    COLLATERALIZE_PROXY_ADDRESS_TEST,
    COLLATERALIZE_DIRECT_PROXY_ADDRESS_TEST,
    ZBTC_ADDRESS_TEST,
    DAI_ADDRESS_TEST,
    initMonitoring
} from './txUtils'

export const updateWalletData = async function() {
    const store = this.props.store

    const web3 = store.get('localWeb3')
    const walletAddress = store.get('localWeb3Address')

    if (!web3 || !walletAddress) {
        return
    }

    const contract = new web3.eth.Contract(erc20Abi, DAI_ADDRESS_TEST);

    const balance = await contract.methods.balanceOf(walletAddress).call();
    store.set('collateralize.balance', Number(web3.utils.fromWei(balance)).toFixed(6))

    const daiAllowance = await getDAIAllowance.bind(this)()
    store.set('collateralize.daiAllowance', daiAllowance)
}

export const initLocalWeb3 = async function() {
    const { store } = this.props

    const providerOptions = {
        authereum: {
            package: Authereum, // required
            options: {}
        },
        torus: {
            package: Torus, // required
            options: {
                // enableLogging: false, // optional
                // buttonPosition: "bottom-left", // optional
                // buildEnv: "production", // optional
                // showTorusButton: true, // optional
                // enabledVerifiers: {
                //     // optional
                //     google: false // optional
                // }
            }
        }
    }

    const web3Modal = new Web3Modal({
        network: "kovan", // optional
        cacheProvider: false, // optional
        providerOptions // required
    })

    console.log('web3Modal', web3Modal)

    const provider = await web3Modal.connect()
    const web3 = new Web3(provider)
    const accounts = await web3.eth.getAccounts()
    let network = ''
    if (web3.currentProvider.networkVersion === '1') {
        network = 'mainnet'
    } else if (web3.currentProvider.networkVersion === '42') {
        network = 'testnet'
    }

    store.set('localWeb3', web3)
    store.set('localWeb3Address', accounts[0])
    store.set('localWeb3Network', network)

    updateWalletData.bind(this)()
    initMonitoring.bind(this)()
}

export const getDAIAllowance = async function() {
    const store = this.props.store
    const walletAddress = store.get('localWeb3Address')
    const web3 = store.get('localWeb3')

    const contract = new web3.eth.Contract(erc20Abi, DAI_ADDRESS_TEST)
    try {
        return await contract.methods.allowance(walletAddress, COLLATERALIZE_PROXY_ADDRESS_TEST).call()
    } catch(e) {
        console.log(e)
        return ''
    }
}

export const setDAIAllowance = async function() {
    const store = this.props.store
    const walletAddress = store.get('localWeb3Address')
    const web3 = store.get('localWeb3')

    const contract = new web3.eth.Contract(erc20Abi, DAI_ADDRESS_TEST)
    store.set('collateralize.daiAllowanceRequesting', true)
    try {
        return await contract.methods.approve(COLLATERALIZE_PROXY_ADDRESS_TEST, web3.utils.toWei('1000000')).send({
            from: walletAddress
        })
        await updateWalletData.bind(this)();
        store.set('collateralize.daiAllowanceRequesting', false)
    } catch(e) {
        console.log(e)
        store.set('collateralize.daiAllowanceRequesting', false)
    }
}

export const burnDai = async function() {
    const { store } = this.props

    const repayAmount = store.get('collateralize.repayAmount')
    const repayBtcAmount = store.get('collateralize.repayBtcAmount')
    const walletAddress = store.get('localWeb3Address')
    const web3 = store.get('localWeb3')

    console.log('burnDai', repayAmount, repayBtcAmount)
    const contract = new web3.eth.Contract(proxyABI, COLLATERALIZE_PROXY_ADDRESS_TEST)
    const result = await contract.methods.burnDai(
        String(Math.round(Number(repayBtcAmount) * (10 ** 8))),
        web3.utils.toWei(repayAmount),
        // '14000',
        // '1000000000000000000'
    ).send({
        from: walletAddress
    })
    console.log('burnDai result', result)
}


export default {
    initLocalWeb3,
}
