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
    initDeposit,
    initMonitoring,
    initInstantMonitoring,
    removeTx,
    initInstantSwap
} from '../utils/txUtils'

const REACT_APP_TX_FEE = 100;
const signKey = ephemeral();
// const gasPrice = 10000000000;
const relay_client_config = {
  txfee: REACT_APP_TX_FEE,
  // force_gasPrice: gasPrice, //override requested gas price
  // gasPrice: gasPrice, //override requested gas price
  force_gasLimit: 200000, //override requested gas limit.
  gasLimit: 200000, //override requested gas limit.
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
  contentContainer: {
      // boxShadow: '0px 0px 30px 0px rgba(0, 0, 0, 0.05)',
      // borderRadius: theme.shape.borderRadius,
      border: '1px solid #333',
      padding: theme.spacing(3),
      marginTop: theme.spacing(4),
      marginBottom: theme.spacing(3),
      '& input': {
      }
  },
  input: {
      marginBottom: theme.spacing(2),
      width: '100%',
      '& input': {
          fontSize: 12
      },
      '& p': {
          fontSize: 12
      },
      '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(0, 0, 0, 0.5) !important'
      }
  },
  amountContainer: {
    paddingRight: theme.spacing(1)
  },
  amount: {
  },
  title: {
      fontSize: 16,
      fontWeight: 500,
      marginTop: theme.spacing(4)
  },
  unfinished: {
      // marginTop: theme.spacing(3)
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
      marginBottom: theme.spacing(3)
  },
  desc: {
      marginBottom: theme.spacing(3),
      fontSize: 14,
      display: 'flex',
      alignItems: 'flex-end',
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
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1)
  },
  switchContainer: {
      textAlign: 'center',
      paddingBottom: theme.spacing(1),
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

        const txs = localStorage.getItem('transactions')

        if (txs) {
            store.set('transactions', JSON.parse(txs))
        }

        // monitor normal swaps
        initMonitoring.bind(this)()

        // monitor instant swaps
        initInstantMonitoring.bind(this)()
    }

    componentWillUnmount() {
        clearInterval(this.swapMonitor)
    }

    async start() {
        const { store } = this.props
        const amount = store.get('amount')
        const address = store.get('address')
        const transactions = store.get('transactions')

        const tx = {
            id: 'tx-' + Math.random().toFixed(6),
            type: 'deposit',
            instant: false,
            awaiting: 'btc-init',
            source: 'btc',
            dest: 'eth',
            destAddress: address,
            amount: amount,
            error: false,
            txHash: ''
        }

        initDeposit.bind(this)(tx)
    }

    async startInstant() {
        const { store } = this.props
        const amount = store.get('amount')
        const address = store.get('address')
        const transactions = store.get('transactions')

        const tx = {
            id: Math.random(),
            type: 'deposit',
            instant: true,
            awaiting: 'btc-init',
            source: 'btc',
            dest: 'eth',
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

        const {
            transactions,
            adapterAddress,
            selectedTab,
            instantSwapSelected,
            amount,
            address
        } = store.getState()

        console.log(store.getState())

        const disabled = amount < 0.0001 || (amount > 0.0005 && instantSwapSelected) || !address

        return <Grid container>
            <Typography variant={'h1'} className={classes.title}>Kovan ETH – Testnet BTC Exchange</Typography>

            <Grid item xs={12} className={classes.contentContainer}>
                <Grid container direction='column'>
                    <Grid className={classes.desc} item xs={12}>
                        <span >Swap Testnet BTC for Kovan ETH</span>
                        <span className={classes.btcLink}>Send testnet BTC from <a target='_blank' href={'https://tbtc.bitaps.com/'}>here</a></span>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container>
                            <Grid item xs={4} className={classes.amountContainer}>
                                <TextField className={classNames(classes.input, classes.amount)}
                                    variant='outlined'
                                    size='small'
                                    placeholder='0.000000'
                                    onChange={e => {
                                        store.set('amount', e.target.value)
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment className={classes.endAdornment} position="end">BTC</InputAdornment>
                                    }}/>
                            </Grid>
                            <Grid item xs={8}>
                                <TextField className={classNames(classes.input, classes.address)} variant='outlined' size='small' placeholder='Send to ETH Address' onChange={e => {
                                    store.set('address', e.target.value)
                                }}/>
                            </Grid>
                        </Grid>

                    </Grid>
                    <Grid item xs={12} className={classes.switchContainer}>
                        <FormControlLabel control={<Switch checked={instantSwapSelected}
                            color='primary'
                            onChange={() => store.set('instantSwapSelected', !instantSwapSelected)}
                            value={"instant"} />} label="Faster swap (0 confirmations, 0.0005 BTC max)" />
                    </Grid>
                    <Grid item xs={12} className={classes.swapButtonContainer}>
                        <Button disabled={disabled} className={classes.swapButton} variant='outlined' color='primary' onClick={instantSwapSelected ? this.startInstant.bind(this) : this.start.bind(this)}>Start Swap</Button>
                    </Grid>
                    {transactions && transactions.length ? <Divider className={classes.divider} /> : null}
                    <Grid item xs={12} className={classes.unfinished}>
                        {transactions && transactions.length ? transactions.map((tx, index) => {
                            return <Grid key={index} container direction='row' className={classes.depositItem}>
                                <Grid item xs={3}>
                                    {tx.amount} BTC
                                </Grid>
                                <Grid className={classes.depositStatus} item xs={9}>
                                    {tx.awaiting === 'btc-init' ? <span>
                                        {`Waiting for ${tx.instant ? '0' : '2'} confirmations to`}<Ellipsis/>{` ${tx.renBtcAddress}`}
                                    </span> : null}
                                    {tx.awaiting === 'ren-settle' ? <span>
                                        {`Submitting to RenVM`}<Ellipsis/>
                                    </span> : null}
                                    {tx.awaiting === 'eth-settle' ? <span>
                                        {`Submitting to Ethereum`}<Ellipsis/>
                                    </span> : null}
                                    {!tx.awaiting ? `Deposit complete` : null}
                                    {tx.awaiting === 'btc-init' || tx.error || !tx.awaiting ? <div>
                                        {tx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://kovan.etherscan.io/tx/'+tx.txHash}>View transaction</a> : null}
                                        <a href='javascript:;' onClick={() => {
                                            removeTx(store, tx.id)
                                        }}>{!tx.awaiting ? 'Clear' : 'Cancel'}</a></div> : null}
                                </Grid>
                            </Grid>
                        }) : null}
                    </Grid>
                </Grid>
            </Grid>

            {<Grid item xs={12} className={classes.info}>
                <p>
                    <b className={classes.caption}>How it Works</b>
                    <br/>
                    <br/>
                    This exchange uses <a target='_blank' href='https://renproject.io/'>RenVM</a>, <a target='_blank' href='https://uniswap.io/'>Uniswap</a>, and Open Zeppelin's <a target='_blank' href='https://gsn.openzeppelin.com/'>GSN</a> to facilitate trustless interoperabilty between Bitcoin and Ethereum. All swaps abstract ETH away from the user with the <b>GaaS pattern</b>, and faster swaps are faciliated using the <b>CaaS pattern</b>. To learn more, check out our interoperability tutorials below:
                </p>
                <p>
                    <ul>
                        <li><a target='_blank' href={'https://docs.renproject.io/developers/tutorials'}>GaaS tutorial</a> (Gas-less tranasactions)</li>
                        <li><a target='_blank' href={'https://docs.renproject.io/developers/tutorials'}>CaaS tutorial</a> (Faster swaps via expedited confirmations)</li>
                    </ul>
                </p>
                <p>
                    Swaps are submitted to the following adapter address: <a target='_blank' href={'https://kovan.etherscan.io/address/'+adapterAddress}>{adapterAddress}</a>
                </p>
                <p>
                    To learn more about building interoperable applications like this with RenVM, check out our <a target='_blank' href='https://renproject.io/developers'>developer center</a> or the following links:
                    <ul>
                        <li><a target='_blank' href={'https://docs.renproject.io/developers/ren-sdk'}>Getting started with RenJS</a></li>
                        <li><a target='_blank' href={'https://docs.renproject.io/developers/gateway-js'}>Getting started with GatewayJS</a></li>
                        <li><a target='_blank' href={'https://github.com/renproject/ren/wiki'}>Github Spec</a></li>
                    </ul>
                </p>
                <p>

                </p>
            </Grid>}

        </Grid>
    }
}

export default withStyles(styles)(withStore(DepositContainer))
