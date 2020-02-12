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
    claimItem: {
        fontSize: 12,
        marginBottom: theme.spacing(1),
        display: 'flex',
        width: '100%'
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
    info: {
        display: 'flex',
        justifyContent: 'space-between'
    }
})

const ClaimStreamTransaction = function(props) {
    const {
        tx,
        index,
        classes,
    } = props

    return <Grid className={classes.claimItem} key={index}>
        <Grid item xs={4}>
            <Grid container alignItems='center'>
                <span>{tx.amount} BTC</span>
            </Grid>
        </Grid>
        <Grid item xs={8} className={classes.info}>
            <div className={classes.links}>
                <a target='_blank' href={'https://'+ (tx.network === 'testnet' ? 'kovan.' : '') +'etherscan.io/tx/'+tx.txHash}className={classes.viewLink}>
                    View transaction
                </a>
            </div>
            <div>
                <span>{(new Date(tx.timestamp).toLocaleString())}</span>
            </div>
        </Grid>
    </Grid>
}

export default withStyles(styles)(ClaimStreamTransaction);
