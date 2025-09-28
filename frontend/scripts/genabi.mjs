import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACTS = ["FHECounter", "ZBlog"];

// <root>/packages/fhevm-hardhat-template
const rel = "../fhevm-hardhat-template";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");
// if (!fs.existsSync(deploymentsDir)) {
//   console.error(
//     `${line}Unable to locate 'deployments' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
//   );
//   process.exit(1);
// }

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Process each contract
for (const CONTRACT_NAME of CONTRACTS) {
  console.log(`\n🔄 Processing ${CONTRACT_NAME}...`);
  
  // Auto deployed on Linux/Mac (will fail on windows)
  const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false /* optional */);

  // Sepolia is optional
  let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);
  if (!deploySepolia) {
    deploySepolia= { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
  }

  if (deployLocalhost && deploySepolia) {
    if (
      JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
    ) {
      console.error(
        `${line}Deployments on localhost and Sepolia differ for ${CONTRACT_NAME}. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
      );
      process.exit(1);
    }
  }

  const tsCode = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify(deployLocalhost.abi, null, 2)} as const;
`;

  const tsAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses: { [chainId: number]: string } = { 
  11155111: "${deploySepolia.address}", // Sepolia
  31337: "${deployLocalhost.address}", // Hardhat
};

/**
 * Get ${CONTRACT_NAME} contract address for a specific chain
 * @param chainId The chain ID
 * @returns The contract address or undefined if not deployed on that chain
 */
export function get${CONTRACT_NAME}Address(chainId: number): string | undefined {
  return ${CONTRACT_NAME}Addresses[chainId];
}

/**
 * Check if ${CONTRACT_NAME} is deployed on a specific chain
 * @param chainId The chain ID
 * @returns True if deployed, false otherwise
 */
export function is${CONTRACT_NAME}Deployed(chainId: number): boolean {
  const address = ${CONTRACT_NAME}Addresses[chainId];
  return address !== undefined && address !== "0x0000000000000000000000000000000000000000";
}
`;

  console.log(`✅ Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  console.log(`✅ Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
}

console.log(`\n🎉 Successfully generated ABI and addresses for ${CONTRACTS.length} contracts!`);
