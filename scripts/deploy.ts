import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 部署银行合约
    const Bank = await ethers.getContractFactory("VulnerableBank");
    const bank = await Bank.deploy();
    await bank.waitForDeployment();  // 等待部署确认

    const bankAddress = await bank.getAddress();  // 正确获取地址
    console.log("Bank contract deployed to:", bankAddress);

    // 部署攻击合约
    const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
    const attacker = await Attacker.deploy(bankAddress);  // 传入正确的银行合约地址
    await attacker.waitForDeployment();

    const attackerAddress = await attacker.getAddress();
    console.log("ReentrancyAttacker contract deployed to:", attackerAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });