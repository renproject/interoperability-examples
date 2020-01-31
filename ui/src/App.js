import React from 'react';
import { createStore, withStore } from '@spyna/react-store'


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

const styles = () => ({
})

const initialState = {
    'selectedActionTab': 'exchange',
    // exchange
    'swap.transactions': [],
    'adapterAddress': '0xade8792c3ee90320cabde200ccab34b27cc88651',
    'instantSwapSelected': false,
    'amount': '',
    'address': '',
    // streaming
    'stream.adapterAddress': '0x0860983E8A3fd15848BCFb294076F4301b03926E',
    'stream.transactions': [],
    'stream.amount': '',
    'stream.destination': '',
    'stream.duration': '',
    'stream.activeView': 'start',
    'stream.selectedTx': null

}

const AppWrapper = withStore(function(props) {
    const { store } = props
    const {
        selectedActionTab
    } = store.getState()

    return <Container maxWidth="lg">
        <Grid container>
            {/*<Grid item xs={12}>
                <NavContainer />
            </Grid>*/}
            <Grid item sm={3}>
                <ActionTabsContainer />
            </Grid>
            <Grid item sm={6}>
                {selectedActionTab === 'exchange' && <DepositContainer />}
                {selectedActionTab === 'stream' && <StreamContainer />}
            </Grid>
        </Grid>
    </Container>
})

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
                <AppWrapper />
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
