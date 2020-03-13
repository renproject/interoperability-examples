import React from 'react';
import theme from '../theme/theme'

import { withStyles } from '@material-ui/styles';
import { withStore } from '@spyna/react-store'

import Button from '@material-ui/core/Button';

// import { switchNetwork } from '../utils/networkingUtils'
import { initLocalWeb3 } from '../utils/walletUtils'

const styles = () => ({
    container: {
        fontSize: 14,
        background: '#fff',
        boxShadow: '0px 0px 4px rgba(0, 27, 58, 0.1)',
        border: '1px solid #DCE0E3',
        '&:hover': {
            background: '#fff',
            boxShadow: '0px 0px 4px rgba(0, 27, 58, 0.1)',
        }
    }
})

function WalletButton(props){
    const { classes, store } = props

    const localWeb3 = store.get('localWeb3')
    const localWeb3Address = store.get('localWeb3Address')
    const localWeb3Network = store.get('localWeb3Network')

    const connected = localWeb3 && localWeb3Address

    return <Button
        variant='contained'
        className={classes.container}
        onClick={() => {
            initLocalWeb3.bind({props})()
        }}>
        {connected ? localWeb3Address.slice(0, 5) + '...' + localWeb3Address.slice(localWeb3Address.length-3, localWeb3Address.length)  : 'Connect wallet'}
    </Button>
}

export default withStyles(styles)(withStore(WalletButton))
