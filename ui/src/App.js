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
    STREAM_ADAPTER_TEST
} from './utils/txUtils'

import {
    initNetworking,
    initLocalTransactions,
} from './utils/networkingUtils'


import NavContainer from './containers/NavContainer'
import ActionTabsContainer from './containers/ActionTabsContainer'
import DepositContainer from './containers/DepositContainer'
import StreamContainer from './containers/Stream/StreamContainer'
import Disclosure from './components/Disclosure'

import theme from './theme/theme'
import classNames from 'classnames'

import { withStyles, ThemeProvider } from '@material-ui/styles';
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'

// import TabPanel from '@material-ui/core/TabPanel'



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
        minHeight: '100%'
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
})

const initialState = {
    'selectedActionTab': 'exchange',
    'selectedNetwork': 'testnet',
    'pendingShiftIns': [],
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

        window.store = this.props.store

        window.updateTx = updateTx.bind(this)
    }

    render(){
        const { store, classes } = this.props
        const {
            selectedActionTab
        } = store.getState()

        const network = store.get('selectedNetwork')
        const adapterAddress = store.get('swap.adapterAddress')

        return <Grid container>
            {/*<Grid item xs={12}>
                <NavContainer />
            </Grid>*/}
            <Grid item xs={12} sm={4} md={3}>
                <ActionTabsContainer />
            </Grid>
            <Grid className={classes.content} item xs={12} sm={8} md={9}>
                <Grid container className={classes.actions}>
                    <Grid item xs={12} sm={7} sm={6}>
                        {/*<div className={classes.warning}><Disclosure /></div>*/}
                        {selectedActionTab === 'exchange' && <DepositContainer />}
                        {selectedActionTab === 'stream' && <StreamContainer />}
                        {/*<Grid className={classes.info}>
                            {selectedActionTab === 'exchange' && <div><p>
                                <b className={classes.caption}>How it Works</b>
                                <br/>
                                <br/>
                                This exchange uses <a target='_blank' href='https://renproject.io/'>RenVM</a>, <a target='_blank' href='https://uniswap.io/'>Uniswap</a>, and Open Zeppelin's <a target='_blank' href='https://gsn.openzeppelin.com/'>GSN</a> to facilitate trustless interoperabilty between Bitcoin and Ethereum. All swaps abstract ETH away from the user with the <b>GaaS pattern</b>, and faster swaps are faciliated using the <b>CaaS pattern</b>. To learn more, check out our interoperability tutorials below:
                            </p>
                            <p>
                                <ul>
                                    <li><a target='_blank' href={'https://docs.renproject.io/developers/tutorials'}>GaaS Tutorial</a> | Gas-less transactions</li>
                                    <li><a target='_blank' href={'https://docs.renproject.io/developers/tutorials'}>CaaS tutorial</a> | Faster swaps via expedited confirmations</li>
                                </ul>
                            </p>
                            <p>
                                Swaps are submitted to the following adapter address: <a target='_blank' href={'https://' + (network === 'testnet' ? 'kovan.' : '') + 'etherscan.io/address/'+adapterAddress}>{adapterAddress}</a>
                            </p>
                            <p>
                                To learn more about building interoperable applications like this with RenVM, check out our <a target='_blank' href='https://renproject.io/developers'>developer center</a> or the following links:
                                <ul>
                                    <li><a target='_blank' href={'https://docs.renproject.io/developers/ren-sdk'}>Getting started with RenJS</a></li>
                                    <li><a target='_blank' href={'https://docs.renproject.io/developers/gateway-js'}>Getting started with GatewayJS</a></li>
                                    <li><a target='_blank' href={'https://github.com/renproject/ren/wiki'}>Github Spec</a></li>
                                </ul>
                            </p></div>}
                            {selectedActionTab === 'stream' && <div><p>
                                <b className={classes.caption}>How it Works</b>
                                <br/>
                                <br/>
                                Streams use <a target='_blank' href='https://renproject.io/'>RenVM</a> and Open Zeppelin's <a target='_blank' href='https://gsn.openzeppelin.com/'>GSN</a> to facilitate trustless interoperabilty between Bitcoin and Ethereum. Active streams are held in a smart contract that allows anyone to shift out a valid amount of earned BTC to the recipient BTC address at any time.
                            </p>
                            <p>
                                Streams are facilitated through the following adapter address: <a target='_blank' href={'https://'+ (network === 'testnet' ? 'kovan.' : '') +'etherscan.io/address/'+adapterAddress}>{adapterAddress}</a>
                            </p>
                            <p>
                                To learn more about building interoperable applications like this with RenVM, check out our <a target='_blank' href='https://renproject.io/developers'>developer center</a> or the following links:
                            </p>
                            <ul>
                                <li><a target='_blank' href={'https://docs.renproject.io/developers/tutorials'}>Bitcoin Payments Tutorial</a> | Scheduled Bitcoin Payments</li>
                                <li><a target='_blank' href={'https://docs.renproject.io/developers/ren-sdk'}>Getting started with RenJS</a></li>
                                <li><a target='_blank' href={'https://docs.renproject.io/developers/gateway-js'}>Getting started with GatewayJS</a></li>
                                <li><a target='_blank' href={'https://github.com/renproject/ren/wiki'}>Github Spec</a></li>
                            </ul></div>}
                        </Grid>*/}
                    </Grid>

                </Grid>
            </Grid>
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
