const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("5.3 Access Control Fix Regression", function () {
  it("VULN: attacker can take over owner and withdraw all", async function () {
    const [deployer, attacker] = await ethers.getSigners();

    const Vuln = await ethers.getContractFactory("AccessControlVuln", deployer);
    const vault = await Vuln.deploy();
    await vault.waitForDeployment();

    // 注资 5 ETH
    await deployer.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("5"),
    });

    console.log("\n[VULN]");
    console.log("Vault ETH before:", ethers.formatEther(await ethers.provider.getBalance(await vault.getAddress())));
    console.log("Owner before:", await vault.owner());

    // 越权接管 owner
    await vault.connect(attacker).setOwner(attacker.address);
    console.log("Owner after:", await vault.owner());

    // 提现
    await vault.connect(attacker).withdrawAll();

    console.log("Vault ETH after:", ethers.formatEther(await ethers.provider.getBalance(await vault.getAddress())));
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(0n);
  });

  it("FIXED: attacker should NOT be able to take over owner or withdraw", async function () {
    const [deployer, attacker] = await ethers.getSigners();

    const Fixed = await ethers.getContractFactory("AccessControlFixed", deployer);
    const vault = await Fixed.deploy();
    await vault.waitForDeployment();

    // 注资 5 ETH
    await deployer.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("5"),
    });

    console.log("\n[FIXED]");
    console.log("Vault ETH before:", ethers.formatEther(await ethers.provider.getBalance(await vault.getAddress())));
    console.log("Owner before:", await vault.owner());

    // 修复后：setOwner 必须 revert
    await expect(
      vault.connect(attacker).setOwner(attacker.address)
    ).to.be.revertedWith("not owner");

    // owner 不应改变
    expect(await vault.owner()).to.equal(deployer.address);

    // 修复后：withdrawAll 也必须 revert
    await expect(
      vault.connect(attacker).withdrawAll()
    ).to.be.revertedWith("not owner");

    // 余额不应变化
    console.log("Vault ETH after:", ethers.formatEther(await ethers.provider.getBalance(await vault.getAddress())));
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("5"));
  });
});
