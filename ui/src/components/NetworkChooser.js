import React from 'react';
import theme from '../theme/theme'
import { withStyles } from '@material-ui/styles';

import Select from '@material-ui/core/Select';

import { switchNetwork } from '../utils/networkingUtils'

const styles = () => ({
    container: {
        fontSize: 14
    }
})

function NetworkChooser(props){
    const { currentNetwork, onChange, classes, disabled } = props
    return <Select
        native
        disabled={Boolean(disabled)}
        value={currentNetwork}
        className={classes.container}
        onChange={onChange}
        inputProps={{
            name: '',
            id: 'age-native-simple',
        }}>
        <option value="chaosnet">Chaosnet</option>
        <option value="testnet">Testnet</option>
    </Select>
}

export default withStyles(styles)(NetworkChooser);
