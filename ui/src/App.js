import React from 'react';
import { createStore, withStore } from '@spyna/react-store'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import {
    fromConnection,
    ephemeral
} from "@openzeppelin/network/lib";

import {
    initMonitoring,
    initInstantMonitoring,
    updateTx,
} from './utils/txUtils'
import RenJS from "@renproject/ren";

import NavContainer from './containers/NavContainer'
import ActionTabsContainer from './containers/ActionTabsContainer'
import DepositContainer from './containers/DepositContainer'
import StreamContainer from './containers/Stream/StreamContainer'


import theme from './theme/theme'
import classNames from 'classnames'

import { withStyles, ThemeProvider } from '@material-ui/styles';
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
// import TabPanel from '@material-ui/core/TabPanel'

const REACT_APP_TX_FEE = 100;
const signKey = ephemeral();
// const gasPrice = 10000000000;
const relay_client_config = {
  txfee: REACT_APP_TX_FEE,
  // force_gasPrice: gasPrice, //override requested gas price
  // gasPrice: gasPrice, //override requested gas price
  // force_gasLimit: 200000, //override requested gas limit.
  // gasLimit: 200000, //override requested gas limit.
  verbose: true
};

const styles = () => ({
})

const initialState = {
    'selectedActionTab': 'exchange',
    'selectedNetwork': 'testnet',
    // exchange
    'swap.transactions': [],
    'swap.adapterAddress': '0xade8792c3ee90320cabde200ccab34b27cc88651',
    'swap.instantSwapSelected': false,
    'swap.amount': '',
    'swap.address': '',
    // streaming
    'stream.adapterAddress': '0x49ADDF7Cae3552C3f6991b6931DbcfAc28E11846',
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
        const { store } = this.props

        const web3Context = await fromConnection(
            "https://kovan.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2",
            {
                gsn: { signKey, ...relay_client_config }
            }
        )

        store.set('web3Context', web3Context)
        store.set('web3', web3Context.lib)

        const sdk = new RenJS('testnet')
        store.set('sdk', sdk)

        const swaps = localStorage.getItem('swap.transactions')
        const streams = localStorage.getItem('stream.transactions')

        if (swaps) {
            store.set('swap.transactions', JSON.parse(swaps))
        }

        if (streams) {
            store.set('stream.transactions', JSON.parse(streams))
        }

        // monitor normal swaps
        initMonitoring.bind(this)()

        // monitor instant swaps
        initInstantMonitoring.bind(this)()

        window.store = store

        window.updateTx = updateTx.bind(this)
    }

    render(){
        const { store } = this.props
        const {
            selectedActionTab
        } = store.getState()


        return <Container maxWidth="lg">
            <Router>
                <Grid container>
                    {/*<Grid item xs={12}>
                        <NavContainer />
                    </Grid>*/}
                    <Grid item sm={3}>
                        <ActionTabsContainer />
                    </Grid>
                    <Grid item sm={6}>
                        <Switch>
                            <Route exact path="/" component={<DepositContainer />}>
                                {<DepositContainer />}
                            </Route>
                            <Route path="/stream">
                                {<StreamContainer />}
                            </Route>
                        </Switch>
                    </Grid>
                </Grid>
            </Router>
        </Container>
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
                <AppWrapperComponent/>
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
