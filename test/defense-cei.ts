import { ethers } from "hardhat";
import { expect } from "chai";

describe("Defense lab - CEI", function () {
  it("should NOT be drained (CEI defense)", async function () {
    const [deployer] = await ethers.getSigners();

    const Bank = await ethers.getContractFactory("SafeBankCEI", deployer);
    const bank = await Bank.deploy();
    await bank.waitForDeployment();
    const bankAddr = await bank.getAddress();

    // 给银行充 5 ETH
    await (await bank.deposit({ value: ethers.parseEther("5") })).wait();

    // 仍然使用同一个攻击合约（接口兼容 deposit/withdraw）
    const Attacker = await ethers.getContractFactory("ReentrancyAttacker", deployer);
    const attacker = await Attacker.deploy(bankAddr);
    await attacker.waitForDeployment();
    const attackerAddr = await attacker.getAddress();

    const bankBefore = await ethers.provider.getBalance(bankAddr);
    console.log("Bank ETH before:", ethers.formatEther(bankBefore));

    // 预期：攻击会 revert，或者无法抽干
    await expect(
      attacker.attack(10, { value: ethers.parseEther("1"), gasLimit: 8_000_000 })
    ).to.be.reverted;

    const bankAfter = await ethers.provider.getBalance(bankAddr);
    const attackerAfter = await ethers.provider.getBalance(attackerAddr);

    console.log("Bank ETH after:", ethers.formatEther(bankAfter));
    console.log("Attacker contract ETH after:", ethers.formatEther(attackerAfter));

    // 银行不应被抽干
    expect(bankAfter).to.be.greaterThan(ethers.parseEther("0"));
  });
});
