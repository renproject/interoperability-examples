import React from 'react';
import theme from '../../theme/theme'
import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';
import { withStore } from '@spyna/react-store'

import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import CountUp from 'react-countup';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';

import {
    claim,
    updateStreamInfo,
    removeTx,
    calculateStreamProgress,
    MIN_CLAIM_AMOUNT
} from '../../utils/txUtils'
import StreamTransactionStatus from '../../components/StreamTransactionStatus'
import ClaimStreamTransaction from '../../components/ClaimStreamTransaction'

const styles = () => ({
    progress: {
        position: 'relative',
        margin: '0px auto',
        width: 250,
        // marginBottom: theme.spacing(2)
    },
    progressTop: {
        color: '#eee',
    },
    progressMiddle: {
        color: theme.palette.primary.light,
        animationDuration: '550ms',
        position: 'absolute',
        left: 0,
    },
    progressBottom: {
        color: theme.palette.primary.main,
        animationDuration: '550ms',
        position: 'absolute',
        left: 0,
    },
    progressContainer: {
        position: 'relative',
        // paddingTop: theme.spacing(3),
        marginBottom: theme.spacing(4)
    },
    progressText: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        '& p': {
            margin: '0px'
        }
        // paddingTop: theme.spacing(5)
    },
    totalStreamed: {
        fontSize: 24,
        paddingBottom: theme.spacing(2)
    },
    spinner: {
        position: 'relative',
        margin: '0px auto',
        width: 24,
        marginBottom: theme.spacing(2)
    },
    spinnerTop: {
        color: '#eee',
    },
    spinnerBottom: {
        color: theme.palette.primary.main,
        animationDuration: '550ms',
        position: 'absolute',
        left: 0,
    },
    awaitingStatus: {
        textAlign: 'center',
        paddingBottom: theme.spacing(4),
        fontSize: 12
    },
    claimButton: {
        // margin: '0px auto'
        '& button': {
            width: '100%',
            maxWidth: 200,
            margin: '0px auto'
        },
        textAlign: 'center',
        paddingBottom: theme.spacing(3),
        '& span': {
            fontSize: 12
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
    hidden: {
        display: 'none'
    },
    initContainer: {
        // paddingTop: theme.spacing(3),
        '& a': {
            fontSize: 12
        }
    },
    backLink: {
        fontSize: 12,
        marginBottom: theme.spacing(4)
    },
    loadingContianer: {
        // paddingTop: theme.spacing(3)
    },
    depositAddress: {
        fontSize: 12,
        textAlign: 'center',
        '& span': {
            paddingBottom: theme.spacing(1)
        }
    },
    address: {
        minWidth: 285,
        width: 'auto'
    },
    divider: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
        backgroundColor: '#999999'
    },
    claims: {
    },
    claimTransactions: {
        paddingTop: theme.spacing(3)
    }
})

