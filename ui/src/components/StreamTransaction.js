import React from 'react';
import theme from '../theme/theme'
import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';


import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';

import StreamTransactionStatus from './StreamTransactionStatus'
import { calculateStreamProgress } from '../utils/txUtils'

const styles = () => ({
    depositItem: {
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

        const completed = totalClaimablePercentrage === 100

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
                    <Typography variant='caption'>{tx.amount} BTC</Typography>
                </Grid>
            </Grid>
            <Grid className={classes.depositStatus} item xs={8}>
                <StreamTransactionStatus tx={tx} />
                <div className={classes.links}>
                    <Typography variant='caption'>
                        <a href='javascript:;' className={classes.viewLink} onClick={() => (onView(tx))}>
                            View
                        </a>
                        {completed && <a href='javascript:;' className={classes.viewLink} onClick={() => (onCancel(tx))}>
                            Clear
                        </a>}
                    </Typography>

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
