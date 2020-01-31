import React from 'react';
import theme from '../../theme/theme'
import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';
import { withStore } from '@spyna/react-store'

import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';



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
        color: theme.palette.primary.main,
        animationDuration: '550ms',
        position: 'absolute',
        left: 0,
    },
    progressContainer: {
        position: 'relative',
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
      '& a': {
        fontSize: 12
      }
    }
})

class ViewStreamContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            availableAmount: '',
            availablePercentage: ''
        }
        this.initAddressRef = React.createRef()
    }

    componentDidMount() {
        const { selectedTx } = this.props
        const schedule = selectedTx.schedule

        if (!schedule) return

        const start = Number(schedule.startTime)
        const end = Number(schedule.startTime) + (Number(schedule.duration * 60))
        const amount = selectedTx.amount

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
            const availableAmount = ((availablePercentage / 100) * amount).toFixed(6)

            this.setState({
                availableAmount,
                availablePercentage
            })
        }, 10);
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    componentDidUpdate() {
        const { selectedTx } = this.props
        // setTimeout(() => {
            // console.log('ViewStream', this.initAddressRef.current)
            // if (this.initAddressRef.current) {
            //     this.initAddressRef.current.value = selectedTx.renBtcAddress
            // }
        // }, 10)
    }

    monitorStream() {

    }

    back() {
        const { store } = this.props
        store.set('stream.activeView', 'start')
        store.set('stream.selectedTx', null)
    }

    render() {
        const {
            classes,
            selectedTx,
            store
        } = this.props

        const {
            availableAmount,
            availablePercentage
        } = this.state

        console.log(this.state, this.props)

        return <React.Fragment>
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
                                <a href='javascript:;' onClick={this.back.bind(this)}>{'Back'}</a></div> : null}
                            {/*<span  onClick={() => store.set('activeStreamView', 'start')}>Cancel</span>*/}
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} className={selectedTx.schedule ? classes.progressContainer : classes.hidden}>
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
                        value={Number(0.1)}
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
                        <b>0.000000 / {availableAmount} BTC</b>
                    </p>
                    <p>
                        <span>claimed</span>
                    </p>
                </div>
            </Grid>
        </React.Fragment>
    }
}

export default withStore(withStyles(styles)(ViewStreamContainer))
