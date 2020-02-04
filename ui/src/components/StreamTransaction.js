import React from 'react';
import theme from '../theme/theme'
import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';


import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';

const styles = () => ({
    depositItem: {
        fontSize: 12,
        marginBottom: theme.spacing(1)
    },
    depositStatus: {
        display: 'flex',
        justifyContent: 'space-between'
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
        return <Grid key={index}
                  container
                  direction='row'
                  className={classes.depositItem}>
            <Grid item xs={3}>
                {tx.amount} BTC
            </Grid>
            <Grid className={classes.depositStatus} item xs={9}>
                {tx.awaiting === 'btc-init' ? <span>
                    {`Waiting for ${tx.instant ? '0' : '2'} confirmations to`}{` ${tx.renBtcAddress}`}
                </span> : null}
                {tx.awaiting === 'btc-settle' ? <span>
                    {`${tx.btcConfirmations}/${'2'} confirmations complete to`}<br />{` ${tx.renBtcAddress}`}
                </span> : null}
                {tx.awaiting === 'ren-settle' ? <span>
                    {`Submitting to RenVM`}
                </span> : null}
                {tx.awaiting === 'eth-settle' ? <span>
                    {`Submitting to Ethereum`}
                </span> : null}
                {!tx.awaiting ? <span>{`Streaming in progress`}</span> : null}
                {tx.awaiting === 'btc-init' || tx.error || !tx.awaiting ? <div>
                    <a href='javascript:;' className={classes.viewLink} onClick={() => (onView(tx))}>
                        View
                    </a>

                    {tx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://kovan.etherscan.io/tx/'+tx.txHash}>View transaction</a> : null}

                    {tx.awaiting ? <a href='javascript:;' onClick={() => {
                        onCancel(tx)
                    }}>Cancel</a> : null}
                </div> : null}
            </Grid>
        </Grid>
    // }
}

export default withStyles(styles)(StreamTransaction);
