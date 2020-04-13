import React from 'react';
import { withStore } from '@spyna/react-store'
import validate from 'bitcoin-address-validation';
import { withStyles } from '@material-ui/styles';
import theme from '../../theme/theme'
import classNames from 'classnames'
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import InputAdornment from '@material-ui/core/InputAdornment';
import Chip from '@material-ui/core/Chip';


import {
    initDeposit,
    removeTx,
    recoverStreams
} from '../../utils/txUtils'

import {
    switchNetwork
} from '../../utils/networkingUtils'

import ViewStream from './ViewStreamContainer'
import StreamTransaction from '../../components/StreamTransaction'
import NetworkChooser from '../../components/NetworkChooser'



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
      marginLeft: 'auto',
      marginRight: 'auto',
      width: 572,
      maxWidth: '100%',
      boxSizing: 'border-box',
  },
  contentContainer: {
      borderRadius: 12,
      border: '1px solid #DCE0E3',
      boxShadow: '0px 0px 4px rgba(0, 27, 58, 0.1)',
      background: '#fff',
      boxSizing: 'border-box',
      marginBottom: theme.spacing(3),
      width: '100%',
      '& input': {
      }
  },
  input: {
      marginBottom: theme.spacing(2),
      width: '100%',
  },
  inputContainer: {
      padding: theme.spacing(3),
      paddingBottom: theme.spacing(1)
  },
  viewStreamContainer: {
      padding: theme.spacing(3),
  },
  amountContainer: {
    // paddingRight: theme.spacing(1)
  },
  amount: {
  },
  title: {
      marginBottom: theme.spacing(1)
  },
  badges: {
      marginBottom: theme.spacing(3),
      '& .MuiChip-root': {
          marginRight: theme.spacing(1)
      }
  },
  unfinished: {
      // padding: theme.spacing(3),
      // paddingTop: theme.spacing(0)
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
      fontSize: 14,
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
      padding: theme.spacing(3),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
  },
  btcLink: {
      fontSize: 12
  },
  caption: {
      fontSize: 16
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
      padding: theme.spacing(3),
  },
  searchContainer: {
      padding: theme.spacing(3),
  },
  switchContainer: {
      textAlign: 'center',
      paddingBottom: theme.spacing(1),
      '& .MuiFormControlLabel-label': {
          fontSize: 12
      }
  },
  swapButton: {
  },
  radio: {
      marginBottom: theme.spacing(2),
      flexDirection: 'row',
      '& span': {
        fontSize: 12
      }
  },
  searchLink: {
      fontSize: 12,
      minWidth: 80
  },
  streamItem: {},
  searchAddress: {
      marginBottom: theme.spacing(0)
  }
})

class StreamContainer extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {
        const { store } = this.props

        const txs = localStorage.getItem('stream.transactions')

