/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ZBlogAddresses: { [chainId: number]: string } = { 
  11155111: "0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B", // Sepolia
  31337: "0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B", // Hardhat
};

/**
 * Get ZBlog contract address for a specific chain
 * @param chainId The chain ID
 * @returns The contract address or undefined if not deployed on that chain
 */
export function getZBlogAddress(chainId: number): string | undefined {
  return ZBlogAddresses[chainId];
}

/**
 * Check if ZBlog is deployed on a specific chain
 * @param chainId The chain ID
 * @returns True if deployed, false otherwise
 */
export function isZBlogDeployed(chainId: number): boolean {
  const address = ZBlogAddresses[chainId];
  return address !== undefined && address !== "0x0000000000000000000000000000000000000000";
}
