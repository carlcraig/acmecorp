// SPDX-License-Identifier: MIT
// Tells the Solidity compiler to compile only from v0.8.13 to v0.9.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AcmeCorp is ERC1155Upgradeable {

  uint256 public constant ORDER_PLACED = 1;
  uint256 public constant ORDER_REJECTED = 2;
  uint256 public constant ORDER_SHIPPED = 3;

  uint256 public constant WIDGETS_TOKEN_ID = 0;

  struct WarehouseManager {
    address _address;
    bool exists;
  }
  struct OpenWarehouseOrder {
    uint256 itemId;
    address warehouseManagerAddress;
    address customerAddress;
    uint256 orderId;
    uint256 quantity;
    uint256 weiValue;
    bool exists;
  }
  event WarehouseOrder(
    uint256 indexed status,
    address indexed warehouseManagerAddress,
    address indexed customerAddress,
    uint256 itemId,
    uint256 orderId,
    uint256 quantity,
    uint256 weiValue,
    bool pending,
    bool shipped,
    bool success
  );

  address internal _administrator;
  mapping (uint256 => uint256) public _itemPricesWei;
  mapping (address => WarehouseManager) internal _warehouseManagerMapping;
  address[] internal _warehouseManagerList;
  Counters.Counter private _warehouseOrderIdCounter;
  mapping (uint256 => OpenWarehouseOrder) _openWarehouseOrderMapping;
  mapping (address => uint256[]) _openWarehouseOrderByManagerMapping;
  uint256[] internal _openWarehouseOrderList;

  function initialize() public initializer {
    __ERC1155_init("");
    _administrator = tx.origin;
    _itemPricesWei[WIDGETS_TOKEN_ID] = 800000000000000;
  }

  modifier administratorOwnly {
    require(tx.origin == _administrator); //same as the if above
    _; //tells that this modifier should be executed before the code
  }

  modifier warehouseManagerOrAdministratorOnly {
    require(tx.origin == _administrator || _warehouseManagerMapping[tx.origin].exists); //same as the if above
    _; //tells that this modifier should be executed before the code
  }

  function getAdministrator() public view administratorOwnly returns(address) {
    return _administrator;
  }

  function getItemPriceWei(uint256 _itemId) public view returns(uint256) {
    require(_itemPricesWei[_itemId] > 0, "invalid itemId");
    return _itemPricesWei[_itemId];
  }

  function setItemPriceWei(uint256 _itemId, uint256 _value) public administratorOwnly {
    _itemPricesWei[_itemId] = _value;
  }

  function getWarehouseManagers() public view returns(address[] memory){
    return _warehouseManagerList;
  }

  // should consider getting warehouse manager by index instead of address
  function getWarehouseManager(address warehouseManager) public view returns(WarehouseManager memory){
    require(_warehouseManagerMapping[warehouseManager].exists, "warehouseManager does not exist");
    return _warehouseManagerMapping[warehouseManager];
  }

  function addWarehouseManager(address newWarehouseManager) public administratorOwnly {
    require(!_warehouseManagerMapping[newWarehouseManager].exists, "warehouseManager already exists");
    _warehouseManagerMapping[newWarehouseManager] = WarehouseManager(newWarehouseManager, true);
    _warehouseManagerList.push(newWarehouseManager);
    _openWarehouseOrderByManagerMapping[newWarehouseManager] = new uint256[](0);
  }

  // should consider removing warehouse manager by index instead of address to save gas on iterating array
  function removeWarehouseManager(address warehouseManager) public administratorOwnly {
    require(_warehouseManagerMapping[warehouseManager].exists, "warehouseManager does not exist");
    delete _warehouseManagerMapping[warehouseManager];
    uint warehouseManagerIndex;
    for (uint i=0; i<_warehouseManagerList.length; i++) {
      if (_warehouseManagerList[i] == warehouseManager) {
        warehouseManagerIndex = i;
      }
    }
    _warehouseManagerList[warehouseManagerIndex] = _warehouseManagerList[_warehouseManagerList.length - 1];
    _warehouseManagerList.pop();
    // should really add functionality to deal with existing open orders for a warehouse manager who no longer exists
  }

  function updateStock(address _account, uint256 _itemId, uint256 _newStockLevel) public warehouseManagerOrAdministratorOnly {
    require(tx.origin == _administrator || _account == tx.origin, "not permitted to update stock for other warehouse managers");
    uint256 currentStock = balanceOf(_account, _itemId);
    if (currentStock > _newStockLevel) {
      _burn(_account, _itemId, currentStock - _newStockLevel);
    } else if (currentStock < _newStockLevel) {
      _mint(_account, _itemId, _newStockLevel - currentStock, "");
    }
  }

  function placeOrder(uint256 _itemId, uint256 _quantity, address _warehouseManagerAddress) public payable {
    require(_warehouseManagerMapping[_warehouseManagerAddress].exists, "warehouseManager does not exist");
    require(balanceOf(_warehouseManagerAddress, _itemId) >= _quantity, "warehouseManager has insufficient stock");
    require((_itemPricesWei[_itemId] * _quantity) <= msg.value, "insufficient wei sent for order");
    Counters.increment(_warehouseOrderIdCounter);
    uint256 _warehouesOrderId = Counters.current(_warehouseOrderIdCounter);
    _openWarehouseOrderMapping[_warehouesOrderId] = OpenWarehouseOrder(
      _itemId,
      _warehouseManagerAddress,
      tx.origin,
      _warehouesOrderId,
      _quantity,
      msg.value,
      true
    );
    _openWarehouseOrderList.push(_warehouesOrderId);
    _openWarehouseOrderByManagerMapping[_warehouseManagerAddress].push(_warehouesOrderId);
    emit WarehouseOrder(
      ORDER_PLACED,
      _warehouseManagerAddress,
      tx.origin,
      _itemId,
      _warehouesOrderId,
      _quantity,
      msg.value,
      true,
      false,
      false
    );
  }

  function getWarehouseManagerOpenOrders(address warehouseManager) public warehouseManagerOrAdministratorOnly view returns(uint256[] memory){
    require(_warehouseManagerMapping[warehouseManager].exists, "warehouseManager does not exist");
    return _openWarehouseOrderByManagerMapping[warehouseManager];
  }

  function getOpenWarehouseOrders() public warehouseManagerOrAdministratorOnly view returns(uint256[] memory){
    return _openWarehouseOrderList;
  }

  function getOpenWarehouseOrder(uint256 _orderId) public warehouseManagerOrAdministratorOnly view returns(OpenWarehouseOrder memory){
    require(_openWarehouseOrderMapping[_orderId].exists, "warehouse order does not exist");
    return _openWarehouseOrderMapping[_orderId];
  }

  function rejectOpenOrder(uint256 _orderId) public warehouseManagerOrAdministratorOnly {
    // check warehouse order actually exists
    require(_openWarehouseOrderMapping[_orderId].exists, "warehouse order does not exist");
    // check caller is administrator or the warehouse manager for given order
    require(tx.origin == _administrator || _openWarehouseOrderMapping[_orderId].warehouseManagerAddress == tx.origin, "no permission to reject order");

    _completeOpenOrder(_orderId, false, false);
  }

  function shipOpenOrder(uint256 _orderId) public warehouseManagerOrAdministratorOnly {
    // check warehouse order actually exists
    require(_openWarehouseOrderMapping[_orderId].exists, "warehouse order does not exist");
    // check caller is administrator or the warehouse manager for given order
    require(tx.origin == _administrator || _openWarehouseOrderMapping[_orderId].warehouseManagerAddress == tx.origin, "no permission to ship order");
    // check warehouseManager has balance of item to ship
    require(balanceOf(_openWarehouseOrderMapping[_orderId].warehouseManagerAddress, _openWarehouseOrderMapping[_orderId].itemId) >= _openWarehouseOrderMapping[_orderId].quantity, "no stock to ship order");

    _completeOpenOrder(_orderId, true, true);
  }

  function _completeOpenOrder(uint256 _orderId, bool _shipped, bool _success) internal {
    // get order
    OpenWarehouseOrder memory _order = _openWarehouseOrderMapping[_orderId];
    
    // remove from _openWarehouseOrderMapping
    delete _openWarehouseOrderMapping[_orderId];

    // remove from _openWarehouseOrderList
    uint openWarehouseOrderIndex;
    for (uint i=0; i<_openWarehouseOrderList.length; i++) {
      if (_openWarehouseOrderList[i] == _orderId) {
        openWarehouseOrderIndex = i;
      }
    }
    _openWarehouseOrderList[openWarehouseOrderIndex] = _openWarehouseOrderList[_openWarehouseOrderList.length - 1];
    _openWarehouseOrderList.pop();

    // remove from _openWarehouseOrderByManagerMapping
    // not the prettiest code, but showcases how you "could" deal with removing items from arrays
    // note that this does not preserve the array order, would require a lot more gas to achieve that
    uint openWarehouseManagerOrderIndex;
    for (uint i=0; i<_openWarehouseOrderByManagerMapping[_order.warehouseManagerAddress].length; i++) {
      if (_openWarehouseOrderByManagerMapping[_order.warehouseManagerAddress][i] == _orderId) {
        openWarehouseManagerOrderIndex = i;
      }
    }
    _openWarehouseOrderByManagerMapping[_order.warehouseManagerAddress][openWarehouseManagerOrderIndex] = _openWarehouseOrderByManagerMapping[_order.warehouseManagerAddress][_openWarehouseOrderByManagerMapping[_order.warehouseManagerAddress].length - 1];
    _openWarehouseOrderByManagerMapping[_order.warehouseManagerAddress].pop();

    uint256 status;

    if (_success) {
      status = ORDER_SHIPPED;
      // update warehouse order stock level by sending tokens to customer
      safeTransferFrom(
        _order.warehouseManagerAddress,
        _order.customerAddress,
        _order.itemId,
        _order.quantity,
        "0x0"
      );
    } else {
      status = ORDER_REJECTED;
      // if unsuccessfull then if should transfer _order.weiValue back to _order.customerAddress
      (bool sent,) = _order.customerAddress.call{value: _order.weiValue}("");
      require(sent, "failed to refund wei");
    }

    // emit WarehouseOrder event
    emit WarehouseOrder(
      status,
      _order.warehouseManagerAddress,
      _order.customerAddress,
      _order.itemId,
      _orderId,
      _order.quantity,
      _order.weiValue,
      false, // no longer pending
      _shipped, // indicates shipped status
      _success // indicates shipped/rejected status
    );
  }
}