        if (txs) {
            store.set('stream.transactions', JSON.parse(txs))
        }
    }

    componentWillUnmount() {
        clearInterval(this.swapMonitor)
    }

    async start() {
        const { store } = this.props
        const amount = store.get('stream.amount')
        const address = store.get('stream.address')
        const startTime = Math.round(Date.now() / 1000)
        const duration = store.get('stream.duration')
        const network = store.get('selectedNetwork')

        const tx = {
            id: 'tx-' + Math.random().toFixed(6),
            network,
            type: 'stream',
            instant: false,
            awaiting: 'btc-init',
            btcConfirmations: 0,
            btcTxHash: '',
            destAddress: address,
            amount: amount,
            startTime,
            duration,
            error: false,
            txHash: '',
            claimTransactions: []
        }

        store.set('stream.selectedTx', tx)
        store.set('stream.activeView', 'view-stream')

        initDeposit.bind(this)(tx)
    }

    viewTx(tx) {
        const { store } =  this.props

        store.set('stream.selectedTx', tx)
        store.set('stream.activeView', 'view-stream')
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const network = store.get('selectedNetwork')
        const amount = store.get('stream.amount')
        const address = store.get('stream.address')
        const duration = store.get('stream.duration')
        const transactions = store.get('stream.transactions').filter(t => t.network === network)
        const activeView = store.get('stream.activeView')
        const selectedTx = store.get('stream.selectedTx')
        const searchAddress = store.get('stream.searchAddress')
        const adapterAddress = store.get('stream.adapterAddress')

        const validation = validate(address)
        const validAddress = validation && !validation.bech32
        const disabled = amount < 0.00011 || !address || !duration || !validAddress

        return <div className={classes.wrapper}>
            <Typography variant='subtitle1' className={classes.title}>Stream Bitcoin to another Bitcoin&nbsp;address</Typography>
            <Grid className={classes.badges} container>
                <Chip label="RenJS" variant="outlined" />
                <Chip label="Gas-less" variant="outlined" />
            </Grid>
            <Grid container justify='center' className={classes.wrapper} >
            <Grid className={classes.contentContainer}>
                <Grid container direction='row'>
                    {activeView === 'start' && <React.Fragment>
                        <Grid className={classes.desc} item xs={12}>
                            <Typography variant='subtitle1'>Create stream</Typography>
                            <NetworkChooser
                                disabled={true}
                                currentNetwork={network}
                                onChange={(e) => {
                                    switchNetwork.bind(this)(e.target.value)
                                }} />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12} className={classes.inputContainer}>
                            <Grid container>
                                <Grid item xs={12} className={classes.amountContainer}>
                                    <TextField className={classNames(classes.input, classes.amount)}
                                        variant='filled'
                                        placeholder=''
                                        label='How much BTC would you like to stream?'
                                        onChange={e => {
                                            store.set('stream.amount', e.target.value)
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            endAdornment: <InputAdornment className={classes.endAdornment} position="end">BTC</InputAdornment>
                                        }}/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField className={classNames(classes.input, classes.address)}
                                        variant='filled'
                                        placeholder=''
                                        label="What's the recipient's Bitcoin address?"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        onChange={e => {
                                            store.set('stream.address', e.target.value)
                                        }}/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField className={classNames(classes.input, classes.address)}
                                        variant='filled'
                                        placeholder=''
                                        label="How long would you like to stream for?"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        onChange={e => {
                                            store.set('stream.duration', e.target.value)
                                        }}
                                        InputProps={{
                                            endAdornment: <InputAdornment className={classes.endAdornment} position="end">Minutes</InputAdornment>
                                        }}/>
                                </Grid>
                            </Grid>

                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12} className={classes.swapButtonContainer}>
                            <Button disabled={disabled} className={classes.swapButton} variant='contained' size='large' color='primary' onClick={this.start.bind(this)}>Start Stream</Button>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12} className={classes.searchContainer}>
                            <TextField
                                className={classNames(classes.input, classes.searchAddress)}
                                variant='filled'
                                label='Search by Destination Address'
                                onChange={e => {
                                    store.set('stream.searchAddress', e.target.value)
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                InputProps={{
                                    endAdornment: <InputAdornment
                                        className={classes.searchLink}
                                        position="end">
                                            <a href='javascript:;' onClick={() => {
                                                recoverStreams.bind(this)(searchAddress)
                                            }}>Get Streams</a>
                                        </InputAdornment>
                                }}/>
                        </Grid>

                    </React.Fragment>}
                    {activeView === 'view-stream' && <Grid className={classes.viewStreamContainer} container direction='row'>
                        <Grid item xs={12}>
                            <ViewStream selectedTx={selectedTx} />
                        </Grid>
                    </Grid>}
                </Grid>
            </Grid>

            {activeView === 'start' && transactions && transactions.length ? <React.Fragment>
                <Grid item xs={12} className={classes.unfinished}>
                    {transactions.map((tx, index) => {
                            return <StreamTransaction
                                tx={tx}
                                index={index}
                                onView={t => {
                                    this.viewTx.bind(this)(t)
                                }}
                                onCancel={t => {
                                    removeTx(store, t)
                                }}/>
                        })}
                </Grid></React.Fragment> : null}

            {<Grid item xs={12} className={classes.info}>
                <p>
                    <span className={classes.caption}>How it works:</span>
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
                </ul>
            </Grid>}

            </Grid>
        </div>
    }
}

export default withStyles(styles)(withStore(StreamContainer))
