#!/usr/bin/env node

require('dotenv').config()
const { Command } = require('commander');
const { ethers } = require("ethers");
const truffleConfig = require('./../truffle-config');
const AcmeCorpContractBuild = require('./../build/contracts/AcmeCorp.json');

const program = new Command();

program
  .name('acme-corp')
  .description('CLI to interact with AcmeCorp Contract')
  .version('0.1.0')
;

program.command('accounts')
  .description('Get a list of unlocked accounts')
  .action(async () => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const managers = await acmeCorp.getWarehouseManagers();
    console.log('ACOUNTS');
    console.log('=======');
    console.log('');
    for (let i = 0; i < accounts.length; i++) {
      console.log(`Account ${i+1}:  ${accounts[i]}${i==0?' (administrator)':''}${managers.includes(accounts[i]) ? ' (manager)' : ''}`)
    }
    console.log('');
  });

program.command('managers')
  .description('Get a list of warehouse manager addresses')
  .action(async () => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const managers = await acmeCorp.getWarehouseManagers();
    console.log('MANAGERS');
    console.log('========');
    console.log('');
    for (let i = 0; i < managers.length; i++) {
      const managerAddress = managers[i];
      const acmeCorpManager = await getAcmeCorpContractForAccount(provider, managerAddress);
      const manager = await acmeCorpManager.getWarehouseManager(managerAddress);
      console.log(`${manager._address}`);
    }
    console.log('');
  });

program.command('add-manager')
  .description('Add a new warehouse manager')
  .argument('<address>', 'a address for new warehouse manager')
  .action(async (_address) => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const managers = await acmeCorp.getWarehouseManagers();
    if (!ethers.utils.isAddress(_address)) {
      console.error(`${_address} is not a valid address`);
      process.exit();
    }
    console.log('ADD MANAGER');
    console.log('===========');
    console.log('');
    console.log(`Address: ${_address}`);
    console.log('');
    if (managers.includes(_address)) {
      console.error('Warehouse Manager already exists');
      process.exit();
    }
    await acmeCorp.addWarehouseManager(_address);
    console.log('Added Warehouse Manager')
    console.log('');
  });

program.command('remove-manager')
  .description('Remove a warehouse manager')
  .argument('<address>', 'a address for new warehouse manager')
  .action(async (_address) => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const managers = await acmeCorp.getWarehouseManagers();
    if (!ethers.utils.isAddress(_address)) {
      console.error(`${_address} is not a valid address`);
      process.exit();
    }
    console.log('REMOVE MANAGER');
    console.log('==============');
    console.log('');
    console.log(`Address: ${_address}`);
    console.log('');
    if (!managers.includes(_address)) {
      console.error('Warehouse Manager does not exist');
      process.exit();
    }
    await acmeCorp.removeWarehouseManager(_address);
    console.log('Removed Warehouse Manager')
    console.log('');
  });

program.command('prices')
  .description('Get the current price for items')
  .action(async (options) => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const widgetPrice = await acmeCorp.getItemPriceWei(0);
    console.log('PRICES');
    console.log('======');
    console.log('');
    console.log(`WIDGETS (ID: 0): ${widgetPrice} WEI or ${ethers.utils.formatEther(widgetPrice)} ETH`);
    console.log('');
  });

program.command('set-price')
  .description('Set the price in wei for given itemId')
  .argument('<itemId>', 'a item id (widgets = 0)')
  .argument('<weiValue>', 'a value in wei (contract defaults to 800000000000000)')
  .action(async (_itemId, _weiPrice, options) => {
    const itemId = parseInt(_itemId, 10);
    const weiPrice = parseInt(_weiPrice, 10);
    if (isNaN(itemId) || isNaN(weiPrice)) {
      console.error('invalid itemId or weiPrice')
      process.exit()
    }
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    let itemPrice = await acmeCorp.getItemPriceWei(itemId);
    console.log('SET PRICE');
    console.log('=========');
    console.log(`Current Price: ${itemPrice} WEI or ${ethers.utils.formatEther(itemPrice)} ETH`);
    await acmeCorp.setItemPriceWei(_itemId, _weiPrice);
    itemPrice = await acmeCorp.getItemPriceWei(itemId);
    console.log(`New Price:     ${itemPrice} WEI or ${ethers.utils.formatEther(itemPrice)} ETH`);
    console.log('');
  });

