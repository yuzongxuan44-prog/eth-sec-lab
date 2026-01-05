import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const GANACHE_URL = process.env.GANACHE_URL || "http://127.0.0.1:7545";
const GANACHE_CHAIN_ID = Number(process.env.GANACHE_CHAIN_ID || "1337");
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xd9bce95d797de4ca1ca248171ccf43ee1a452dbe5f98a5724eca47c1a3e1ac07"; // Ganache Ä³¸öÕËºÅË½Ô¿£¨0x¿ªÍ·£©

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        ganache: {
            url: GANACHE_URL,
            chainId: GANACHE_CHAIN_ID,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
        },
    },
};

export default config;
