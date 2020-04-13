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
import InputAdornment from '@material-ui/core/InputAdornment';
import Radio from '@material-ui/core/Radio';
import Chip from '@material-ui/core/Chip';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import DaiLogo from '../../assets/dai-logo.png'


import {
    switchNetwork
} from '../../utils/networkingUtils'

import NetworkChooser from '../../components/NetworkChooser'
import TransferTransactionStatus from '../../components/TransferTransactionStatus'

import {
    initDeposit,
    removeTx,
} from '../../utils/txUtils'

import {
    initLocalWeb3,
    setDAIAllowance,
    burnDai
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
  headerContainer: {
      paddingBottom: theme.spacing(3)
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
  walletError: {
      padding: theme.spacing(3),
      paddingTop: theme.spacing(0),
      textAlign: 'center',
      width: '100%'
  }
})

class Container extends React.Component {

    constructor(props) {
        super(props);
        this.borrowDaiRef = React.createRef()
        this.repayDaiRef = React.createRef()
    }

    async componentDidMount() {
    }

    componentWillMount() {
        const { store } = this.props
        store.set('selectedNetwork', 'testnet')
    }

    componentWillUnmount() {
        clearInterval(this.swapMonitor)
    }

    async borrow() {
        const { store } = this.props
        const borrowAmount = store.get('collateralize.borrowAmount')
        const borrowDaiAmount = store.get('collateralize.borrowDaiAmount')
        const borrowBtcAddress = store.get('collateralize.borrowBtcAddress')
        const ethAddress = store.get('localWeb3Address')

        const tx = {
            id: String(Math.round(Math.random() * (10 ** 8))),
            type: 'collateralize',
            awaiting: 'btc-init',
            source: 'btc',
            dest: 'eth',
            amount: borrowAmount,
            daiAmount: borrowDaiAmount,
            btcAddress: borrowBtcAddress,
            ethAddress: ethAddress,
            network: 'testnet',
            error: false
        }

        initDeposit.bind(this)(tx)
    }

    async repay() {
        burnDai.bind(this)()
    }

