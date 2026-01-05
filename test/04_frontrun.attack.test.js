const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("4.3 Front-running Attack (simplified demo)", function () {
  it("attacker front-runs victim by paying higher fee, victim tx reverts", async function () {
    const [victim, attacker] = await ethers.getSigners();

    const F = await ethers.getContractFactory("FirstComeMint");
    const c = await F.deploy();
    await c.waitForDeployment();

    // 关掉 automine：交易先进入 pending，最后统一挖块
    await network.provider.send("evm_setAutomine", [false]);
    await network.provider.send("evm_setIntervalMining", [0]);

    // 费用设置：victim 低费，attacker 高费（EIP-1559）
    const low = 2_000_000_000n;   // 2 gwei
    const high = 50_000_000_000n; // 50 gwei

    // 受害者交易先发出（进入 pending，但不立刻挖块）
    const txVictim = await c.connect(victim).mint({
      maxFeePerGas: low,
      maxPriorityFeePerGas: low,
    });

    // 攻击者“监听到意图”后，发出更高费交易抢跑
    const txAttacker = await c.connect(attacker).mint({
      maxFeePerGas: high,
      maxPriorityFeePerGas: high,
    });

    // 手动挖一个块，把 pending tx 一次性打包
    await network.provider.send("evm_mine");

    // 取回执并比较交易在区块内排序（index 越小越先执行）
    const rcV = await ethers.provider.getTransactionReceipt(txVictim.hash);
    const rcA = await ethers.provider.getTransactionReceipt(txAttacker.hash);

    const idxV = rcV.index ?? rcV.transactionIndex;
    const idxA = rcA.index ?? rcA.transactionIndex;

    console.log("Victim tx index:", idxV, "status:", rcV.status);
    console.log("Attacker tx index:", idxA, "status:", rcA.status);

    // attacker 必须排在 victim 前面
    expect(idxA).to.be.lessThan(idxV);

    // attacker 成功，victim 失败（sold out）
    expect(rcA.status).to.equal(1);
    expect(rcV.status).to.equal(0);

    // 只铸造 1 次
    expect(await c.minted()).to.equal(1n);

    // 恢复 automine（避免影响后续测试）
    await network.provider.send("evm_setAutomine", [true]);
  });
});
