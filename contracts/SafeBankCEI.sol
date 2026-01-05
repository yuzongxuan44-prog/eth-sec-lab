// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SafeBankCEI {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // ✅ CEI：先 Effects（扣余额），再 Interactions（转账）
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Effects
        balances[msg.sender] -= amount;

        // Interactions
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function getBankBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
