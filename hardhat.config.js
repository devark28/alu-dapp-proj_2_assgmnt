require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");

// Sepolia settings are read from Hardhat's configuration variables, which are
// stored outside this project (npx hardhat vars set NAME), so the RPC URL and
// the private key never end up in the repository.
const networks = {};
if (vars.has("SEPOLIA_RPC_URL") && vars.has("SEPOLIA_PRIVATE_KEY")) {
  networks.sepolia = {
    url: vars.get("SEPOLIA_RPC_URL"),
    accounts: [vars.get("SEPOLIA_PRIVATE_KEY")],
  };
}

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks,
  // Source verification on Etherscan, with a free API key set through
  // npx hardhat vars set ETHERSCAN_API_KEY. Sourcify is off because the
  // Hardhat 2 plugin still calls Sourcify's retired v1 API.
  etherscan: {
    apiKey: vars.get("ETHERSCAN_API_KEY", ""),
  },
  sourcify: {
    enabled: false,
  },
};
