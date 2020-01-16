## Accelerated Shift-in Confirmations

One thing that developers can do to improve cross-chain user experience is to help users complete actions faster by using funds that have already been shifted. These funds can be accessed in a variety of trustful and trustless ways, however the goal is the same - facilitate a cross-chain transaction in a shorter time that it would take the user to first fully shift in an asset and then complete an action.

### 1. Deploy adapter

Deploy one of the adapter contracts in the `/contracts` directory using the same owner address parameter as the wallet you plan fill transactions with.

### 2. Deposit shifted tokens

Deposit shifted tokens to the adapter address through the `deposit()` method. The adapter will use these funds to complete swaps. Please note: you'll need to approve the adapter contract on the shifted token contract before depositing.

[justsmartcontracts.dev](https://justsmartcontracts.dev/) is an easy way to interact with smart contracts using just the contract address and ABI.

### 3) Set environment variables

Create a `.env` file at the root directory with the following variables and their real world values:

```
WALLET_ADDRESS=""
WALLET_KEY=""
ADAPTER_ADDRESS=""
```

### 4) Install dependencies and run

In main terminal window run
`npm install && npm start`
