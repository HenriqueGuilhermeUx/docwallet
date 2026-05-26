import { ethers } from "hardhat";

async function main() {
  console.log("Deploying NotarizeX to Polygon...");

  // Obter contrato
  const NotarizeX = await ethers.getContractFactory("NotarizeX");

  // Deploy
  const notarizeX = await NotarizeX.deploy();

  // Aguardar deploy
  await notarizeX.deployed();

  console.log("NotarizeX deployed to:", notarizeX.address);

  // Verificar se esta em rede testnet ou mainnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 137) {
    console.log("Deployed on Polygon Mainnet!");
  } else if (network.chainId === 80001) {
    console.log("Deployed on Mumbai Testnet!");
  } else {
    console.log("Deployed on local network (chainId:", network.chainId, ")");
  }

  // Salvar endereco
  const fs = require("fs");
  const envContent = `\n# Contrato NotarizeX (deployed on ${new Date().toISOString()})\nNOTARIZE_CONTRACT_ADDRESS=${notarizeX.address}\n`;
  fs.appendFileSync(".env", envContent);

  console.log("Contract address saved to .env");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
