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
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(1),
        width: '100%'
    }
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

        return <Container maxWidth="lg">
            <Router>
                <Grid container>
                    {/*<Grid item xs={12}>
                        <NavContainer />
                    </Grid>*/}
                    <Grid item xs={12} sm={3} md={3}>
                        <ActionTabsContainer />
                    </Grid>
                    <Grid className={classes.content} item xs={12} sm={9} md={6}>
                        <div className={classes.warning}><Disclosure /></div>
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
                <AppWrapperComponent classes={classes}/>
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
