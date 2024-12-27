import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";


const deployBets: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Bets", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });
};

export default deployBets;

deployBets.tags = ["Bets"];