program.command('stock')
  .description('Get the stock levels')
  .action(async () => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    console.log('STOCK: WIDGETS (ID: 0)');
    console.log('======================');
    console.log('');
    const managers = await acmeCorp.getWarehouseManagers();
    for (let i = 0; i < managers.length; i++) {
      const manager = managers[i];
      const acmeCorpManager = await getAcmeCorpContractForAccount(provider, manager);
      const balance = await acmeCorpManager.balanceOf(manager, 0);
      console.log(`WAREHOUSE MANAGER ${manager}: ${balance}`)
    }
    console.log('');
  });

program.command('set-stock')
  .description('set the current stock for an item and warehouse manager')
  .argument('<address>', 'a warehouse manager address')
  .argument('<itemId>', 'a item id (widgets = 0)')
  .argument('<stock>', 'the new stock level')
  .action(async (_address, _itemId, _stock) => {
    const itemId = parseInt(_itemId, 10);
    const stock = parseInt(_stock, 10);
    if (isNaN(itemId) || isNaN(stock)) {
      console.error('invalid itemId or stock')
      process.exit()
    }
    if (!ethers.utils.isAddress(_address)) {
      console.error(`${_address} is not a valid address`);
      process.exit();
    }
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, _address);
    console.log('SET STOCK');
    console.log('=========');
    console.log('');
    console.log(`ITEM ID:           ${itemId}`);
    console.log(`WAREHOUSE MANAGER: ${_address}`);
    let balance = await acmeCorp.balanceOf(_address, itemId);
    console.log(`CURRENT STOCK:     ${balance}`);
    await acmeCorp.updateStock(_address, itemId, stock);
    balance = await acmeCorp.balanceOf(_address, itemId);
    console.log(`NEW STOCK:         ${balance}`);
    console.log('');
  });

program.command('widget-balances')
  .description('Get the widget balances for all accounts')
  .action(async () => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    console.log('BALANCES: WIDGETS (ID: 0)');
    console.log('=========================');
    console.log('');
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const balance = await acmeCorp.balanceOf(account, 0);
      console.log(`${account}: ${balance}`)
    }
    console.log('');
  });

program.command('open-orders')
  .description('Get all open orders')
  .action(async () => {
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    console.log('OPEN ORDERS');
    console.log('===========');
    console.log('');
    const orderIds = await acmeCorp.getOpenWarehouseOrders();
    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const order = await acmeCorp.getOpenWarehouseOrder(orderId);
      console.log(`ID: ${order.orderId} | ITEM ID: ${order.itemId} | QTY: ${order.quantity}`);
      console.log(`MANAGER:  ${order.warehouseManagerAddress}`);
      console.log(`CUSTOMER: ${order.customerAddress}`);
      console.log('');
    }
    console.log('');
  });

