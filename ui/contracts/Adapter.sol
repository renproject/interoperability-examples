pragma solidity >=0.5.0;

import "github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/GSN/GSNRecipient.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address _from, address _to, uint256 amount) external returns (bool);
    function approve(address _spender, uint256 _value) external returns (bool);
}

interface IShifter {
    function shiftIn(bytes32 _pHash, uint256 _amount, bytes32 _nHash, bytes calldata _sig) external returns (uint256);
    function shiftOut(bytes calldata _to, uint256 _amount) external returns (uint256);
}

interface IShifterRegistry {
    function getShifterBySymbol(string calldata _tokenSymbol) external view returns (IShifter);
    function getTokenBySymbol(string calldata _tokenSymbol) external view returns (IERC20);
}

interface UniswapExchange {
    function tokenToEthTransferOutput(uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) external returns (uint256  eth_bought);
    function getEthToTokenInputPrice(uint256 eth_sold) external view returns (uint256 tokens_bought);
}

contract Adapter is GSNRecipient {
    address public owner;

    IShifterRegistry public registry;
    IShifter public zbtcShifter;
    IERC20 public zbtcToken;
    UniswapExchange public zbtcExchange;
    mapping(address=>uint256) public btcGasBalances;

    constructor(address _owner, IShifterRegistry _registry, UniswapExchange _zbtcExchange) public {
        owner = _owner;
        registry = _registry;

        zbtcShifter = _registry.getShifterBySymbol("zBTC");
        zbtcToken = _registry.getTokenBySymbol("zBTC");
        zbtcExchange = _zbtcExchange;

        // Allow Uniswap to update balances
        zbtcToken.approve(address(_zbtcExchange), uint256(-1));
    }



    function acceptRelayedCall(
        address relay,
        address from,
        bytes calldata encodedFunction,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        bytes calldata approvalData,
        uint256 maxPossibleCharge
    ) external view returns (uint256, bytes memory) {
        // bytes4 funcId = encodedFunction[10];
        // bytes4 shiftInFuncId = bytes4(keccak256("shiftIn()"));
        // if (funcId == shiftInFuncId) {
        //     return (1, "");
        // } else {
        //     return (0, "");
        // }

        return (1, "");
    }

    function shiftIn(
        // Parameters from users
        uint _nonce,
        address _sender,
        bytes calldata _msg,
        // Parameters from Darknodes
        uint256        _amount,
        bytes32        _nHash,
        bytes calldata _sig
    ) external {
        // Calculate fee from an on-chain oracle (uniswap)
        uint256 gasCostInBtc = getBtcEthPrice();

        // Shift in
        bytes32 pHash = keccak256(abi.encode(_nonce, _sender, _msg));
        uint256 shiftedInAmount = registry.getShifterBySymbol("zBTC").shiftIn(pHash, _amount, _nHash, _sig);

        // Send the user their funds minus the fee
        zbtcToken.transfer(_sender, shiftedInAmount-gasCostInBtc);
    }

    function shiftInWithGasBalance(
        // Parameters from users
        uint _nonce,
        address _sender,
        bytes calldata _msg,
        // Parameters from Darknodes
        uint256        _amount,
        bytes32        _nHash,
        bytes calldata _sig
    ) external {
        // Calculate fee from an on-chain oracle (uniswap)
        uint256 gasCostInBtc = getBtcEthPrice();

        // Shift in
        bytes32 pHash = keccak256(abi.encode(_nonce, _sender, _msg));
        uint256 shiftedInAmount = registry.getShifterBySymbol("zBTC").shiftIn(pHash, _amount, _nHash, _sig);
        uint256 gasAllocation = (shiftedInAmount / 10) - gasCostInBtc;

        increaseGasBalance(_sender, gasAllocation);

        // Send the user their funds minus their remaining gas balance
        zbtcToken.transfer(_sender, shiftedInAmount-gasAllocation);
    }

    // Deposit funds to pool
    function startStackingSats (uint256 _amount) public {
        // Calculate fee from an on-chain oracle (uniswap)
        uint256 gasCostInBtc = getBtcEthPrice();
        address _sender = _msgSender();
        require(btcGasBalances[_sender] > gasCostInBtc);


        // Deposit to lending pool
    }

    // Withdraw funds to pool
    function stopStackingSats (uint256 _amount) public {
        // Calculate fee from an on-chain oracle (uniswap)
        uint256 gasCostInBtc = getBtcEthPrice();
        address _sender = _msgSender();
        require(btcGasBalances[_sender] > gasCostInBtc);
        decreaseGasBalance(_sender, gasCostInBtc);

        // Withdraw from lending pool
    }

    // Add to gas balance
    function addGas (uint256 _amount) public {
        // Calculate fee from an on-chain oracle (uniswap)
        uint256 gasCostInBtc = getBtcEthPrice();
        address _sender = _msgSender();
        require(btcGasBalances[_sender] > gasCostInBtc);


        zbtcToken.transferFrom(_sender, address(this), _amount);
        increaseGasBalance(_sender, _amount-gasCostInBtc);
    }

    // Remove to gas balance
    function removeGas (uint256 _amount) public {
        // Calculate fee from an on-chain oracle (uniswap)
        uint256 gasCostInBtc = getBtcEthPrice();
        address _sender = _msgSender();
        require(btcGasBalances[_sender] > gasCostInBtc && btcGasBalances[_sender] >= _amount);

        zbtcToken.transfer(_sender, _amount-gasCostInBtc);
        decreaseGasBalance(_sender, _amount);
    }

    function getBtcEthPrice() public returns (uint256) {
        return zbtcExchange.getEthToTokenInputPrice(uint256(gasleft() * tx.gasprice));
    }

    // Utils
    function increaseGasBalance(address _user, uint256 _amount) private {
        btcGasBalances[_user] = add(btcGasBalances[_user], _amount);
    }

    function decreaseGasBalance(address _user, uint256 _amount) private {
        btcGasBalances[_user] = sub(btcGasBalances[_user], _amount);
    }

    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }

    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }


}
