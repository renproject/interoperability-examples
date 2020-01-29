import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'


import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'


const styles = () => ({
    tabs: {
        paddingTop: theme.spacing(4),
        paddingRight: theme.spacing(2),
        '& .MuiTab-wrapper': {
            alignItems: 'flex-end',
            // paddingRight: theme.spacing(1)
        }
    }
})



class ActionTabsContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
    }

    changeTabs(value) {
        const { store } = this.props
        store.set('selectedActionTab', value)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        // console.log(this.props, this.state)

        return <Tabs
          orientation="vertical"
          value={store.get('selectedActionTab')}
          onChange={(e, value) => {
            this.changeTabs.bind(this)(value)
          }}
          className={classes.tabs}
        >
          <Tab value={'exchange'} label="Exchange" />
          <Tab value={'stream'} label="Streaming Payments" />
        </Tabs>
    }
}

export default withStyles(styles)(withStore(ActionTabsContainer))
