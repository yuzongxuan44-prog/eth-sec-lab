const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("4.4 51% Attack Simulation (reorg / double-spend demo)", function () {
  it("payment looks confirmed on honest chain, then disappears after simulated reorg", async function () {
    const [deployer, attacker, merchant, attacker2] = await ethers.getSigners();

    const PAY = ethers.parseEther("10");      // 支付金额（可改）
    const CONFIRM = 3;                        // “确认数”（可改）
    const EXTRA = 2;                          // 私链比诚实链多挖几个块（保证更长）

    // 记录初始余额
    const m0 = await ethers.provider.getBalance(merchant.address);
    const a20 = await ethers.provider.getBalance(attacker2.address);

    console.log("\n[Setup]");
    console.log("Merchant ETH before:", ethers.formatEther(m0));
    console.log("Attacker2 ETH before:", ethers.formatEther(a20));

    // ---------- 分叉点快照（模拟攻击者从这里开始私链） ----------
    const snap = await network.provider.send("evm_snapshot");
    const h0 = await ethers.provider.getBlockNumber();
    console.log("\n[Snapshot]");
    console.log("Snapshot id:", snap);
    console.log("Fork point block:", h0);

    // ---------- 诚实链：支付给商户 + 确认 ----------
    console.log("\n[Honest chain]");
    const txPay = await attacker.sendTransaction({
      to: merchant.address,
      value: PAY,
    });
    const rcPay = await txPay.wait();

    // 挖确认块
    for (let i = 0; i < CONFIRM; i++) {
      await network.provider.send("evm_mine");
    }
    const h1 = await ethers.provider.getBlockNumber();

    const m1 = await ethers.provider.getBalance(merchant.address);
    console.log("Pay tx hash:", rcPay.hash);
    console.log("Pay tx mined in block:", rcPay.blockNumber);
    console.log("After confirmations, block:", h1);
    console.log("Merchant ETH after payment:", ethers.formatEther(m1));

    // 商户确实收到钱（差值≈PAY）
    expect(m1 - m0).to.equal(PAY);

    // ---------- 模拟 51%：回滚到分叉点（等价：私链更长导致重组） ----------
    console.log("\n[Reorg simulation]");
    const ok = await network.provider.send("evm_revert", [snap]);
    expect(ok).to.equal(true);

    const h2 = await ethers.provider.getBlockNumber();
    const m2 = await ethers.provider.getBalance(merchant.address);
    console.log("After revert, block:", h2);
    console.log("Merchant ETH after revert:", ethers.formatEther(m2));

    // 回滚后，商户余额应回到初始（支付“消失”）
    expect(m2).to.equal(m0);

    // ---------- 攻击者私链：双花，把同样金额转给同伙 attacker2 ----------
    console.log("\n[Attacker private chain]");
    const txDoubleSpend = await attacker.sendTransaction({
      to: attacker2.address,
      value: PAY,
    });
    const rcDs = await txDoubleSpend.wait();

    // 私链挖更长（CONFIRM + EXTRA）
    for (let i = 0; i < CONFIRM + EXTRA; i++) {
      await network.provider.send("evm_mine");
    }
    const h3 = await ethers.provider.getBlockNumber();

    const m3 = await ethers.provider.getBalance(merchant.address);
    const a23 = await ethers.provider.getBalance(attacker2.address);

    console.log("Double-spend tx hash:", rcDs.hash);
    console.log("Private chain block:", h3);
    console.log("Merchant ETH final:", ethers.formatEther(m3));
    console.log("Attacker2 ETH final:", ethers.formatEther(a23));

    // 最终：商户没收到钱；同伙收到钱（双花成功效果）
    expect(m3).to.equal(m0);
    expect(a23 - a20).to.equal(PAY);
  });
});
