// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // ✅ 漏洞：先转账，后更新余额（可重入）
    // ✅ 关键修复：用 bal 写回，避免重入多层返回时 -= 下溢回滚
    function withdraw(uint256 amount) external {
        uint256 bal = balances[msg.sender];
        require(bal >= amount, "Insufficient balance");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // 用进入函数时的 bal 写回（仍然是漏洞写法）
        balances[msg.sender] = bal - amount;

        emit Withdrawn(msg.sender, amount);
    }

    function getBankBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    receive() external payable {}
}

