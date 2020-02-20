import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
// import Tabs from '@material-ui/core/Tabs';
// import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Switch from '@material-ui/core/Switch';

import BigNumber from "bignumber.js";
import RenJS from "@renproject/ren";

import {
    fromConnection,
    ephemeral
} from "@openzeppelin/network/lib";

import {
    switchNetwork
} from '../utils/networkingUtils'

import NetworkChooser from '../components/NetworkChooser'
import SwapTransactionStatus from '../components/SwapTransactionStatus'

import {
    initDeposit,
    initMonitoring,
    initInstantMonitoring,
    removeTx,
    updateTx,
    initInstantSwap
} from '../utils/txUtils'

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
  wrapper: {
      // minWidth: '100%',
      // width: 572,
      // marginLeft: 'auto',
      // marginRight: 'auto',
  },
  contentContainer: {
      // boxShadow: '0px 0px 30px 0px rgba(0, 0, 0, 0.05)',
      borderRadius: theme.shape.borderRadius * 2,
      border: '1px solid #DCE0E3',
      // padding: theme.spacing(3),
      background: '#fff',
      boxShadow: '0px 0px 4px rgba(0, 27, 58, 0.1)',
      width: 572,
      boxSizing: 'border-box',

      // marginTop: theme.spacing(4),
      marginBottom: theme.spacing(3),
      '& input': {
      }
  },
  input: {
      // marginBottom: theme.spacing(2),
      width: '100%',
  },
  inputContainer: {
      padding: theme.spacing(3)
  },
  amountContainer: {
    paddingRight: theme.spacing(2)
  },
  amount: {
  },
  switch: {
    float: 'right'
  },
  title: {
      fontSize: 16,
      fontWeight: 500,
      marginTop: theme.spacing(4)
  },
  unfinished: {
      // marginTop: theme.spacing(3)
      padding: theme.spacing(3)
  },
  depositItem: {
      fontSize: 12,
      marginBottom: theme.spacing(1)
  },
  depositStatus: {
      display: 'flex',
      justifyContent: 'space-between'
  },
  info: {
      fontSize: 12,
      marginBottom: theme.spacing(1),
      '& p': {
          marginBottom: 0
      }
  },
  divider: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3),
      backgroundColor: '#999999'
  },
  desc: {
      marginBottom: theme.spacing(4),
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
  },
  btcLink: {
      fontSize: 12
  },
  viewLink: {
      fontSize: 12,
      marginRight: theme.spacing(1),
  },
  actionTabs: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2)
  },
  swapButtonContainer: {
      textAlign: 'center',
      padding: theme.spacing(3),
      // paddingTop: theme.spacing(1),
      // paddingBottom: theme.spacing(1)
  },
  switchContainer: {
      // textAlign: 'center',
      padding: theme.spacing(3),
      // paddingBottom: theme.spacing(1),
      '& .MuiFormControlLabel-label': {
          fontSize: 12
      }
  },
  swapButton: {
  }
})

class Ellipsis extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            string: ''
        }
        this.interval = null
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            const string = this.state.string
            if (string.length < 3) {
                this.setState({ string: (string + '.') })
            } else {
                this.setState({ string: '' })
            }
        }, 500);
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    render() {
        return <span>{this.state.string}</span>
    }
}

