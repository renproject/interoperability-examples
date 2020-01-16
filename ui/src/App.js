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
      padding: theme.spacing(3),
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3),
      '& input': {
          marginBottom: theme.spacing(1)
      }
  },
  gateway: {
      marginTop: theme.spacing(2)
  },
  status: {
      fontSize: 14
  }
})

const initialState = {
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            address: '',
            amount: '',
            gateway: ''
        }

        this.interval = null
    }

    async componentDidMount() {
    }

    async getGateway() {
        const API_URL = 'http://localhost:3000'
        const request = await fetch(`${API_URL}/swap-gateway/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceAmount: this.state.amount,
                sourceAsset: 'BTC',
                destinationAsset: 'ETH',
                destinationAddress: '0x62ACc475F68254941e923958Fcad78e10A4CfF06'
            })
        })
        const json = await request.json()
        console.log(json)
        this.setState({
            gateway: json.gatewayAddress
        })

        if (this.interval) {
            clearInterval(this.interval)
        }

        this.interval = setInterval(async () => {
            const req = await fetch(`${API_URL}/swap-gateway/status?gateway=${json.gatewayAddress}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
            })

            const data = await req.json()
            this.setState({
                txHash: data.txHash,
                status: data.status
            })
        }, 1000)
    }

    render() {
        const classes = this.props.classes

        console.log(this.state, this.props)

        return (
            <ThemeProvider theme={theme}>
                <Container maxWidth="sm">
                    <Grid container>
                        <Grid item xs={12}>

                        </Grid>


                        <Grid item xs={12} className={classes.contentContainer}>
                            <Grid container direction='column'>
                                <Grid item xs={12}>
                                    <input placeholder='ETH Address' onChange={e => {
                                        this.setState({
                                            address: e.target.value
                                        })
                                    }}/>
                                </Grid>
                                <Grid item xs={12}>
                                    <input placeholder='BTC Amount' onChange={e => {
                                        this.setState({
                                            amount: e.target.value
                                        })
                                    }}/>
                                </Grid>
                                <Grid item xs={12}>
                                    <button onClick={this.getGateway.bind(this)}>Get Swap Address</button>
                                </Grid>
                                {this.state.gateway && <React.Fragment><Grid className={classes.gateway} item xs={12}>
                                        {this.state.gateway}
                                    </Grid>
                                    <Grid className={classes.status} item xs={12}>
                                        {this.state.status === 'complete' ? <span>
                                            Swap submitted! <a href={'https://kovan.etherscan.io/tx/' + this.state.txHash} target='_blank'>View transaction</a>
                                        </span> : <span>Waiting for {this.state.amount} BTC sent to gateway...</span>}
                                    </Grid></React.Fragment>}
                            </Grid>
                        </Grid>
                    </Grid>
                </Container>
            </ThemeProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