    async allowDai() {
        setDAIAllowance.bind(this)()
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const network = store.get('selectedNetwork')
        const adapterAddress = store.get('collateralize.adapterAddress')
        const transactions = store.get('collateralize.transactions').filter(t => t.network === 'testnet')

        const localWeb3 = store.get('localWeb3')
        const localWeb3Address = store.get('localWeb3Address')
        const localWeb3Network = store.get('localWeb3Network')
        const selectedTab = store.get('collateralize.selectedTab')
        const rightNetwork = localWeb3Network === 'testnet'
        const localWeb3Connected = localWeb3 && localWeb3Address && rightNetwork

        // console.log(store.getState())

        const balance = store.get('collateralize.balance')
        const borrowAmount = store.get('collateralize.borrowAmount')
        const repayBtcAmount = store.get('collateralize.repayBtcAmount')
        const daiAllowance = store.get('collateralize.daiAllowance')
        const daiAllowanceRequesting = store.get('collateralize.daiAllowanceRequesting')
        const repayAmount = store.get('collateralize.repayAmount')
        const walletDataLoaded = store.get('localWeb3DataLoaded')

        const hasDAIAllowance = Number(daiAllowance) > Number(repayAmount)

        const canBorrow = localWeb3Connected && Number(borrowAmount) > 0.00010001
        const canRepay = localWeb3Connected && Number(repayBtcAmount) > 0.00010001

        return <div className={classes.wrapper}>
        <Typography variant='subtitle1' className={classes.title}>Deposit Bitcoin into MakerDAO and receive&nbsp;DAI</Typography>
        <Grid className={classes.badges} container>
            <Chip label="RenJS" variant="outlined" />
            <Chip label="Local Web3" variant="outlined" />
        </Grid>
        <Grid container justify='center'>
            <Grid className={classes.contentContainer}>
                <Grid container direction='row'>
                    {<Grid className={classes.desc} item xs={12}>
                        <RadioGroup aria-label="position"
                            name="position"
                            value={selectedTab}
                            onChange={(e, v) => {
                                store.set('collateralize.selectedTab', v)
                                store.set('collateralize.borrowAmount', '')
                                store.set('collateralize.borrowDaiAmount', '')
                                store.set('collateralize.repayAmount', '')
                                store.set('collateralize.repayBtcAmount', '')
                            }} row>
                            <FormControlLabel
                              value="borrow"
                              control={<Radio color="primary" />}
                              label="Borrow DAI"
                              labelPlacement="end"
                            />
                            <FormControlLabel
                              value="repay"
                              control={<Radio color="primary" />}
                              label="Repay DAI"
                              labelPlacement="end"
                            />
                        </RadioGroup>
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
                        <img src={DaiLogo} />
                        <p className={classes.balance}>{balance} DAI</p>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12}>
                        {selectedTab === 'borrow' && <Grid container className={classes.inputContainer}>
                            <Grid item xs={12} className={classes.amountContainer}>
                                <TextField className={classNames(classes.input, classes.amount)}
                                    label='Collateral Amount'
                                    variant='filled'
                                    placeholder=''
                                    disabled={!localWeb3Connected}
                                    onChange={e => {
                                        const amt = e.target.value
                                        const daiAmt = Number((amt * 10000) * 0.66).toFixed(2)
                                        store.set('collateralize.borrowAmount', amt)
                                        store.set('collateralize.borrowDaiAmount', daiAmt)
                                        this.borrowDaiRef.current.value = daiAmt
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
                                    disabled={true}
                                    inputRef={this.borrowDaiRef}
                                    label='Mint Amount'
                                    variant='filled'
                                    placeholder=''
                                    onChange={e => {
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment className={classes.endAdornment} position="end">DAI</InputAdornment>
                                    }}/>
                            </Grid>
                        </Grid>}
                        {selectedTab === 'repay' && <Grid container className={classes.inputContainer}>
                            <Grid item xs={12} className={classes.amountContainer}>
                                <TextField className={classNames(classes.input, classes.amount)}
                                    label='Repay Amount'
                                    variant='filled'
                                    disabled={!hasDAIAllowance}
                                    placeholder=''
                                    onChange={e => {
                                        const amt = e.target.value
                                        const btcAmt = Number((amt / 10000)).toFixed(6)
                                        store.set('collateralize.repayAmount', amt)
                                        store.set('collateralize.repayBtcAmount', btcAmt)
                                        this.repayDaiRef.current.value = btcAmt
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment className={classes.endAdornment} position="end">DAI</InputAdornment>
                                    }}/>
                            </Grid>
                            <Grid item xs={12} className={classes.addressContainer}>
                                <TextField className={classNames(classes.input, classes.amount)}
                                    disabled={true}
                                    inputRef={this.repayDaiRef}
                                    label='Collateral Amount'
                                    variant='filled'
                                    placeholder=''
                                    onChange={e => {
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        endAdornment: <InputAdornment className={classes.endAdornment} position="end">BTC</InputAdornment>
                                    }}/>
                            </Grid>
                        </Grid>}

                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12} className={classes.swapButtonContainer}>
                        {!localWeb3Connected ? <Button className={classes.swapButton}
                            variant='contained'
                            color='primary'
                            size='large'
                            onClick={initLocalWeb3.bind(this)}>
                                Connect wallet
                            </Button> : <React.Fragment>
                                {selectedTab === 'borrow' ? <React.Fragment>
                                    <Button disabled={!canBorrow}
                                        className={classes.swapButton}
                                        variant='contained'
                                        color='primary'
                                        size='large'
                                        onClick={this.borrow.bind(this)}>
                                        Borrow
                                    </Button>
                                </React.Fragment> : <React.Fragment>
                                    {!hasDAIAllowance && walletDataLoaded ? <Button disabled={daiAllowanceRequesting}
                                        size='large'
                                        variant="contained"
                                        className={classes.button}
                                        color="primary"
                                        onClick={this.allowDai.bind(this)}>
                                        {daiAllowanceRequesting ? 'Requesting...' : 'Set DAI repay allowance'}
                                    </Button> : <Button disabled={!canRepay} size='large' variant="contained" className={classes.button} color="primary" onClick={this.repay.bind(this)}>
                                      Repay
                                    </Button>}
                                </React.Fragment>}
                            </React.Fragment>}
                    </Grid>
                    {localWeb3Address && !rightNetwork && <Grid className={classes.walletError}>
                        <Typography variant='subtitle1'>
                            Please switch your wallet to the kovan network
                        </Typography>
                    </Grid>}

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
                    The MakerDAO BTC Vault was created as part of the ETHDenver 2020 hacakathon. Once Bitcoin is deposited into RenVM, the corresponding amount of testBTC is minted and transferred to a MakerDAO CDP that mints new DAI.
                </p>
                <p>
                    Transactions are facilitated through the following adapter address: <a target='_blank' href={'https://'+ (network === 'testnet' ? 'kovan.' : '') +'etherscan.io/address/'+adapterAddress}>{adapterAddress}</a>
                </p>
                <p>
                    To learn more about building interoperable applications like this with RenVM, check out our <a target='_blank' href='https://renproject.io/developers'>developer center</a> or the following links:
                </p>
                <ul>
                    <li><a target='_blank' href={'https://github.com/renproject/makerdao-btc-vault'}>MakerDAO BTC Vault standalone source</a></li>
                    <li><a target='_blank' href={'https://docs.renproject.io/developers/ren-sdk'}>Getting started with RenJS</a></li>
                    <li><a target='_blank' href={'https://docs.renproject.io/developers/gateway-js'}>Getting started with GatewayJS</a></li>
                    <li><a target='_blank' href={'https://github.com/renproject/ren/wiki'}>Github Spec</a></li>
                </ul>
            </Grid>}

        </Grid></div>
    }
}

export default withStyles(styles)(withStore(Container))
