import React from 'react';
import theme from '../theme/theme'
// import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';

const styles = () => ({
})

const StreamTransactionStatus = function(props) {
    const {
        tx,
    } = props

    return <React.Fragment>
            {tx.awaiting === 'btc-init' ? <span>
                {`Waiting for BTC transaction to be intitated `}<br />{`${tx.renBtcAddress}`}
            </span> : null}
            {tx.awaiting === 'btc-settle' ? <span>
                {`BTC transaction confirming (${tx.btcConfirmations}/${'2'} complete)`}
            </span> : null}
            {tx.awaiting === 'ren-settle' ? <span>
                {`Submitting to RenVM`}
            </span> : null}
            {tx.awaiting === 'eth-settle' ? <span>
                {`Submitting to Ethereum`}
            </span> : null}
            {!tx.awaiting ? <span>{`Swap complete`}</span> : null}
    </React.Fragment>
}

export default withStyles(styles)(StreamTransactionStatus);