// clean up logic in this component
class ViewStreamContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            totalClaimable: '',
            amountClaimed: '',
            amountClaimedPercentage: '',
            availableAmount: '',
            availablePercentage: '',
            remaingDuration: ''
        }
        this.initAddressRef = React.createRef()
        this.interval = null
        this.scheduleInterval = null
        this.mounted = false
    }

    async componentDidMount() {
        const selectedTx = this.props.store.get('stream.selectedTx')
        await updateStreamInfo.bind(this)(selectedTx)
        this.setState({
            loaded: true
        })

        if (this.initAddressRef.current) {
            this.initAddressRef.current.value = selectedTx.renBtcAddress
        }

        // this.interval = setInterval(() => {
        //     updateStreamInfo.bind(this)(selectedTx)
        // }, 5000)
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval)
        }
    }

    componentDidUpdate() {
    }

    back() {
        const { store } = this.props
        store.set('stream.activeView', 'start')
        store.set('stream.selectedTx', null)
        // console.log('back')
    }

    async claim() {
        const { store } = this.props
        const selectedTx = store.get('stream.selectedTx')
        await claim.bind(this)(selectedTx)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const selectedTx = store.get('stream.selectedTx')

        const {
            loaded
        } = this.state

        const progress = calculateStreamProgress(selectedTx)

        const {
            totalClaimablePercentrage,
            amountClaimedPercentage,
            amountClaimablePercentage,
            remaingDuration,
            amount,
            totalClaimableAmount,
            claimedAmount,
            claimableAmount,
        } = progress

        const { claimTransactions } = selectedTx
        const claimRequesting = store.get('stream.claimRequesting')
        const network = store.get('selectedNetwork')

        console.log('progress', progress)

        return <React.Fragment>
            <div className={classes.backLink}>
                <a href='javascript:;' onClick={this.back.bind(this)}>{'Back'}</a>
            </div>
            {!loaded ? <Grid item xs={12} className={classes.loadingContianer}>
                <div className={classes.spinner}>
                      <CircularProgress
                        variant="determinate"
                        value={100}
                        className={classes.spinnerTop}
                        size={24}
                        thickness={4}
                      />
                      <CircularProgress
                        variant="indeterminate"
                        disableShrink
                        className={classes.spinnerBottom}
                        size={24}
                        thickness={4}
                      />
                </div>
            </Grid> :
            <React.Fragment>
                <Grid item xs={12} className={selectedTx.schedule ? classes.hidden : classes.initContainer}>
                    <Grid container>
                        <Grid item xs={12}>
                            <div className={classes.spinner}>
                                  <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    className={classes.spinnerTop}
                                    size={24}
                                    thickness={4}
                                  />
                                  <CircularProgress
                                    variant="indeterminate"
                                    disableShrink
                                    className={classes.spinnerBottom}
                                    size={24}
                                    thickness={4}
                                  />
                            </div>
                        </Grid>
                        <Grid item xs={12} className={classes.awaitingStatus}>
                            <StreamTransactionStatus tx={selectedTx} />
                            {(selectedTx.awaiting === 'btc-init' || selectedTx.error) &&
                                <p><a href='javascript:;'
                                    className={classes.cancelLink}
                                    onClick={() => {
                                        removeTx(store, selectedTx)
                                        store.set('stream.selectedTx', null)
                                        store.set('stream.activeView', 'start')
                                    }}>
                                    Cancel
                                </a></p>}

                            {selectedTx.awaiting === 'btc-settle' && <p><a target='_blank' href={`https://live.blockcypher.com/${network === 'testnet' ? 'btc-testnet' : 'btc'}/tx/${selectedTx.btcTxHash}`}
                                className={classes.cancelLink}>
                                View pending transaction
                            </a></p>}
                        </Grid>
                        <Grid item xs={12} onClick={() => {}}>
                            <Grid container justify='center'>
                                {selectedTx.awaiting === 'btc-init' && <div className={classes.depositAddress}>
                                    <p><span>{`Send ${selectedTx.amount} BTC to the following address:`}</span></p>
                                    <TextField className={classNames(classes.input, classes.address)}
                                        label={''}
                                        variant='outlined'
                                        size='small'
                                        placeholder='Deposit Address'
                                        inputRef={this.initAddressRef}/>
                                </div>}
                            </Grid>

                        </Grid>
                        <Grid item xs={12}>
                            <Grid container justify='center'>
                                {selectedTx.awaiting === 'btc-init' || selectedTx.error || !selectedTx.awaiting ? <div className={classes.cancelLink}>
                                    {selectedTx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://'+ (network === 'testnet' ? 'kovan.' : '') +'etherscan.io/tx/'+selectedTx.txHash}>View transaction</a> : null}
                                </div> : null}
                                {/*<span  onClick={() => store.set('activeStreamView', 'start')}>Cancel</span>*/}
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <div className={selectedTx.schedule && loaded ? classes.progressContainer : classes.hidden}>
                    <Grid item xs={12}>
                        <div className={classes.progress}>
                              <CircularProgress
                                variant="static"
                                value={100}
                                className={classes.progressTop}
                                size={250}
                                thickness={2}
                              />
                              <CircularProgress
                                variant="static"
                                className={classes.progressMiddle}
                                size={250}
                                value={Number(totalClaimablePercentrage)}
                                thickness={2}
                              />
                              <CircularProgress
                                variant="static"
                                className={classes.progressBottom}
                                size={250}
                                value={Number(amountClaimedPercentage)}
                                thickness={2}
                              />
                        </div>
                        <div className={classes.progressText}>
                            <div>
                                <p className={classes.totalStreamed}>
                                    <b>{amount} BTC</b>
                                </p>
                            </div>
                            <p>
                                <b>{claimedAmount.toFixed(6)} / <CountUp start={totalClaimableAmount} end={selectedTx.amount} duration={remaingDuration} decimals={6}>{claimableAmount}</CountUp> BTC</b>
                            </p>
                            <p>
                                <span>claimed</span>
                            </p>
                        </div>
                    </Grid>
                </div>
                <Grid item xs={12} className={selectedTx.schedule && loaded ?classes.claimButton : classes.hidden}>
                    {claimableAmount > MIN_CLAIM_AMOUNT ? <Button disabled={claimRequesting}
                        className={''}
                        variant='outlined'
                        color='primary'
                        onClick={() => {
                            this.claim.bind(this)()
                        }}>
                        {claimRequesting ? `Submitting...` : `Claim ${claimableAmount.toFixed(6)} BTC`}
                    </Button> : <span>{totalClaimablePercentrage < 100 ? `Minimum claim amount is ${MIN_CLAIM_AMOUNT} BTC` : 'All available funds claimed'}</span>}
                </Grid>
                {claimTransactions.length ? <Grid item xs={12}>
                    <Divider />
                </Grid> : null}
                <div className={selectedTx.schedule && loaded ? classes.claimTransactions : classes.hidden}>
                    {claimTransactions && claimTransactions.length ? claimTransactions.map((tx, index) => {
                        return <ClaimStreamTransaction
                            tx={tx}
                            index={index}
                            onView={t => {
                            }}
                            onCancel={t => {
                            }}/>
                    }) : null}
                </div>
            </React.Fragment>}
        </React.Fragment>
    }
}

export default withStore(withStyles(styles)(ViewStreamContainer))
