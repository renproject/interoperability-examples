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
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import Hidden from '@material-ui/core/Hidden';


import { withRouter } from "react-router";

import RenVMLogo from '../assets/renvm-logo.svg'
import { ReactComponent as ExchangeIcon } from '../assets/exchange.svg'
import { ReactComponent as StreamIcon } from '../assets/stream.svg'
import { ReactComponent as TwitterIcon } from '../assets/twitter.svg'
import { ReactComponent as GithubIcon } from '../assets/github.svg'
import { ReactComponent as TelegramIcon } from '../assets/telegram.svg'
import { ReactComponent as RedditIcon } from '../assets/reddit.svg'
import { ReactComponent as TransferIcon } from '../assets/transfer.svg'

const styles = () => ({
    tabs: {
        '& .MuiTabs-flexContainer': {
            alignItems: 'flex-end',
            width: '100%'
        },
        '& .MuiTab-wrapper': {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            '& svg': {
                marginRight: theme.spacing(2),
                marginBottom: '0px !important',
                width: 30,
                height: 'auto'
            },
        },
        '& span.MuiTabs-indicator': {
            backgroundColor: '#006BEC',
            width: 11,
            right: 'calc(100% - 11px)',
        },
        '& button.MuiTab-textColorInherit': {
            color: '#fff',
            textTransform: 'capitalize',
            maxWidth: 350,
            width: '100%',
            fontSize: 18,
            borderTop: '1px solid #142F4D',
            minHeight: 90,
            paddingLeft: theme.spacing(4),
        },
        '& button.MuiTab-textColorInherit.Mui-selected': {
            color: '#006BEC',
            '& path': {
                fill: '#006BEC'
            }
        },
        width: '100%'
    },
    tabsMobile: {
        // paddingTop: theme.spacing(2),
        paddingRight: theme.spacing(2),
        '& .MuiTabs-flexContainer': {
            alignItems: 'flex-start',
        },
        '& .MuiTab-wrapper': {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            '& svg': {
                marginRight: theme.spacing(2),
                marginBottom: '0px !important',
                width: 30,
                height: 'auto'
            },
            [theme.breakpoints.down('xs')]: {
                '& span': {
                    display: 'none'
                },
            }
        },
        '& span.MuiTabs-indicator': {
            backgroundColor: 'transparent'
        },
        '& button.MuiTab-textColorInherit': {
            color: '#fff',
            textTransform: 'capitalize',
            fontSize: 18,
        },
        '& button.MuiTab-textColorInherit.Mui-selected': {
            color: '#006BEC',
            '& path': {
                fill: '#006BEC'
            }
        },
    },
    logoContainer: {
        maxWidth: 350,
        width: '100%',
        paddingTop: theme.spacing(5),
        paddingBottom: theme.spacing(5),
        [theme.breakpoints.down('sm')]: {
            // paddingTop: theme.spacing(0),
            maxWidth: 'auto',
            width: 'auto'
        },
        [theme.breakpoints.down('xs')]: {
            maxWidth: '50%',
            width: 140
        }
    },
    logo: {
        width: 184,
        maxWidth: '100%',
        height: 'auto',
        marginLeft: theme.spacing(4),
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        // paddingTop: theme.spacing(4),
        background: '#001B3A',
        color: '#fff',
        minHeight: '100%',
        [theme.breakpoints.down('sm')]: {
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            paddingTop: theme.spacing(0),
        }
    },
    networkChooser: {
        marginRight: theme.spacing(5.5),
        marginTop: theme.spacing(1)
    },
    top: {
        maxWidth: 350,
        width: '100%',
        [theme.breakpoints.down('sm')]: {
            maxWidth: '100%',
            display:'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            paddingTop: theme.spacing(0),
        }
    },
    bottom: {
        boxSizing: 'border-box',
        maxWidth: 350,
        width: '100%',
        borderTop: '1px solid #142F4D',
        padding: theme.spacing(4),
        fontSize: 14,
        fontWeight: 'normal',
        color: '#CCD1D8',
        '& span': {
            color: '#fff',
            fontSize: 16,
            lineHeight: 2
        }
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: theme.spacing(6),
        paddingBottom: theme.spacing(3),
        '& a': {
            marginRight: theme.spacing(3)
        }
    }
})



class ActionTabsContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
    }

    componentWillMount() {
        // const { location, store } = this.props
        // if (location.pathname && location.pathname.match(/stream/)) {
        //     store.set('selectedActionTab', 'stream')
        // }
    }

    changeTabs(value) {
        const { store } = this.props
        store.set('selectedActionTab', value)
    }

    render() {
        const {
            classes,
            store,
            history
        } = this.props

        // console.log(this.props, this.state)

        return <div className={classes.container}>
            <div className={classes.top}>
                <div className={classes.logoContainer}>
                    <img className={classes.logo} src={RenVMLogo} />
                </div>
                <Hidden smDown>
                    <Tabs
                        orientation="vertical"
                        value={store.get('selectedActionTab')}
                        onChange={(e, value) => {
                            this.changeTabs.bind(this)(value)
                            // history.push(value === 'exchange' ? '/' : '/stream')
                        }}
                        className={classes.tabs}
                      >
                        <Tab icon={<TransferIcon />} value={'transfer'} label={<span>Transfer</span>} />
                        <Tab icon={<ExchangeIcon />} value={'exchange'} label={<span>Exchange</span>} />
                        <Tab icon={<StreamIcon />} value={'stream'} label={<span>Streaming</span>} />
                    </Tabs>
                </Hidden>
                <Hidden mdUp>
                    <Tabs
                        value={store.get('selectedActionTab')}
                        onChange={(e, value) => {
                            this.changeTabs.bind(this)(value)
                            // history.push(value === 'exchange' ? '/' : '/stream')
                        }}
                        className={classes.tabsMobile}
                      >
                          <Tab icon={<TransferIcon />} value={'transfer'} label={<span>Transfer</span>} />
                          <Tab icon={<ExchangeIcon />} value={'exchange'} label={<span>Exchange</span>} />
                          <Tab icon={<StreamIcon />} value={'stream'} label={<span>Streaming</span>} />
                    </Tabs>
                </Hidden>
            </div>
            <Hidden smDown>
                <div className={classes.bottom}>
                    <Typography variant='subtitle2'>
                        <span className={classes.subtitle}>About</span>
                        <br />
                    </Typography>
                    <Typography variant='body2'>
                        An experimental laboratory where we’ll be demonstrating the capabilities of&nbsp;RenVM.
                    </Typography>
                    <Typography variant='subtitle2'>
                        <br />
                        <span className={classes.subtitle}>RenVM</span>
                        <br />
                    </Typography>
                    <Typography variant='body2'>
                        RenVM facilitates the trustless swap of digital assets between blockchains. Assets are custodied in a decentralized network and minted on to new blockchains. <br/><a href='https://renproject.io/developers'>Find out&nbsp;more</a>
                    </Typography>
                    <div className={classes.footer}>
                        <a href='https://twitter.com/renprotocol' target='_blank'><TwitterIcon/></a>
                        <a href='https://github.com/renproject' target='_blank'><GithubIcon/></a>
                        <a href='https://t.me/renproject' target='_blank'><TelegramIcon/></a>
                        <a href='https://www.reddit.com/r/RenProject/' target='_blank'><RedditIcon/></a>
                    </div>
                    <div className={classes.contact}>
                        <a href='mailto:support@renproject.io' target='_blank'>Contact</a>
                    </div>
                </div>
            </Hidden>
        </div>
    }
}

export default withStyles(styles)(withStore(ActionTabsContainer))
