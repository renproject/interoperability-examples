pragma solidity ^0.5.8;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address _spender, uint256 _value) external returns (bool);
}

interface IShifter {
    function shiftIn(bytes32 _pHash, uint256 _amount, bytes32 _nHash, bytes calldata _sig) external returns (uint256);
    function shiftOut(bytes calldata _to, uint256 _amount) external returns (uint256);
}

interface IShifterRegistry {
    function getShifterBySymbol(string calldata _tokenSymbol) external view returns (IShifter);
    function getShifterByToken(address  _tokenAddress) external view returns (IShifter);
    function getTokenBySymbol(string calldata _tokenSymbol) external view returns (IERC20);
}

interface IUniswapExchange {
    function ethToTokenSwapInput(
        uint256 min_tokens,
        uint256 deadline
    )
        external
        payable
        returns (uint256  tokens_bought);

    function tokenToEthSwapInput(
        uint256 tokens_sold,
        uint256 min_eth,
        uint256 deadline
    )
        external
        returns (uint256  eth_bought);

    function tokenToTokenSwapInput(
        uint256 tokens_sold,
        uint256 min_tokens_bought,
        uint256 min_eth_bought,
        uint256 deadline,
        address token_addr
    )
        external
        returns (uint256  tokens_bought);

    function getEthToTokenInputPrice(
        uint256 eth_sold
    )
        external
        view
        returns (uint256 tokens_bought);

    function getTokenToEthInputPrice(
        uint256 tokens_sold
    )
        external
        view
        returns (uint256 eth_bought);

    function getTokenToTokenInputPrice(
        uint256 tokens_sold
    )
        external
        view
        returns (uint256 eth_bought);

    function tokenAddress() external view returns (address);
}


contract UniswapExchangeAdapter {

    address token;

    IUniswapExchange public exchange;
    IShifterRegistry public registry;


    constructor(IUniswapExchange _exchange, IShifterRegistry _registry) public {
        exchange = _exchange;
        registry = _registry;
        token = exchange.tokenAddress();
    }

    function () external payable {
        // require(msg.sender == address(exchange), "only allow exchange to transfer eth into this contract");
    }

    function deposit(uint256 _amount) external {
        IERC20(token).transferFrom(address(msg.sender), address(this), _amount);
    }

    function shiftIn(
        bytes calldata _msg,
        uint256 _amount,
        bytes32 _nHash,
        bytes calldata _sig
    ) external {
        bytes32 pHash = keccak256(abi.encode(_msg));
        registry.getShifterByToken(token).shiftIn(pHash, _amount, _nHash, _sig);
    }

    function swap(
        uint256 _amount,
        address payable _to
    ) external payable
        returns (uint256 ethBought)
    {
        // Approve and trade the shifted tokens with the uniswap exchange.
        require(IERC20(token).approve(address(exchange), _amount));
        ethBought = exchange.tokenToEthSwapInput(_amount, uint256(1), uint256(block.timestamp * 2));

        // Send proceeds to the User
        _to.transfer(ethBought);
    }

}
