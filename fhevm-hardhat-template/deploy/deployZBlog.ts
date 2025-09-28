import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployZBlog: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying ZBlog contract...");

  const zBlog = await deploy("ZBlog", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });

  console.log(`ZBlog deployed to: ${zBlog.address}`);

  // Verify the contract on Etherscan if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    
    try {
      await hre.run("verify:verify", {
        address: zBlog.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }
};

deployZBlog.tags = ["ZBlog"];
deployZBlog.dependencies = [];

export default deployZBlog;
