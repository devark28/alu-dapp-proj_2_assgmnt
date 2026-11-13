import deployments from "./contracts/deployments.json";

const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  localhost: {
    chainId: 31337,
    name: "Hardhat Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: null,
  },
};

// Wallets shown on the dashboard next to the contract owner. The localhost
// ones are Hardhat's default test accounts 1 to 3.
const EXAMPLE_HOLDERS = {
  sepolia: [
    { label: "ALU Faculty Council", address: "0x3eDC18BD6cc54dd98346347f4038097E6aF13c4A" },
    { label: "ALU Student Guild", address: "0xEe194c76Af5B89c597eB546C1CA4F71B347e06aB" },
  ],
  localhost: [
    { label: "ALU Faculty Council", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
    { label: "ALU Student Guild", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    { label: "ALU Alumni Fund", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  ],
};

const networkKey = import.meta.env.VITE_NETWORK || "sepolia";

export const network = NETWORKS[networkKey];
export const deployment = deployments[networkKey];
export const exampleHolders = EXAMPLE_HOLDERS[networkKey];
export const logoTokenId = BigInt(deployment.logoTokenId);
