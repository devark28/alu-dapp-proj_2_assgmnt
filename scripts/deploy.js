const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { sha256OfFile } = require("./hash-logo");
const { exportToFrontend } = require("./export-frontend");

const LOGO_FILE = path.join(__dirname, "..", "alu-logo.png");
const LOGO_NAME = "ALU Official Logo";
const LOGO_FILE_TYPE = "image/png";

async function deployRegistry() {
  const registry = await hre.ethers.deployContract("ALUAssetRegistry");
  await registry.waitForDeployment();
  console.log(`ALUAssetRegistry deployed to ${await registry.getAddress()}`);
  return registry;
}

// The logo is registered in the same run as the deployment, so no one else
// can register its hash first.
async function registerLogo(registry, logoHash) {
  const transaction = await registry.registerAsset(LOGO_NAME, LOGO_FILE_TYPE, logoHash);
  const receipt = await transaction.wait();

  const event = receipt.logs
    .map((log) => registry.interface.parseLog(log))
    .find((parsed) => parsed && parsed.name === "AssetRegistered");
  const tokenId = event.args.tokenId;

  console.log(`ALU logo registered as token ${tokenId} in transaction ${transaction.hash}`);
  return { tokenId, transactionHash: transaction.hash };
}

async function deployToken(logoOwner) {
  const token = await hre.ethers.deployContract("ALULogoToken", [logoOwner]);
  await token.waitForDeployment();
  const supply = await token.totalSupply();
  console.log(`ALULogoToken deployed to ${await token.getAddress()}, ${supply} ALUT minted to ${logoOwner}`);
  return token;
}

function saveDeployment(record) {
  const folder = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `${hre.network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
  console.log(`Addresses saved to deployments/${hre.network.name}.json`);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const logoHash = sha256OfFile(LOGO_FILE);

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`SHA-256 of alu-logo.png: ${logoHash}`);

  const registry = await deployRegistry();
  const registration = await registerLogo(registry, logoHash);

  const [isAuthentic, message] = await registry.verifyLogoIntegrity(registration.tokenId, logoHash);
  console.log(`verifyLogoIntegrity: ${isAuthentic} (${message})`);

  const token = await deployToken(deployer.address);

  saveDeployment({
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    logoHash,
    logoTokenId: registration.tokenId.toString(),
    registrationTransaction: registration.transactionHash,
    ALUAssetRegistry: await registry.getAddress(),
    ALULogoToken: await token.getAddress(),
  });
  await exportToFrontend();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
