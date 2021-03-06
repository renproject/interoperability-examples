import React from 'react';
import theme from '../theme/theme'
// import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';
import { calculateStreamProgress } from '../utils/txUtils'
import Typography from '@material-ui/core/Typography';

const styles = () => ({
})

const StreamTransactionStatus = function(props) {
    const {
        tx,
    } = props

    const {
        totalClaimablePercentrage,
        amountClaimedPercentage
    } = calculateStreamProgress(tx)

    const complete = totalClaimablePercentrage === 100

    return <React.Fragment>
        <Typography variant='caption'>
            {tx.awaiting === 'btc-init' ? <span>
                {`Waiting for BTC transaction to be initiated`}
            </span> : null}
            {tx.awaiting === 'btc-settle' ? <span>
                {`BTC transaction confirming (${tx.btcConfirmations}/${'2'} complete)`}
            </span> : null}
            {tx.awaiting === 'ren-settle' ? <span>
                {tx.error ? `Error submitting to RenVM` : `Submitting to RenVM`}
            </span> : null}
            {tx.awaiting === 'eth-settle' ? <span>
                {tx.error ? `Error submitting to Ethereum` : `Submitting to Ethereum`}
            </span> : null}
            {!tx.awaiting ? <span>{complete ? `Stream complete` : `Streaming in progress`}</span> : null}
        </Typography>
    </React.Fragment>
}

export default withStyles(styles)(StreamTransactionStatus);
