import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const maxPlayers = Number(process.env.MAX_PLAYERS || 16);
  const BattleRoyale = await ethers.getContractFactory("BattleRoyale");
  const contract = await BattleRoyale.deploy(maxPlayers);
  await contract.waitForDeployment();

  console.log(`BattleRoyale deployed to: ${await contract.getAddress()}`);
  console.log(`Max players: ${maxPlayers}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
