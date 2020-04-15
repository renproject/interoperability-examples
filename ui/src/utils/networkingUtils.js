import RenJS from "@renproject/ren";
import GatewayJS from "@renproject/gateway";
import {
    fromConnection,
    ephemeral
} from "@openzeppelin/network/lib";

import {
    initMonitoring,
    initInstantMonitoring,
    TRANSFER_ADAPTER_TEST,
    TRANSFER_ADAPTER_MAIN,
    SWAP_ADAPTER_TEST,
    SWAP_ADAPTER_MAIN,
    STREAM_ADAPTER_TEST,
    STREAM_ADAPTER_MAIN
} from './txUtils'


const REACT_APP_TX_FEE = 100;
const signKey = ephemeral();
const relay_client_config = {
  txfee: REACT_APP_TX_FEE,
  verbose: true
};

console.log(GatewayJS)

export const initNetworking = async function(network) {
    const { store } = this.props

    const web3Context = await fromConnection(
        `https://${network === 'testnet' ? 'kovan' : 'mainnet'}.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2`,
        {
            gsn: { signKey, ...relay_client_config }
        }
    )

    store.set('web3Context', web3Context)
    store.set('web3', web3Context.lib)

    const sdk = new RenJS(network)
    store.set('sdk', sdk)

    const gjs = new GatewayJS('testnet')
    store.set('gjs', gjs)

    store.set('swap.adapterAddress', network === 'testnet' ? SWAP_ADAPTER_TEST : SWAP_ADAPTER_MAIN)
    store.set('stream.adapterAddress', network === 'testnet' ? STREAM_ADAPTER_TEST : STREAM_ADAPTER_MAIN)
    store.set('transfer.adapterAddress', network === 'testnet' ? TRANSFER_ADAPTER_TEST : TRANSFER_ADAPTER_MAIN)

    // turn instant off
    store.set('swap.instantSwapSelected', false)
}

export const initLocalTransactions = async function() {
    const { store } = this.props
    const swaps = localStorage.getItem('swap.transactions')
    const streams = localStorage.getItem('stream.transactions')
    const transfers = localStorage.getItem('transfer.transactions')
    const collateralizes = localStorage.getItem('collateralize.transactions')

    if (swaps) {
        store.set('swap.transactions', JSON.parse(swaps))
    }

    if (streams) {
        store.set('stream.transactions', JSON.parse(streams))
    }

    if (transfers) {
        store.set('transfer.transactions', JSON.parse(transfers))
    }

    if (collateralizes) {
        store.set('collateralize.transactions', JSON.parse(collateralizes))
    }
}

export const switchNetwork = async function(network) {
    const { store } = this.props
    store.set('selectedNetwork', network)
    await initNetworking.bind(this)(network)
    initLocalTransactions.bind(this)()
    initMonitoring.bind(this)()
    initInstantMonitoring.bind(this)()
}


export default {
    initNetworking,
    initLocalTransactions
}
