import React from 'react';
import { createStore, withStore } from '@spyna/react-store'

import NavContainer from './containers/NavContainer'

import theme from './theme/theme'
import classNames from 'classnames'

import { withStyles, ThemeProvider } from '@material-ui/styles';
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'

const styles = () => ({
  root: {
    flexGrow: 1,
  },
  paper: {
  },
  navContainer: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(3),
    minHeight: 52
  },
  contentContainer: {
      boxShadow: '0px 0px 30px 0px rgba(0, 0, 0, 0.05)',
      borderRadius: theme.shape.borderRadius,
      padding: 0,
      marginBottom: theme.spacing(3)
  }
})

const initialState = {
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    async componentDidMount() {
        const API_URL = 'http://localhost:3000'
        const request = await fetch(`${API_URL}/swap-gateway/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceAmount: '0.00001',
                sourceAsset: 'BTC',
                destinationAsset: 'ETH',
                destinationAddress: '0x62ACc475F68254941e923958Fcad78e10A4CfF06'
            })
        })

        console.log(await request.json())
    }

    render() {
        const classes = this.props.classes

        console.log(this.state, this.props)

        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="sm">
                    <Grid container>
                        <Grid item xs={12}><br/></Grid>
                        <Grid item xs={12} className={classes.contentContainer}>
                        </Grid>
                    </Grid>
                </Container>
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
