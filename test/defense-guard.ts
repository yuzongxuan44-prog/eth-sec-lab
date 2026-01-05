import { ethers } from "hardhat";
import { expect } from "chai";

describe("Defense lab - ReentrancyGuard", function () {
  it("should NOT be drained (reentrancy lock)", async function () {
    const [deployer] = await ethers.getSigners();

    const Bank = await ethers.getContractFactory("SafeBankGuard", deployer);
    const bank = await Bank.deploy();
    await bank.waitForDeployment();
    const bankAddr = await bank.getAddress();

    await (await bank.deposit({ value: ethers.parseEther("5") })).wait();

    const Attacker = await ethers.getContractFactory("ReentrancyAttacker", deployer);
    const attacker = await Attacker.deploy(bankAddr);
    await attacker.waitForDeployment();
    const attackerAddr = await attacker.getAddress();

    const bankBefore = await ethers.provider.getBalance(bankAddr);
    console.log("Bank ETH before:", ethers.formatEther(bankBefore));

    // ✅ 不要写死 revert reason，因为外层可能用 "Transfer failed" 覆盖
    await expect(
      attacker.attack(10, { value: ethers.parseEther("1"), gasLimit: 8_000_000 })
    ).to.be.reverted;

    const bankAfter = await ethers.provider.getBalance(bankAddr);
    const attackerAfter = await ethers.provider.getBalance(attackerAddr);

    console.log("Bank ETH after:", ethers.formatEther(bankAfter));
    console.log("Attacker contract ETH after:", ethers.formatEther(attackerAfter));

    // ✅ 核心断言：银行没有被抽干
    expect(bankAfter).to.equal(bankBefore);

    // （可选）攻击合约也不应拿到钱
    expect(attackerAfter).to.equal(ethers.parseEther("0"));
  });
});
