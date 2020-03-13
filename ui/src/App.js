import React from 'react';
import { createStore, withStore } from '@spyna/react-store'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import {
    initMonitoring,
    initInstantMonitoring,
    updateTx,
    SWAP_ADAPTER_TEST,
    STREAM_ADAPTER_TEST,
    TRANSFER_ADAPTER_TEST,
    COLLATERALIZE_PROXY_ADDRESS_TEST
} from './utils/txUtils'

import {
    initNetworking,
    initLocalTransactions,
} from './utils/networkingUtils'

import {
    updateWalletData
} from './utils/walletUtils'


import ActionTabsContainer from './containers/ActionTabsContainer'
import DepositContainer from './containers/DepositContainer'
import TransferContainer from './containers/TransferContainer'
import StreamContainer from './containers/Stream/StreamContainer'
import CollateralizeContainer from './containers/CollateralizeContainer'


import theme from './theme/theme'

import { withStyles, ThemeProvider } from '@material-ui/styles';
import Grid from '@material-ui/core/Grid'


const styles = () => ({
    warning: {
        // marginTop: theme.spacing(4),
        marginBottom: theme.spacing(1),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        boxSizing: 'border-box',
        width: '100%',
        '& div': {
            background: '#DCE0E3',
        },
        '& span': {
            padding: theme.spacing(0.5),
            whiteSpace: 'normal',
            // fontSize: 12
        },
    },
    content: {
        [theme.breakpoints.up('xs')]: {
            minHeight: '100vh'
        },
        paddingTop: theme.spacing(6),
        paddingLeft: theme.spacing(4),
        paddingRight: theme.spacing(4)
    },
    actions: {
        minHeight: '100%',
        paddingBottom: theme.spacing(5)
    },
    info: {
        fontSize: 12,
        paddingTop: theme.spacing(6),
        paddingLeft: theme.spacing(4),
        paddingRight: theme.spacing(4),
        marginBottom: theme.spacing(1),
        '& p': {
            marginBottom: 0
        }
    },
    navButtonsContainer: {
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3)
    },
    walletButton: {
        width: 190,
        maxWidth: '100%',
        // margin: '0px auto'
    }
})

const initialState = {
    'selectedActionTab': 'transfer',
    'selectedNetwork': 'testnet',
    'pendingShiftIns': [],
    'web3': null,
    'web3Context': null,
    'sdk': null,
    'gjs': null,
    // local wallet
    'localWeb3': null,
    'localWeb3Address': '',
    'localWeb3Network': '',
    // collateralize
    'collateralize.selectedTab': 'borrow',
    'collateralize.borrowAmount': '',
    'collateralize.borrowDaiAmount': '',
    'collateralize.borrowBtcAddress': '2NGZrVvZG92qGYqzTLjCAewvPZ7JE8S8VxE',
    'collateralize.repayAmount': '',
    'collateralize.repayBtcAmount': '',
    'collateralize.repayAddress': '',
    'collateralize.balance': '0.000000',
    'collateralize.daiAllowance': '',
    'collateralize.daiAllowanceRequesting': '',
    'collateralize.transactions': [],
    'collateralize.adapterAddress': COLLATERALIZE_PROXY_ADDRESS_TEST,
    // transfer
    'transfer.amount': '',
    'transfer.balance': '0.000000',
    'transfer.instantSwapSelected': false,
    'transfer.transactions': [],
    'transfer.adapterAddress': TRANSFER_ADAPTER_TEST,
    // exchange
    'swap.transactions': [],
    'swap.adapterAddress': SWAP_ADAPTER_TEST,
    'swap.instantSwapSelected': false,
    'swap.amount': '',
    'swap.address': '',
    // streaming
    'stream.adapterAddress': STREAM_ADAPTER_TEST,
    'stream.transactions': [],
    'stream.amount': '',
    'stream.destination': '',
    'stream.duration': '',
    'stream.activeView': 'start',
    'stream.selectedTx': null,
    'stream.searchAddress': '',
    'stream.claimRequesting': false,
}


class AppWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    async componentDidMount() {
        await initNetworking.bind(this)('testnet')
        initLocalTransactions.bind(this)()

        // monitor normal swaps
        initMonitoring.bind(this)()

        // monitor instant swaps
        initInstantMonitoring.bind(this)()

        this.watchWalletData.bind(this)()

        window.store = this.props.store

        window.updateTx = updateTx.bind(this)
    }

    async watchWalletData() {
        await updateWalletData.bind(this)();
        this.props.store.set('localWeb3DataLoaded', true)
        setInterval(() => {
            updateWalletData.bind(this)();
        }, 10 * 1000);
    }

    render(){
        const { store, classes } = this.props
        const {
            selectedActionTab
        } = store.getState()

        return <Grid container>
            {/*<Grid item xs={12}>
                <NavContainer />
            </Grid>*/}
            <Grid item xs={12} sm={12} md={3} lg={3}>
                <ActionTabsContainer />
            </Grid>

            <Grid className={classes.content} item xs={12} sm={12} md={9} lg={6}>
                <Grid container className={classes.actions}>
                    <Grid item xs={12} sm={12} sm={12}>
                        {selectedActionTab === 'transfer' && <TransferContainer />}
                        {selectedActionTab === 'exchange' && <DepositContainer />}
                        {selectedActionTab === 'stream' && <StreamContainer />}
                        {selectedActionTab === 'collateralize' && <CollateralizeContainer />}
                    </Grid>

                </Grid>
            </Grid>
            {/*<Grid className={classes.navButtonsContainer} item xs={12} sm={12} md={3} lg={3}>
                <div className={classes.walletButton}>
                    <WalletButton />
                </div>
            </Grid>*/}
        </Grid>
    }
}

const AppWrapperComponent = withStore(AppWrapper)

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    async componentDidMount() {
    }

    render() {
        const { classes } = this.props
        return (
            <ThemeProvider theme={theme}>
                <AppWrapperComponent classes={classes}/>
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
