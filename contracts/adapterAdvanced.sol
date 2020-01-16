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
    address owner;

    IUniswapExchange public exchange;
    IShifterRegistry public registry;

    mapping(bytes32=>bool) public shiftInStatuses;

    constructor(IUniswapExchange _exchange, IShifterRegistry _registry, address _owner) public {
        exchange = _exchange;
        registry = _registry;
        token = exchange.tokenAddress();
        owner = _owner;
    }

    function () external payable {
        require(msg.sender == address(exchange), "only allow exchange to transfer eth into this contract");
    }

    function deposit(uint256 _amount) external {
        IERC20(token).transferFrom(address(msg.sender), address(this), _amount);
    }

    function withdraw(uint256 _amount) external {
        // Only owner can withdraw
        require(msg.sender == owner);
        IERC20(token).transfer(owner,  _amount);
    }

    function shiftIn(
        address payable _swapReciever,
        bytes calldata _msg,
        uint256 _amount,
        bytes32 _nHash,
        bytes calldata _sig
    ) external {
        // Anyone can call this method
        bytes32 pHash = keccak256(abi.encode(_swapReciever, _msg));
        bytes32 signedMessageHash = getSignedMessageHash(pHash, _amount, _nHash);
        uint256 shiftedTokens = registry.getShifterByToken(token).shiftIn(pHash, _amount, _nHash, _sig);

        // Require a valid shift in
        require(shiftedTokens > 0);

        // If swap for shift in hasn't been made yet, allow user to swap
        if (shiftInStatuses[signedMessageHash] == false) {
            require(IERC20(token).approve(address(exchange), _amount));
            uint256 ethBought = exchange.tokenToEthSwapInput(_amount, uint256(1), uint256(block.timestamp * 2));
            _swapReciever.transfer(ethBought);
            shiftInStatuses[signedMessageHash] = true;
        }
    }

    function swap(
        uint256 _amount,
        address payable _swapReciever,
        bytes calldata _msg,
        bytes32 _nHash
    ) external payable
        returns (uint256 ethBought)
    {
        // Only owner can swap
        require(msg.sender == owner);

        // Approve and trade the shifted tokens with the uniswap exchange.
        require(IERC20(token).approve(address(exchange), _amount));
        ethBought = exchange.tokenToEthSwapInput(_amount, uint256(1), uint256(block.timestamp * 2));

        // Send proceeds to the User
        _swapReciever.transfer(ethBought);

        // Update shift in shift in status
        bytes32 pHash = keccak256(abi.encode(_swapReciever, _msg));
        bytes32 signedMessageHash = getSignedMessageHash(pHash, _amount, _nHash);
        shiftInStatuses[signedMessageHash] = true;
    }

    function getSignedMessageHash(bytes32 _pHash, uint256 _amount, bytes32 _nHash) public view returns (bytes32) {
        return keccak256(abi.encode(_pHash, _amount, token, address(this), _nHash));
    }

}
