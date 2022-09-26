const AcmeCorp = artifacts.require("AcmeCorp");
const truffleAssert = require('truffle-assertions');

const WIDGETS_TOKEN_ID = 0;

contract('AcmeCorp', async (accounts) => {

  const administratorAccount = accounts[0];
  const warehouseManagerAccount1 = accounts[1];
  const warehouseManagerAccount2 = accounts[2];
  const warehouseManagerAccount3 = accounts[3];
  const customerAccount1 = accounts[4];
  const customerAccount2 = accounts[5];
  const customerAccount3 = accounts[6];
  
  it('should set administrator address', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    const administrator = await acmeCorpInstance.getAdministrator.call({ from: administratorAccount });

    assert.equal(administrator.valueOf(), administratorAccount, "owner account is incorrect");
  });

  it('only administrator can get administrator address', async () => {
    try {
      const acmeCorpInstance = await AcmeCorp.deployed();
      await acmeCorpInstance.getAdministrator.call({ from:warehouseManagerAccount1 });
      assert.fail("...");
    }
    catch (err) {
      assert.include(err.message, "revert", "the error message should contain 'revert'");
    }
  });

  it('should provide a default widget price', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    const widgetItemPrice = await acmeCorpInstance.getItemPriceWei(WIDGETS_TOKEN_ID, { from: administratorAccount });
    assert.equal(widgetItemPrice.toNumber(), 800000000000000, "widget price is not set correctly");
  });

  it('should allow administrators to set widget price', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    let widgetItemPrice = await acmeCorpInstance.getItemPriceWei(WIDGETS_TOKEN_ID, { from: administratorAccount });
    assert.equal(widgetItemPrice.toNumber(), 800000000000000, "widget price is not set correctly");
    await acmeCorpInstance.setItemPriceWei(WIDGETS_TOKEN_ID, 900000000000000, { from: administratorAccount });
    widgetItemPrice = await acmeCorpInstance.getItemPriceWei(WIDGETS_TOKEN_ID, { from: administratorAccount });
    assert.equal(widgetItemPrice.toNumber(), 900000000000000, "widget price is not set correctly");
    await acmeCorpInstance.setItemPriceWei(WIDGETS_TOKEN_ID, 800000000000000, { from: administratorAccount });
  });

  it('should return empty list of warehouse managers', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    const warehouseManagers = await acmeCorpInstance.getWarehouseManagers.call();
    assert.equal(warehouseManagers.length, 0, "there should initially be 0 warehouse managers")
  });
  
  it('should support adding a warehouse manager', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    const warehouseManagers = await acmeCorpInstance.getWarehouseManagers.call();
    assert.equal(warehouseManagers.length, 1, "there should be 1 warehouse manager")
    const warehouseManager = await acmeCorpInstance.getWarehouseManager.call(warehouseManagerAccount1);
    assert.equal(warehouseManager._address, warehouseManagerAccount1, `the warehouse manager address should be ${warehouseManagerAccount1}`)
  });

  it('should support removing a warehouse manager', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    let warehouseManagers = await acmeCorpInstance.getWarehouseManagers.call();
    assert.equal(warehouseManagers.length, 1, "there should be 1 warehouse managers")
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
    warehouseManagers = await acmeCorpInstance.getWarehouseManagers.call();
    assert.equal(warehouseManagers.length, 0, "there should be 0 warehouse managers")
  });

  it('should support getting a warehouse manager', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    let warehouseManagers = await acmeCorpInstance.getWarehouseManagers.call();
    assert.equal(warehouseManagers.length, 1, "there should be 1 warehouse managers")
    const warehouseManager = await acmeCorpInstance.getWarehouseManager.call(warehouseManagerAccount1);
    assert.equal(warehouseManager._address, warehouseManagerAccount1, `the warehouse manager address should be ${warehouseManagerAccount1}`)
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
    warehouseManagers = await acmeCorpInstance.getWarehouseManagers.call();
    assert.equal(warehouseManagers.length, 0, "there should be 0 warehouse managers")
  });

  it('should support warehouse managers updating stock', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    let balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 0, "0 widgets were not in the warehouse manager account");
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 100, { from: warehouseManagerAccount1 });
    balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 100, "100 widgets were not in the warehouse manager account");
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 60, { from: warehouseManagerAccount1 });
    balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 60, "60 widgets were not in the warehouse manager account");
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 0, { from: warehouseManagerAccount1 });
    balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 0, "0 widgets were not in the warehouse manager account");
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
  });

  it('should support administrator updating other managers stock', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    let balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 0, "0 widgets were not in the warehouse manager account");
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 100, { from: administratorAccount });
    balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 100, "100 widgets were not in the warehouse manager account");
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 60, { from: administratorAccount });
    balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 60, "60 widgets were not in the warehouse manager account");
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 0, { from: administratorAccount });
    balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 0, "0 widgets were not in the warehouse manager account");
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
  });

  it('should prevent warehouse managers updating other warehouse managers stock', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount2);

    let balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 0, "0 widgets were not in the warehouse manager account");

    try {
      await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 100, { from: warehouseManagerAccount2 });
      assert.fail("...");
    }
    catch (err) {
      assert.include(err.message, "revert", "the error message should contain 'revert'");
    }

    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 0, { from: warehouseManagerAccount1 });
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount2);
  });

  it('should prevent customers updating warehouse managers stock', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);

    let balance = await acmeCorpInstance.balanceOf.call(warehouseManagerAccount1, WIDGETS_TOKEN_ID);
    assert.equal(balance.toString(), 0, "0 widgets were not in the warehouse manager account");

    try {
      await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 100, { from: customerAccount1 });
      assert.fail("...");
    }
    catch (err) {
      assert.include(err.message, "revert", "the error message should contain 'revert'");
    }

    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 0, { from: warehouseManagerAccount1 });
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
  });

  it('should prevent placing order for non existant warehouse manager', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    const widgetTokenId = 0;
    try {
      await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 100,  warehouseManagerAccount1, { from: customerAccount1 });
      assert.fail("...");
    }
    catch (err) {
      assert.include(err.message, "not exist", "the error message should contain 'not exist'");
    }
  });

  it('should prevent placing order for when warehouse manager has insufficient stock', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 90, { from: warehouseManagerAccount1 });
    try {
      await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 100,  warehouseManagerAccount1, { from: customerAccount1 });
      assert.fail("...");
    }
    catch (err) {
      assert.include(err.message, "insufficient stock", "the error message should contain 'insufficient stock'");
    }
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 0, { from: warehouseManagerAccount1 });
    await acmeCorpInstance.removeWarehouseManager(warehouseManagerAccount1);
  });

  it('should allow placing order from a warehouse manager', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.addWarehouseManager(warehouseManagerAccount1);
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 100, { from: warehouseManagerAccount1 });
    const widgetPriceWei = (await acmeCorpInstance.getItemPriceWei(WIDGETS_TOKEN_ID)).toNumber();
    const tx1 = await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 50,  warehouseManagerAccount1, { from: customerAccount1, value: widgetPriceWei * 50 });
    const tx2 = await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 50,  warehouseManagerAccount1, { from: customerAccount2, value: widgetPriceWei * 50 });
    const tx3 = await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 50,  warehouseManagerAccount1, { from: customerAccount3, value: widgetPriceWei * 50 });
    const warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 3, "there should be 3 open orders")
    truffleAssert.eventEmitted(tx1, 'WarehouseOrder', (ev) => {
        return ev.customerAddress === customerAccount1;
    });
    truffleAssert.eventEmitted(tx2, 'WarehouseOrder', (ev) => {
      return ev.customerAddress === customerAccount2;
    });
    truffleAssert.eventEmitted(tx3, 'WarehouseOrder', (ev) => {
      return ev.customerAddress === customerAccount3;
    });
  });

  it('should prevent placing order with insufficient funds', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    const widgetPriceWei = (await acmeCorpInstance.getItemPriceWei(WIDGETS_TOKEN_ID)).toNumber();
    try {
      await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 50,  warehouseManagerAccount1, { from: customerAccount1, value: widgetPriceWei * 50/2 });
      assert.fail("...");
    }
    catch (err) {
      assert.include(err.message, "insufficient wei", "the error message should contain 'insufficient wei'");
    }
  });

  it('should allow getting order data by id', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    const warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 3, "there should be 3 open orders");
    for (let i = 0; i < warehouseManagerOpenOrders.length; i++) {
      const openWarehouseOrder = await acmeCorpInstance.getOpenWarehouseOrder(warehouseManagerOpenOrders[i], { from: warehouseManagerAccount1 });
      // previous orders were for accounts index 4,5,6 so we can use loop index to check correct account
      assert.equal(openWarehouseOrder.customerAddress, accounts[4 + i], "customer address does not match");
    }
  });

  it('should allow rejecting orders by a warehouse manager', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    let warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 3, "there should be 3 open orders")
    await acmeCorpInstance.rejectOpenOrder(warehouseManagerOpenOrders[warehouseManagerOpenOrders.length - 3], { from: warehouseManagerAccount1 });
    warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 2, "there should be 2 open orders")
    await acmeCorpInstance.rejectOpenOrder(warehouseManagerOpenOrders[warehouseManagerOpenOrders.length - 2], { from: warehouseManagerAccount1 });
    warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 1, "there should be 1 open orders")
    await acmeCorpInstance.rejectOpenOrder(warehouseManagerOpenOrders[warehouseManagerOpenOrders.length - 1], { from: warehouseManagerAccount1 });
    warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 0, "there should be 0 open orders")
  });

  it('should allow shipping an order', async () => {
    const acmeCorpInstance = await AcmeCorp.deployed();
    await acmeCorpInstance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 1000, { from: warehouseManagerAccount1 });
    const widgetPriceWei = (await acmeCorpInstance.getItemPriceWei(WIDGETS_TOKEN_ID)).toNumber();
    const tx1 = await acmeCorpInstance.placeOrder(WIDGETS_TOKEN_ID, 500,  warehouseManagerAccount1, { from: customerAccount1, value: widgetPriceWei * 500 });
    const warehouseManagerOpenOrders = await acmeCorpInstance.getWarehouseManagerOpenOrders(warehouseManagerAccount1, { from: warehouseManagerAccount1 });
    assert.equal(warehouseManagerOpenOrders.length, 1, "there should be 1 open orders")
    truffleAssert.eventEmitted(tx1, 'WarehouseOrder', (ev) => {
        return ev.customerAddress === customerAccount1;
    });
    const orderId = warehouseManagerOpenOrders[0];
    const order = await acmeCorpInstance.getOpenWarehouseOrder(orderId, { from: warehouseManagerAccount1 })
    const warehouseManagerAddress = order.warehouseManagerAddress;
    const customerAddress = order.customerAddress;
    const warehouseManagerBalance = await acmeCorpInstance.balanceOf.call(warehouseManagerAddress, WIDGETS_TOKEN_ID);
    const customerBalance = await acmeCorpInstance.balanceOf.call(customerAddress, WIDGETS_TOKEN_ID);
    const expectedWarehouseManagerBalance = parseInt(warehouseManagerBalance) - parseInt(order.quantity);
    const expectedCustomerBalance = parseInt(customerBalance) + parseInt(order.quantity);
    await acmeCorpInstance.shipOpenOrder(orderId, { from: warehouseManagerAccount1 });
    const newWarehouseManagerBalance = await acmeCorpInstance.balanceOf.call(warehouseManagerAddress, WIDGETS_TOKEN_ID);
    const newCustomerBalance = await acmeCorpInstance.balanceOf.call(customerAddress, WIDGETS_TOKEN_ID);
    assert.equal(parseInt(newWarehouseManagerBalance, 10), expectedWarehouseManagerBalance, "the warehouse manager balance should update");
    assert.equal(parseInt(newCustomerBalance, 10), expectedCustomerBalance, "the customer balance should update");
  });
});
