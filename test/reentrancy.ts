import { ethers } from "hardhat";
import { expect } from "chai";

describe("Reentrancy lab", function () {
    it("should drain bank via reentrancy", async function () {
        const [deployer] = await ethers.getSigners();

        // 部署银行
        const Bank = await ethers.getContractFactory("VulnerableBank", deployer);
        const bank = await Bank.deploy();
        await bank.waitForDeployment();
        const bankAddr = await bank.getAddress();

        // ✅ 给“合约”充钱（合约余额，和 Ganache 账户 100 ETH 是两回事）
        await (await bank.deposit({ value: ethers.parseEther("5") })).wait();

        // 部署攻击合约
        const Attacker = await ethers.getContractFactory("ReentrancyAttacker", deployer);
        const attacker = await Attacker.deploy(bankAddr);
        await attacker.waitForDeployment();
        const attackerAddr = await attacker.getAddress();

        const bankBefore = await ethers.provider.getBalance(bankAddr);
        const attackerBefore = await ethers.provider.getBalance(attackerAddr);

        console.log("Bank ETH before:", ethers.formatEther(bankBefore));
        console.log("Attacker contract ETH before:", ethers.formatEther(attackerBefore));

        // 攻击：每轮提 1 ETH，最多重入 10 次（银行余额不足会自动停）
        await (
            await attacker.attack(10, {
                value: ethers.parseEther("1"),
                gasLimit: 8_000_000,
            })
        ).wait();

        const bankAfter = await ethers.provider.getBalance(bankAddr);
        const attackerAfter = await ethers.provider.getBalance(attackerAddr);

        console.log("Bank ETH after:", ethers.formatEther(bankAfter));
        console.log("Attacker contract ETH after:", ethers.formatEther(attackerAfter));

        expect(bankAfter).to.be.lessThan(bankBefore);
        expect(attackerAfter).to.be.greaterThan(attackerBefore);
    });
});
