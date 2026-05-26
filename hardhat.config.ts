import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Carregar .env
dotenv.config();

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || process.env.VITE_ALCHEMY_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settingss: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    polygon: {
      url: POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
      accounts: [PRIVATE_KEY],
      chainId: 137
    },
    polygonMumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY",
      accounts: [PRIVATE_KEY],
      chainId: 80001
    },
    hardhat: {
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: {
      polygon: ETHERSCAN_API_KEY,
      polygonMumbai: ETHERSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
