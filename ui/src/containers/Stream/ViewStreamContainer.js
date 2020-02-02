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

import { claim, updateStreamInfo } from '../../utils/txUtils'

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
        color: '#63ccff78',
        animationDuration: '550ms',
        position: 'absolute',
        left: 0,
    },
    progressBottom: {
        color: '#039BE5',
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
        textAlign: 'center',
        paddingBottom: theme.spacing(3)
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
        marginBottom: theme.spacing(3)
    },
    loadingContianer: {
        // paddingTop: theme.spacing(3)
    }
})

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
        this.mounted = false
    }

    async componentDidMount() {
        const { selectedTx } = this.props
        await updateStreamInfo.bind(this)(selectedTx)
        this.setState({
            loaded: true
        })

        const schedule = selectedTx.schedule

        if (this.initAddressRef.current) {
            this.initAddressRef.current.value = selectedTx.renBtcAddress
        }

        if (schedule) {
            const start = Number(schedule.startTime)
            const end = Number(schedule.startTime) + (Number(schedule.duration * 60))
            const totalClaimable = (schedule.amount / (10 ** 8)).toFixed(6)
            const amountClaimed = (schedule.amountClaimed / (10 ** 8)).toFixed(6)
            const amountClaimedPercentage = (amountClaimed / totalClaimable).toFixed(1) * 100

            this.interval = setInterval(() => {
                const now = Math.floor(Date.now() / 1000)
                const period = end - start
                let availablePercentage = 0
                if (now > end) {
                    availablePercentage = 100
                    clearInterval(this.interval)
                } else if (start > 0){
                    availablePercentage = Number((((now - start) / period) * 100).toFixed(1))
                }
                const availableAmount = ((availablePercentage / 100) * totalClaimable).toFixed(6)
                const remaingDuration = end - now


                // console.log('mounted', this.mounted)

                if (!this.mounted) {
                    this.setState({
                        totalClaimable,
                        amountClaimed,
                        amountClaimedPercentage,
                        availableAmount,
                        availablePercentage,
                        remaingDuration
                    })
                    this.mounted = true
                } else {
                    this.setState({
                        availablePercentage
                    })
                }
            }, 10);
        }

    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval)
        }
    }

    componentDidUpdate() {
        const { selectedTx } = this.props
    }

    monitorStream() {
    }

    back() {
        const { store } = this.props
        store.set('stream.activeView', 'start')
        store.set('stream.selectedTx', null)
        console.log('back')
    }

    render() {
        const {
            classes,
            selectedTx,
            store
        } = this.props

        const {
            loaded,
            totalClaimable,
            amountClaimed,
            amountClaimedPercentage,
            availableAmount,
            availablePercentage,
            remaingDuration
        } = this.state

        // console.log(this.state, this.props)

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
                            <span></span>
                            {selectedTx.awaiting === 'btc-init' ? <span>
                                {`Waiting for ${selectedTx.amount} BTC transaction to be initiated to the address below`}
                            </span> : null}
                            {selectedTx.awaiting === 'ren-settle' ? <span>
                                {`Submitting to RenVM`}
                            </span> : null}
                            {selectedTx.awaiting === 'eth-settle' ? <span>
                                {`Submitting to Ethereum`}
                            </span> : null}
                            {!selectedTx.awaiting ? `Deposit complete` : null}

                        </Grid>
                        <Grid item xs={12} onClick={() => {}}>
                            <TextField className={classNames(classes.input, classes.address)}
                                variant='outlined'
                                size='small'
                                placeholder='Deposit Address'
                                inputRef={this.initAddressRef}
                                InputProps={{
                                    endAdornment: <InputAdornment className={classes.endAdornment} position="end">COPY</InputAdornment>
                                }}/>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container justify='center'>
                                {selectedTx.awaiting === 'btc-init' || selectedTx.error || !selectedTx.awaiting ? <div className={classes.cancelLink}>
                                    {selectedTx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://kovan.etherscan.io/tx/'+selectedTx.txHash}>View transaction</a> : null}
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
                                value={Number(availablePercentage)}
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
                                    <b>{selectedTx.amount} BTC</b>
                                </p>
                            </div>
                            <p>
                                <b>{amountClaimed} / <CountUp start={availableAmount} end={selectedTx.amount} duration={remaingDuration} decimals={6}>{availableAmount}</CountUp> BTC</b>
                            </p>
                            <p>
                                <span>claimed</span>
                            </p>
                        </div>
                    </Grid>
                </div>
                <Grid item xs={12} className={classes.claimButton}>
                    <Button disabled={false}
                        className={''}
                        variant='outlined'
                        color='primary'
                        onClick={() => {
                            claim.bind(this)(selectedTx)
                        }}>
                        Claim BTC
                    </Button>
                </Grid>
            </React.Fragment>}
        </React.Fragment>
    }
}

export default withStore(withStyles(styles)(ViewStreamContainer))
