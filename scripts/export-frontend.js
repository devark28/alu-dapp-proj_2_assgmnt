const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const CONTRACT_NAMES = ["ALUAssetRegistry", "ALULogoToken"];
const DEPLOYMENTS_FOLDER = path.join(__dirname, "..", "deployments");
const FRONTEND_FOLDER = path.join(__dirname, "..", "frontend", "src", "contracts");

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

// The frontend builds its contract objects from these files: one ABI per
// contract, and the addresses of every saved deployment keyed by network name.
async function exportToFrontend() {
  fs.mkdirSync(FRONTEND_FOLDER, { recursive: true });

  for (const name of CONTRACT_NAMES) {
    const artifact = await hre.artifacts.readArtifact(name);
    writeJson(path.join(FRONTEND_FOLDER, `${name}.json`), { abi: artifact.abi });
  }

  const deployments = {};
  for (const file of fs.readdirSync(DEPLOYMENTS_FOLDER)) {
    const record = JSON.parse(fs.readFileSync(path.join(DEPLOYMENTS_FOLDER, file), "utf8"));
    if (record.network !== "hardhat") {
      deployments[record.network] = record;
    }
  }
  writeJson(path.join(FRONTEND_FOLDER, "deployments.json"), deployments);

  console.log(`ABIs and addresses (${Object.keys(deployments).join(", ")}) copied to frontend/src/contracts`);
}

module.exports = { exportToFrontend };

if (require.main === module) {
  exportToFrontend().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