program.command('place-order')
  .description('place and pay for an order of itemId')
  .argument('<customer>', 'the customers address')
  .argument('<warehouseManager>', 'the warehouse manager address')
  .argument('<itemId>', 'a item id (widgets = 0)')
  .argument('<quantity>', 'the quantity to order')
  .action(async (_customer, _warehouseManager, _itemId, _quantity, options) => {
    const itemId = parseInt(_itemId, 10);
    const quantity = parseInt(_quantity, 10);
    if (isNaN(itemId) || isNaN(quantity)) {
      console.error('invalid itemId or quantity')
      process.exit()
    }
    if (!ethers.utils.isAddress(_customer)) {
      console.error(`${_customer} is not a valid address`);
      process.exit();
    }
    if (!ethers.utils.isAddress(_warehouseManager)) {
      console.error(`${_warehouseManager} is not a valid address`);
      process.exit();
    }
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, _customer);
    const widgetPrice = await acmeCorp.getItemPriceWei(0);
    const totalPrice = widgetPrice * quantity;
    const customerBalance = await provider.getBalance(_customer);
    console.log('PLACE ORDER');
    console.log('===========');
    console.log('');
    console.log(`ITEM ID:           ${itemId}`);
    console.log(`QUANTITY:          ${quantity}`);
    console.log(`CUSTOMER:          ${_customer}`);
    console.log(`WAREHOUSE MANAGER: ${_warehouseManager}`);
    console.log(`PRICE UNIT:        ${widgetPrice} WEI`);
    console.log(`PRICE TOTAL:       ${totalPrice} WEI`);
    console.log(`CUSTOMER BALANCE:  ${customerBalance} WEI`)
    console.log('');
    let balance = await acmeCorp.balanceOf(_warehouseManager, itemId);
    if (balance < quantity) {
      console.error('Warehouse Manager has insufficient stock')
      process.exit();
    }
    if (customerBalance < totalPrice) {
      console.error('Customer has insufficient stock')
    }
    await acmeCorp.placeOrder(itemId, quantity, _warehouseManager, { value: `${totalPrice}` });
    console.log('Order Placed');
    console.log('');
  });

program.command('reject-order')
  .description('set the current stock for an item and warehouse manager')
  .argument('<orderId>', 'a warehouse manager address')
  .action(async (_orderId, _stock) => {
    const orderId = parseInt(_orderId, 10);
    if (isNaN(orderId)) {
      console.error('invalid orderId')
      process.exit()
    }
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const orderIds = await acmeCorp.getOpenWarehouseOrders();
    console.log('REJECT ORDER');
    console.log('============');
    console.log('');
    if (!orderIds.map(orderId => orderId.toNumber()).includes(orderId)) {
      console.error('Order ID does not exist or is not open');
      process.exit();
    }
    const order = await acmeCorp.getOpenWarehouseOrder(orderId);
    const acmeCorpManager = await getAcmeCorpContractForAccount(provider, order.warehouseManagerAddress);
    await acmeCorpManager.rejectOpenOrder(orderId);
    console.log(`Rejected Open Order ${orderId}`);
    console.log('');
  });

program.command('ship-order')
  .description('set the current stock for an item and warehouse manager')
  .argument('<orderId>', 'a warehouse manager address')
  .action(async (_orderId, _stock) => {
    const orderId = parseInt(_orderId, 10);
    if (isNaN(orderId)) {
      console.error('invalid orderId')
      process.exit()
    }
    const provider = await getEthersProvider();
    const accounts = await provider.listAccounts();
    const acmeCorp = await getAcmeCorpContractForAccount(provider, accounts[0]);
    const orderIds = await acmeCorp.getOpenWarehouseOrders();
    console.log('SHIP ORDER');
    console.log('==========');
    console.log('');
    if (!orderIds.map(orderId => orderId.toNumber()).includes(orderId)) {
      console.error('Order ID does not exist or is not open');
      process.exit();
    }
    const order = await acmeCorp.getOpenWarehouseOrder(orderId);
    const acmeCorpManager = await getAcmeCorpContractForAccount(provider, order.warehouseManagerAddress);
    await acmeCorpManager.shipOpenOrder(orderId);
    console.log(`Shipped Open Order ${orderId}`);
    console.log('');
  });

program.parse();

async function getEthersProvider() {
  const network = await getNetwork(process.env.ACME_CORP_NETWORK);
  return new ethers.providers.JsonRpcProvider(`http://${network.host}:${network.port}`);
}

async function getAcmeCorpContractForAccount(provider, account) {
  return (new ethers.Contract(
      AcmeCorpContractBuild.networks[process.env.ACME_CORP_NETWORK_ID].address,
      AcmeCorpContractBuild.abi,
      provider
  )).connect(provider.getSigner(account));
}

async function getNetwork(name) {
  const networkConfig = truffleConfig.networks[name?name:process.env.ACME_CORP_NETWORK];
  if (!networkConfig) {
    console.error('invalid network name, please check truffle-config.js');
    process.exit();
  }
  return networkConfig;
}
