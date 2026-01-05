// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SafeBankGuard {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // ✅ 最小重入锁
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "ReentrancyGuard: reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // ✅ 有锁：重入时第二次进入会直接 revert
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // 注意：这里就算先转账再扣余额，锁也能挡住重入
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function getBankBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
