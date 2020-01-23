import React from 'react';
import { createStore, withStore } from '@spyna/react-store'

import DepositContainer from './containers/DepositContainer'

import theme from './theme/theme'
import classNames from 'classnames'

import { withStyles, ThemeProvider } from '@material-ui/styles';
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'



const styles = () => ({})

const initialState = {
    transactions: [],
    adapterAddress: '0x17BB7d6F4722373A88E2f4C8F91db91EE7d86dae',
    selectedTab: 0,
    instantSwapSelected: false,
    amount: '',
    address: ''
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    async componentDidMount() {
    }

    render() {
        const { classes, store } = this.props
        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="sm">
                    <DepositContainer />
                </Container>
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
