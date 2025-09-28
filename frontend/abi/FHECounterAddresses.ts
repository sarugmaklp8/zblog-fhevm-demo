/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const FHECounterAddresses: { [chainId: number]: string } = { 
  11155111: "0xb430aA98707cE449f014f1F029279aB56D934774", // Sepolia
  31337: "0x4d5398Df1DdC5214353907c0ee9760997D1e30E0", // Hardhat
};

/**
 * Get FHECounter contract address for a specific chain
 * @param chainId The chain ID
 * @returns The contract address or undefined if not deployed on that chain
 */
export function getFHECounterAddress(chainId: number): string | undefined {
  return FHECounterAddresses[chainId];
}

/**
 * Check if FHECounter is deployed on a specific chain
 * @param chainId The chain ID
 * @returns True if deployed, false otherwise
 */
export function isFHECounterDeployed(chainId: number): boolean {
  const address = FHECounterAddresses[chainId];
  return address !== undefined && address !== "0x0000000000000000000000000000000000000000";
}
