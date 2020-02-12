import React from 'react';
import theme from '../theme/theme'
import { withStyles } from '@material-ui/styles';

import Chip from '@material-ui/core/Chip'
import WarningIcon from '@material-ui/icons/Warning';


const styles = () => ({
    container: {
        fontSize: 12,
        width: '100%',
        marginBottom: theme.spacing(2)
    }
})

function Disclosure(props){
    const { classes } = props
    return <Chip
        className={classes.container}
        icon={<WarningIcon />}
        label={<span><a href='https://chaos.renproject.io/' target='_blank'>Chaosnet</a> is unaudited and this project is in beta. Use at your own risk.</span>}
    />
}

export default withStyles(styles)(Disclosure);
