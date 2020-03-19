import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../../theme/theme'
import classNames from 'classnames'
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import InputAdornment from '@material-ui/core/InputAdornment';
import BtcLogo from '../../assets/btc-logo.svg'

import {
    switchNetwork
} from '../../utils/networkingUtils'

import NetworkChooser from '../../components/NetworkChooser'
import TransferTransactionStatus from '../../components/TransferTransactionStatus'

import {
    initGJSDeposit,
    removeTx,
} from '../../utils/txUtils'

import {
    initLocalWeb3,
} from '../../utils/walletUtils'


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
      // boxShadow: '0px 0px 30px 0px rgba(0, 0, 0, 0.05)',
      borderRadius: 12,
      border: '1px solid #DCE0E3',
      // padding: theme.spacing(3),
      background: '#fff',
      boxShadow: '0px 0px 4px rgba(0, 27, 58, 0.1)',
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
  caption: {
      fontSize: 16
  },
  inputContainer: {
      padding: theme.spacing(3)
  },
  amountContainer: {
    paddingBottom: theme.spacing(2)
  },
  amount: {
  },
  switch: {
    float: 'right'
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
      // marginTop: theme.spacing(3)
      // padding: theme.spacing(3)
  },
  depositItem: {
      fontSize: 12,
      marginBottom: theme.spacing(3),
      padding: theme.spacing(3),
      borderRadius: 12,
      border: '1px solid #DCE0E3',
      background: '#fff',
      boxShadow: '0px 0px 4px rgba(0, 27, 58, 0.1)',
      boxSizing: 'border-box',
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
  },
  walletError: {
      padding: theme.spacing(3),
      paddingTop: theme.spacing(0),
      textAlign: 'center',
      width: '100%'
  },
  header: {
      textAlign: 'center',
      padding: theme.spacing(2),
      paddingTop: theme.spacing(6),
      '& img': {
          height: 70,
          width: 'auto',
          margin: '0px auto'
      }
  },
})

class TransferContainer extends React.Component {

    constructor(props) {
        super(props);
        this.addressRef = React.createRef()
    }

    async componentDidMount() {
    }

    componentWillUnmount() {
        clearInterval(this.swapMonitor)
    }

    async start() {
        const { store } = this.props
        const amount = store.get('transfer.amount')
        const address = store.get('transfer.address')
        const network = store.get('selectedNetwork')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            network,
            type: 'transfer',
            instant: false,
            awaiting: 'btc-init',
            destAddress: address,
            amount: amount,
            error: false,
            txHash: ''
        }

        initGJSDeposit.bind(this)(tx)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const network = store.get('selectedNetwork')
        const adapterAddress = store.get('transfer.adapterAddress')
        const instantSwapSelected = store.get('transfer.instantSwapSelected')
        const transactions = store.get('transfer.transactions').filter(t => t.network === network)
        const amount = store.get('transfer.amount')

        const localWeb3 = store.get('localWeb3')
        const localWeb3Address = store.get('localWeb3Address')
        const localWeb3Network = store.get('localWeb3Network')
        const rightNetwork = localWeb3Network === 'testnet'

        const address = store.get('transfer.address')
        const balance = store.get('transfer.balance')
        const localWeb3Connected = localWeb3 && localWeb3Address && rightNetwork

        const disabled = amount <= 0.0001 || (amount > 0.0005 && instantSwapSelected) || !address

