## GSN Integration

When building smart contracts that interact with RenVM, you can use patterns to enable methods to be called via the OpenZeppelin [Gas Station Network (GSN)](https://gsn.openzeppelin.com/). The GSN is a decentralized solution for solving user onboarding to Ethereum applications. It allows dapps to pay for their users' transactions in a secure way, so users don’t need to hold ETH to pay for their gas or even set up an account.

### 1. Deploy adapter

Deploy one of the adapter contracts in the `/contracts` directory.

### 2. Fund adapter with ETH

Your adapter will pay gas fees for users using a pool of ETH deposited into GSN's RelayHub. To fund your adapter, [click here](https://gsn.openzeppelin.com/recipients).

### 3) Set environment variables

Update the `adapterAddress` in `App.js` with your adapter's address.

```
const initialState = {
    transactions: [],
    adapterAddress: '0x17BB7d6F4722373A88E2f4C8F91db91EE7d86dae'
}
```

### 4) Install dependencies and run

In main terminal window run
`npm install && npm start`
