pragma solidity >=0.5.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address _spender, uint256 _value) external returns (bool);
}

contract IShifter {
    mapping (bytes32 => bool) public status;
    function shiftIn(bytes32 _pHash, uint256 _amount, bytes32 _nHash, bytes calldata _sig) external returns (uint256);
    function shiftOut(bytes calldata _to, uint256 _amount) external returns (uint256);
    function getStatus(bytes32 _value) public view returns(bool) {
        return status[_value];
    }
}

interface IShifterRegistry {
    function getShifterBySymbol(string calldata _tokenSymbol) external view returns (IShifter);
    function getTokenBySymbol(string calldata _tokenSymbol) external view returns (IERC20);
}

interface UniswapExchange {
    function tokenToEthTransferOutput(uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) external returns (uint256  eth_bought);
    function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline) external returns (uint256  eth_bought);
    function tokenToTokenSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address token_addr) external returns (uint256  tokens_bought);
    function getEthToTokenInputPrice(uint256 eth_sold) external view returns (uint256 tokens_bought);
    function getTokenToEthInputPrice(uint256 tokens_sold) external view returns (uint256 eth_bought);
}

contract Adapter {
    address public owner;

    IShifterRegistry public registry;
    IShifter public zbtcShifter;
    IERC20 public zbtcToken;
    UniswapExchange public zbtcExchange;

    constructor(address _owner, IShifter _zbtcShifter, IERC20 _zbtcToken, UniswapExchange _zbtcExchange) public {
        owner = _owner;
        zbtcShifter = _zbtcShifter;
        zbtcToken = _zbtcToken;
        zbtcExchange = _zbtcExchange;
    }

    function shiftIn(
        bytes calldata _msg,
        uint256 _amount,
        bytes32 _nHash,
        bytes calldata _sig
    ) external {
        bytes32 pHash = keccak256(abi.encode(_msg));
        zbtcShifter.shiftIn(pHash, _amount, _nHash, _sig);
    }

    // Swap at the current market price then immediately send to user
    function swap(uint256 _amount, address payable _to) payable external {
        require(msg.sender == owner);

        // Get ETH price from Uniswap
        uint256 ethProceeds = zbtcExchange.getTokenToEthInputPrice(_amount);

        _to.transfer(ethProceeds);
    }


    // Allow owner to withdraw funds if needed
    function withdrawZBTC(address _to, uint256 _amount) external {
        require(msg.sender == owner);
        zbtcToken.transfer(_to, _amount);
    }

    function withdrawETH(address payable _to, uint256 _amount) external payable {
        require(msg.sender == owner);
        _to.transfer(_amount);
    }

    function verifyShiftInSignature(bytes32 _pHash, uint256 _amount, bytes32 _nHash) public view returns (bool) {
        bytes32 signedMessageHash = hashForSignature(_pHash, _amount, address(this), _nHash);
        return zbtcShifter.getStatus(signedMessageHash);
    }

    function hashForSignature(bytes32 _pHash, uint256 _amount, address _to, bytes32 _nHash) public view returns (bytes32) {
        return keccak256(abi.encode(_pHash, _amount, address(zbtcToken), _to, _nHash));
    }

    function() external payable {
    }
}
