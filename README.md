[![Truffle Tests](https://github.com/carlcraig/acmecorp/actions/workflows/truffle-tests.yml/badge.svg)](https://github.com/carlcraig/acmecorp/actions/workflows/truffle-tests.yml)

AcmeCorp
========

This project consists of:

- a smart contract for Acme Corporation to model their supply chain
- a test suite to ensure the smart contract meets all the requirements
- a migration/deployment script to manage the smart contract lifecycle
- a command line interface to interact and utilise the deployed smart contract

Smart Contract
-----------------------

The **AcmeCorp** smart contract follows the [**ERC1155**](https://eips.ethereum.org/EIPS/eip-1155) specification and utilises
the [**Upgradeable**](https://docs.openzeppelin.com/contracts/3.x/upgradeable) toolsets provided by OpenZeppelin.

Utilising the ERC1155 spec is interesting as it would allow the same smart contract to seamlessly deal with more *items" in the future,
without the need to re-write/update the smart contract.

> ERC1155 A standard interface for contracts that manage multiple token types. A single deployed contract may include any combination of fungible tokens, non-fungible tokens or other configurations (e.g. semi-fungible tokens).

The **AcmeCorp** smart contract is located in `./contracts/AcmeCorp.sol`, and it provides numerous methods for Acme Corporation to manage their supply chain.

Test Suite
----------

The entire smart contract is covered by a truffle test suite located in `./tests/AcmeCorp.js`

CLI
---

There is a command line interface for Acme Corporation to interact with their smart contract.
This is located in `./scripts/acme-corp.js`.

Installation
============

To get started using this project you will need a few **pre-requisites**

- [**Node.js**](https://nodejs.org/en/)
- [**Ganache**](https://trufflesuite.com/ganache/) or some other local Ethereum system

You will then need to run the following to install all dependencies:

```
npm install
```

Once dependencies are installed you can run the test suite via:

```
npm run test
```

To deploy and interact with the smart contract you will need to have a local ethereum client running.
For this project I utilised [**Ganache**](https://trufflesuite.com/ganache/) to run a local ethereum workspace.

Launch a Ganache workspace ready for this project to utilise. If you are running the project within WSL on windows you will
need to update the Ganache server settings to use `172.27.0.1 - vEthernet (WSL)` or something similar to ensure its accessible within
the WSL environment.

Once you have a local ethereum node running (with unlocked accounts) you can check `truffle-config.js` to ensure the `local` network matches your
ethereum client.

```js
    local: {
      host: "127.0.0.1", // should match your ganache rpc address host
      port: 7545, // should match your ganache rpc address port
      network_id: "*"
    },
```

Finally before we deploy and interact with the smart contract, you need to copy `.env.example` to `.env` to ensure a dotenv file exists for the CLI. Ensure this `.env` file
contains the correct values for your local ethereum client `ACME_CORP_NETWORK_ID` should match the network id in ganache.

Deployment
==========

To deploy the smart contract to your local ethereum client run the following

```
npm run deploy
```

This should deploy the smart contract and its proxies to your local ethereum network.

You are now able to interact with the contract utilising the CLI.

Interacting with Smart Contract
===============================

To interact with a deployed smart contract run the following:

```
npm run acmecorp
```

This will give you a breakdown of all the available commands:

```
Usage: acme-corp [options] [command]

CLI to interact with AcmeCorp Contract

Options:
  -V, --version                                                  output the version number
  -h, --help                                                     display help for command

Commands:
  accounts                                                       Get a list of unlocked accounts
  managers                                                       Get a list of warehouse manager addresses
  add-manager <address>                                          Add a new warehouse manager
  remove-manager <address>                                       Remove a warehouse manager
  prices                                                         Get the current price for items
  set-price <itemId> <weiValue>                                  Set the price in wei for given itemId
  stock                                                          Get the stock levels
  set-stock <address> <itemId> <stock>                           set the current stock for an item and warehouse manager
  widget-balances                                                Get the widget balances for all accounts
  open-orders                                                    Get all open orders
  place-order <customer> <warehouseManager> <itemId> <quantity>  place and pay for an order of itemId
  reject-order <orderId>                                         set the current stock for an item and warehouse manager
  ship-order <orderId>                                           set the current stock for an item and warehouse manager
  help [command]                                                 display help for command
```

Example Usage
=============

Getting a list of all accounts unlocked:

```
> npm run acmecorp accounts

ACOUNTS
=======

Account 1:  0xF1eCCaF1D87E57fb7c9Ad4d6B7315190546a7F15 (administrator)
Account 2:  0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa (manager)
Account 3:  0xCa6E6459466b94a4A4a7f63dFc107C84D1600850 (manager)
Account 4:  0x8c49Bb8cb8fD69EaC132edb9FaA3FFF1755b8529 (manager)
Account 5:  0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C
Account 6:  0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40
Account 7:  0x7795f76e9fBf4da99ae7f9a494C59321f8D8A544
Account 8:  0x454F601e17a2E24E943360B857cA481Bb052510C
Account 9:  0xb137eb816932c6e748089b252ECEAc80d0dd2A94
Account 10:  0xF38981b428eeF97d9D25076b375E931398eda935
```

Getting a list of all warehouse managers:

```
> npm run acmecorp managers

MANAGERS
========

0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa
0xCa6E6459466b94a4A4a7f63dFc107C84D1600850
0x8c49Bb8cb8fD69EaC132edb9FaA3FFF1755b8529
```

Getting current stock levels:

```
> npm run acmecorp stock

STOCK: WIDGETS (ID: 0)
======================

WAREHOUSE MANAGER 0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa: 1000
WAREHOUSE MANAGER 0xCa6E6459466b94a4A4a7f63dFc107C84D1600850: 1000
WAREHOUSE MANAGER 0x8c49Bb8cb8fD69EaC132edb9FaA3FFF1755b8529: 1000
```

Getting current balance of widgets for all accounts:

```
> npm run acmecorp widget-balances

BALANCES: WIDGETS (ID: 0)
=========================

0xF1eCCaF1D87E57fb7c9Ad4d6B7315190546a7F15: 0
0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa: 1000
0xCa6E6459466b94a4A4a7f63dFc107C84D1600850: 1000
0x8c49Bb8cb8fD69EaC132edb9FaA3FFF1755b8529: 1000
0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C: 0
0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40: 0
0x7795f76e9fBf4da99ae7f9a494C59321f8D8A544: 0
0x454F601e17a2E24E943360B857cA481Bb052510C: 0
0xb137eb816932c6e748089b252ECEAc80d0dd2A94: 0
0xF38981b428eeF97d9D25076b375E931398eda935: 0
```

Getting current price information:

```
> npm run acmecorp prices

PRICES
======

WIDGETS (ID: 0): 800000000000000 WEI or 0.0008 ETH
```

Setting a new price for widgets

```
> npm run acmecorp set-price 0 900000000000000

SET PRICE
=========
Current Price: 800000000000000 WEI or 0.0008 ETH
New Price:     900000000000000 WEI or 0.0009 ETH
```

Adding a new warehouse manager

```
> npm run acmecorp add-manager 0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C

ADD MANAGER
===========

Address: 0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C

Added Warehouse Manager
```

Removing an existing warehouse manager

```
> npm run acmecorp remove-manager 0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C

REMOVE MANAGER
==============

Address: 0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C

Removed Warehouse Manager
```

Updating stock for widgets for given warehouse manager:

```
> npm run acmecorp set-stock 0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa 0 1500

SET STOCK
=========

ITEM ID:           0
WAREHOUSE MANAGER: 0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa
CURRENT STOCK:     1000
NEW STOCK:         1500
```

Placing an order from a specific warehouse manager:

```
> npm run acmecorp place-order 0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40 0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa 0 500

PLACE ORDER
===========

ITEM ID:           0
QUANTITY:          500
CUSTOMER:          0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40
WAREHOUSE MANAGER: 0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa
PRICE UNIT:        800000000000000 WEI
PRICE TOTAL:       400000000000000000 WEI
CUSTOMER BALANCE:  98296953780000000000 WEI

Order Placed
```

List open orders:

```
> npm run acmecorp open-orders

OPEN ORDERS
===========

ID: 1 | ITEM ID: 0 | QTY: 500
MANAGER:  0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa
CUSTOMER: 0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40

ID: 2 | ITEM ID: 0 | QTY: 250
MANAGER:  0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa
CUSTOMER: 0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40
```

Reject an open order:

```
> npm run acmecorp reject-order 1

REJECT ORDER
============

Rejected Open Order 1
```

Ship an open order:

```
> npm run acmecorp ship-order 2

SHIP ORDER
==========

Shipped Open Order 2
```

Finally you can check widget balances of all accounts by doing:

```
> npm run acmecorp widget-balances

BALANCES: WIDGETS (ID: 0)
=========================

0xF1eCCaF1D87E57fb7c9Ad4d6B7315190546a7F15: 0
0x314AD633ffCf4D21b5317b9aa885e8B74EAE46aa: 1250
0xCa6E6459466b94a4A4a7f63dFc107C84D1600850: 1000
0x8c49Bb8cb8fD69EaC132edb9FaA3FFF1755b8529: 1000
0x1e814Ac6A86562591AEc30Ea75c15365E2c8f28C: 0
0x094430ca3250ee47faB4fa6fd4839d88fe3c9B40: 250
0x7795f76e9fBf4da99ae7f9a494C59321f8D8A544: 0
0x454F601e17a2E24E943360B857cA481Bb052510C: 0
0xb137eb816932c6e748089b252ECEAc80d0dd2A94: 0
0xF38981b428eeF97d9D25076b375E931398eda935: 0
```