class DepositContainer extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {
    }

    componentWillUnmount() {
        clearInterval(this.swapMonitor)
    }

    async start() {
        const { store } = this.props
        const amount = store.get('swap.amount')
        const address = store.get('swap.address')
        const transactions = store.get('swap.transactions')
        const network = store.get('selectedNetwork')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            network,
            type: 'swap',
            instant: false,
            awaiting: 'btc-init',
            destAddress: address,
            amount: amount,
            error: false,
            txHash: ''
        }

        initDeposit.bind(this)(tx)
    }

    async startInstant() {
        const { store } = this.props
        const amount = store.get('swap.amount')
        const address = store.get('swap.address')
        const transactions = store.get('swap.transactions')
        const network = store.get('selectedNetwork')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            network,
            type: 'swap',
            instant: true,
            awaiting: 'btc-init',
            destAddress: address,
            amount: amount,
            error: false,
            txHash: ''
        }

        initInstantSwap.bind(this)(tx)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const network = store.get('selectedNetwork')
        const adapterAddress = store.get('swap.adapterAddress')
        const instantSwapSelected = store.get('swap.instantSwapSelected')
        const transactions = store.get('swap.transactions').filter(t => t.network === network)
        const amount = store.get('swap.amount')
        const address = store.get('swap.address')
        const showInstant = network === 'testnet'

        console.log(store.getState())

        const disabled = amount <= 0.0001 || (amount > 0.0005 && instantSwapSelected) || !address

        return <div><Grid container justify='center' className={classes.wrapper} >
            {/*<Typography variant={'h1'} className={classes.title}>Kovan ETH – Testnet BTC Exchange</Typography>*/}

            <Grid className={classes.contentContainer}>
                <Grid container direction='row'>
                    {/*<Grid className={classes.desc} item xs={12}>
                        <span >Swap BTC for ETH</span>
                        <NetworkChooser
                            currentNetwork={network}
                            onChange={(e) => {
                                switchNetwork.bind(this)(e.target.value)
                            }} />
                    </Grid>*/}
                    <Grid item xs={12}>
                        <Grid container className={classes.inputContainer}>
                            <Grid item xs={4} className={classes.amountContainer}>
                                <TextField className={classNames(classes.input, classes.amount)}
                                    label='Input'
                                    variant='filled'
                                    placeholder=''
                                    onChange={e => {
                                        store.set('swap.amount', e.target.value)
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment className={classes.endAdornment} position="end">BTC</InputAdornment>
                                    }}/>
                            </Grid>
                            <Grid item xs={8}>
                                <TextField className={classNames(classes.input, classes.address)}
                                    label='Send ETH to Ethereum Address'
                                    variant='filled'
                                    helperText=''
                                    placeholder=''
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    onChange={e => {
                                        store.set('swap.address', e.target.value)
                                    }}/>
                            </Grid>
                        </Grid>

                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12} className={classes.switchContainer}>
                        <Grid container>
                            <Grid item xs={9}>
                                <Typography variant='subtitle1'>Faster Transaction</Typography>
                                <Typography variant='caption'>
                                    Pay a 0.1% fee to enable an swap after 0 BTC confirmations. Faster swaps have a maximum of 0.0005&nbsp;BTC.
                                </Typography>
                            </Grid>
                            <Grid item xs={3}>
                                {showInstant && <Switch className={classes.switch} checked={instantSwapSelected}
                                    color='primary'
                                    onChange={() => store.set('swap.instantSwapSelected', !instantSwapSelected)}
                                    value={"instant"} />}
                                {/*showInstant && <FormControlLabel control={<Switch checked={instantSwapSelected}
                                    color='primary'
                                    onChange={() => store.set('swap.instantSwapSelected', !instantSwapSelected)}
                                    value={"instant"} />} label="Faster swap (0 confirmations, 0.0005 BTC max)" />*/}
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12} className={classes.swapButtonContainer}>
                        <Button disabled={disabled} className={classes.swapButton} variant='contained' color='primary' size='large' onClick={instantSwapSelected ? this.startInstant.bind(this) : this.start.bind(this)}>Reveal BTC Deposit Address</Button>
                    </Grid>
                    {transactions && transactions.length ? <Grid item xs={12}><Divider/></Grid> : null}
                    <Grid item xs={12} className={classes.unfinished}>
                        {transactions && transactions.length ? transactions.map((tx, index) => {
                                return <Grid key={index} container direction='row' className={classes.depositItem}>
                                    <Grid item xs={3}>
                                        <Typography variant='caption'>{tx.amount} BTC</Typography>
                                    </Grid>
                                    <Grid className={classes.depositStatus} item xs={9}>
                                        <SwapTransactionStatus tx={tx} />
                                        <div>
                                            {tx.awaiting === 'btc-settle' ? <a className={classes.viewLink} target='_blank' href={`https://live.blockcypher.com/${tx.network === 'testnet' ? 'btc-testnet' : 'btc'}/tx/${tx.btcTxHash}`}>View transaction</a> : null}
                                            {tx.awaiting === 'btc-init' || tx.error || !tx.awaiting ? <div>
                                                {tx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://' + (tx.network === 'testnet' ? 'kovan.' : '') + 'etherscan.io/tx/'+tx.txHash}>View transaction</a> : null}
                                                <a href='javascript:;' onClick={() => {
                                                    removeTx(store, tx)
                                                }}>{!tx.awaiting ? 'Clear' : 'Cancel'}</a></div> : null}
                                        </div>
                                    </Grid>
                                </Grid>
                            }) : null}
                    </Grid>
                </Grid>
            </Grid>
        </Grid></div>
    }
}

export default withStyles(styles)(withStore(DepositContainer))