        return <div className={classes.wrapper}>
            <Typography variant='subtitle1' className={classes.title}>Mint tokenized Bitcoin onto&nbsp;Ethereum</Typography>
            <Grid className={classes.badges} container>
                <Chip label="GatewayJS" variant="outlined" />
                <Chip label="Local Web3" variant="outlined" />
            </Grid>
            <Grid container justify='center'>
                <Grid className={classes.contentContainer}>
                    <Grid container direction='row'>
                        {<Grid className={classes.desc} item xs={12}>
                            <Typography variant='subtitle1'>Create transfer</Typography>
                            <NetworkChooser
                                disabled={true}
                                currentNetwork={network}
                                onChange={(e) => {
                                    switchNetwork.bind(this)(e.target.value)
                                }} />
                        </Grid>}
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12} className={classes.header}>
                            <img src={BtcLogo} />
                            <p className={classes.balance}>{balance} zBTC</p>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container className={classes.inputContainer}>
                                <Grid item xs={12} className={classes.amountContainer}>
                                    <TextField className={classNames(classes.input, classes.amount)}
                                        label='Mint Amount'
                                        variant='filled'
                                        placeholder=''
                                        onChange={e => {
                                            store.set('transfer.amount', e.target.value)
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            endAdornment: <InputAdornment className={classes.endAdornment} position="end">BTC</InputAdornment>
                                        }}/>
                                </Grid>
                                <Grid item xs={12} className={classes.addressContainer}>
                                    <TextField className={classNames(classes.input, classes.amount)}
                                        label='Send to ETH address'
                                        variant='filled'
                                        placeholder=''
                                        onChange={e => {
                                            store.set('transfer.address', e.target.value)
                                        }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}/>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        <Grid item xs={12} className={classes.swapButtonContainer}>
                            {<Button disabled={disabled}
                                  className={classes.swapButton}
                                  variant='contained'
                                  color='primary'
                                  size='large'
                                  onClick={this.start.bind(this)}>
                                      Reveal BTC Deposit Address
                              </Button>}
                        </Grid>

                        {/*localWeb3Address && !rightNetwork && <Grid className={classes.walletError}>
                            <Typography variant='subtitle1'>
                                Please switch your wallet to the kovan network
                            </Typography>
                        </Grid>*/}

                    </Grid>
                </Grid>

                {localWeb3Connected && transactions && transactions.length ? <React.Fragment>
                <Grid item xs={12} className={classes.unfinished}>
                    {transactions.map((tx, index) => {
                            return <Grid key={index} container direction='row' className={classes.depositItem}>
                                <Grid item xs={3}>
                                    <Typography variant='caption'>{tx.amount} BTC</Typography>
                                </Grid>
                                <Grid className={classes.depositStatus} item xs={9}>
                                    <TransferTransactionStatus tx={tx} />
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
                        })}
                </Grid></React.Fragment> : null}

                {<Grid item xs={12} className={classes.info}>
                    <p>
                        <span className={classes.caption}>How it works:</span>
                        <br/>
                        <br/>
                        Transfers use <a target='_blank' href='https://renproject.io/'>RenVM</a> and Open Zeppelin's <a target='_blank' href='https://gsn.openzeppelin.com/'>GSN</a> to facilitate trustless interoperabilty between Bitcoin and Ethereum. Once Bitcoin is deposited into RenVM, the corresponding amount of zBTC is minted and transferred to the destination address on Ethereum.
                    </p>
                    <p>
                        Transfers are facilitated through the following adapter address: <a target='_blank' href={'https://'+ (network === 'testnet' ? 'kovan.' : '') +'etherscan.io/address/'+adapterAddress}>{adapterAddress}</a>
                    </p>
                    <p>
                        To learn more about building interoperable applications like this with RenVM, check out our <a target='_blank' href='https://renproject.io/developers'>developer center</a> or the following links:
                    </p>
                    <ul>
                        <li><a target='_blank' href={'https://docs.renproject.io/developers/ren-sdk'}>Getting started with RenJS</a></li>
                        <li><a target='_blank' href={'https://docs.renproject.io/developers/gateway-js'}>Getting started with GatewayJS</a></li>
                        <li><a target='_blank' href={'https://github.com/renproject/ren/wiki'}>Github Spec</a></li>
                    </ul>
                </Grid>}

            </Grid>
        </div>
    }
}

export default withStyles(styles)(withStore(TransferContainer))
