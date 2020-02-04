import React from 'react';
import theme from '../theme/theme'
import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';


import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';

import StreamTransactionStatus from './StreamTransactionStatus'
import { calculateStreamProgress } from '../utils/txUtils'

const styles = () => ({
    depositItem: {
        fontSize: 12,
        marginBottom: theme.spacing(1)
    },
    depositStatus: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    links: {
        '& a': {
            marginLeft: theme.spacing(1),
        },
    },
    progress: {
        position: 'relative',
        marginRight: theme.spacing(1),
        width: 18,
        height: 18
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
})

const StreamTransaction = function(props) {
    // render() {
        const {
            tx,
            index,
            classes,
            onView,
            onCancel
        } = props

        const {
            schedule
        } = tx

        const {
            totalClaimablePercentrage,
            amountClaimedPercentage
        } = calculateStreamProgress(tx)

        return <Grid key={index}
                  container
                  direction='row'
                  className={classes.depositItem}>
            <Grid item xs={4}>
                <Grid container alignItems='center'>
                    <div className={classes.progress}>
                          <CircularProgress
                            variant="static"
                            value={100}
                            className={classes.progressTop}
                            size={18}
                            thickness={4}
                          />
                          <CircularProgress
                            variant="static"
                            className={classes.progressMiddle}
                            size={18}
                            value={totalClaimablePercentrage}
                            thickness={4}
                          />
                          <CircularProgress
                            variant="static"
                            className={classes.progressBottom}
                            size={18}
                            value={amountClaimedPercentage}
                            thickness={4}
                          />
                    </div>
                    <span>{tx.amount} BTC</span>
                </Grid>
            </Grid>
            <Grid className={classes.depositStatus} item xs={8}>
                <StreamTransactionStatus tx={tx} />
                <div className={classes.links}>
                    <a href='javascript:;' className={classes.viewLink} onClick={() => (onView(tx))}>
                        View
                    </a>

                    {/*tx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://kovan.etherscan.io/tx/'+tx.txHash}>View transaction</a> : null*/}

                    {/*tx.awaiting === 'btc-init' || tx.error ? <a href='javascript:;' onClick={() => {
                        onCancel(tx)
                    }}>Cancel</a> : null*/}
                </div>
            </Grid>
        </Grid>
    // }
}

export default withStyles(styles)(StreamTransaction);
