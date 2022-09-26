const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AcmeCorp = artifacts.require("AcmeCorp");

module.exports = async function(deployer, network, accounts) {
  // deploy contract and proxy
  const instance = await deployProxy(AcmeCorp, [], { deployer });
  console.log('Deployed', instance.address);

  // setup initial warehouse managers if network is not "test"
  if (network !== "test") {
    const warehouseManagerAccount1 = accounts[1];
    const warehouseManagerAccount2 = accounts[2];
    const warehouseManagerAccount3 = accounts[3];
    const WIDGETS_TOKEN_ID = 0;

    // create 3 warehouse managers and add 1000 widget stock to each

    await instance.addWarehouseManager(warehouseManagerAccount1);
    console.log('Created Warehouse Manager with address ', warehouseManagerAccount1);
    await instance.updateStock(warehouseManagerAccount1, WIDGETS_TOKEN_ID, 1000, { from: warehouseManagerAccount1 });
    console.log('Updated stock to 1000');

    await instance.addWarehouseManager(warehouseManagerAccount2);
    console.log('Created Warehouse Manager with address ', warehouseManagerAccount2);
    await instance.updateStock(warehouseManagerAccount2, WIDGETS_TOKEN_ID, 1000, { from: warehouseManagerAccount2 });
    console.log('Updated stock to 1000');

    await instance.addWarehouseManager(warehouseManagerAccount3);
    console.log('Created Warehouse Manager with address ', warehouseManagerAccount3);
    await instance.updateStock(warehouseManagerAccount3, WIDGETS_TOKEN_ID, 1000, { from: warehouseManagerAccount3 });
    console.log('Updated stock to 1000');
  }
};
