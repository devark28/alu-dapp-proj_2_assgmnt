const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { sha256OfFile } = require("../scripts/hash-logo");

// The frontend's own modules, the same code the dApp runs in the browser.
const { hashFile } = require("../frontend/src/lib/hash.js");
const { verifyLogo, AUTHENTIC_TITLE, MODIFIED_TITLE } = require("../frontend/src/lib/verification.js");
const { readTotalSupply, readHolder, distributeShares } = require("../frontend/src/lib/shares.js");

const LOGO_PATH = path.join(__dirname, "..", "alu-logo.png");
const LOGO_HASH = sha256OfFile(LOGO_PATH);
const LOGO_NAME = "ALU Official Logo";
const LOGO_FILE_TYPE = "image/png";

// The same logo with a single byte changed, the way an edited or corrupted copy would differ.
function hashOfTamperedLogo() {
  const bytes = fs.readFileSync(LOGO_PATH);
  bytes[bytes.length - 20] ^= 0x01;
  return "0x" + crypto.createHash("sha256").update(bytes).digest("hex");
}

async function deployRegistryFixture() {
  const [owner, otherAccount] = await ethers.getSigners();
  const registry = await ethers.deployContract("ALUAssetRegistry");
  return { registry, owner, otherAccount };
}

async function registeredLogoFixture() {
  const fixture = await deployRegistryFixture();
  await fixture.registry.registerAsset(LOGO_NAME, LOGO_FILE_TYPE, LOGO_HASH);
  return { ...fixture, tokenId: 1n };
}

async function deployTokenFixture() {
  const [logoOwner, faculty, student] = await ethers.getSigners();
  const token = await ethers.deployContract("ALULogoToken", [logoOwner.address]);
  return { token, logoOwner, faculty, student };
}

describe("ALUAssetRegistry", function () {
  it("registers the ALU logo and returns a token ID", async function () {
    const { registry, owner } = await loadFixture(deployRegistryFixture);

    const tokenId = await registry.registerAsset.staticCall(LOGO_NAME, LOGO_FILE_TYPE, LOGO_HASH);
    expect(tokenId).to.equal(1n);

    await expect(registry.registerAsset(LOGO_NAME, LOGO_FILE_TYPE, LOGO_HASH))
      .to.emit(registry, "AssetRegistered")
      .withArgs(1n, owner.address, LOGO_HASH, LOGO_NAME, LOGO_FILE_TYPE, (timestamp) => timestamp > 0n);
    expect(await registry.ownerOf(1n)).to.equal(owner.address);
  });

  it("rejects a second registration of the same hash", async function () {
    const { registry, otherAccount } = await loadFixture(registeredLogoFixture);

    await expect(
      registry.connect(otherAccount).registerAsset("Copied Logo", LOGO_FILE_TYPE, LOGO_HASH)
    ).to.be.revertedWith("This file has already been registered");
  });

  it("verifyLogoIntegrity returns true for the correct hash", async function () {
    const { registry, tokenId } = await loadFixture(registeredLogoFixture);

    const [isAuthentic, message] = await registry.verifyLogoIntegrity(tokenId, LOGO_HASH);
    expect(isAuthentic).to.equal(true);
    expect(message).to.equal("Logo is authentic.");
  });

  it("verifyLogoIntegrity returns false for an incorrect hash", async function () {
    const { registry, tokenId } = await loadFixture(registeredLogoFixture);

    const [isAuthentic, message] = await registry.verifyLogoIntegrity(tokenId, hashOfTamperedLogo());
    expect(isAuthentic).to.equal(false);
    expect(message).to.equal("Warning: logo does not match.");
  });

  it("getAsset returns the asset name and file type", async function () {
    const { registry, owner, tokenId } = await loadFixture(registeredLogoFixture);

    const asset = await registry.getAsset(tokenId);
    expect(asset.name).to.equal(LOGO_NAME);
    expect(asset.fileType).to.equal(LOGO_FILE_TYPE);
    expect(asset.contentHash).to.equal(LOGO_HASH);
    expect(asset.registeredBy).to.equal(owner.address);
  });
});

describe("ALULogoToken", function () {
  it("mints the full supply of 1,000,000 ALUT to the logo owner", async function () {
    const { token, logoOwner } = await loadFixture(deployTokenFixture);

    expect(await token.totalSupply()).to.equal(1_000_000n);
    expect(await token.balanceOf(logoOwner.address)).to.equal(1_000_000n);
  });

  it("distributeShares transfers the given number of tokens to a recipient", async function () {
    const { token, logoOwner, faculty } = await loadFixture(deployTokenFixture);

    await expect(token.distributeShares(faculty.address, 100_000n)).to.changeTokenBalances(
      token,
      [logoOwner, faculty],
      [-100_000n, 100_000n]
    );
  });

  it("ownershipPercentage returns the percentage held by a wallet", async function () {
    const { token, logoOwner, faculty } = await loadFixture(deployTokenFixture);

    await token.distributeShares(faculty.address, 500_000n);
    expect(await token.ownershipPercentage(faculty.address)).to.equal(50n);
    expect(await token.ownershipPercentage(logoOwner.address)).to.equal(50n);
  });
});

describe("Frontend integration", function () {
  it("reads the total ALUT supply from the contract and displays 1,000,000", async function () {
    const { token } = await loadFixture(deployTokenFixture);

    expect(await readTotalSupply(token)).to.equal("1,000,000");
  });

  it("hashes a file to the correct SHA-256 value in bytes32 format", async function () {
    const logoFile = new File([fs.readFileSync(LOGO_PATH)], "alu-logo.png", { type: "image/png" });

    const hash = await hashFile(logoFile);
    expect(hash).to.match(/^0x[0-9a-f]{64}$/);
    expect(hash).to.equal(LOGO_HASH);
  });

  it("shows a verification success result for the correct logo hash", async function () {
    const { registry, owner, tokenId } = await loadFixture(registeredLogoFixture);

    const result = await verifyLogo(registry, tokenId, LOGO_HASH);
    expect(result.isAuthentic).to.equal(true);
    expect(result.title).to.equal(AUTHENTIC_TITLE);
    expect(result.asset.name).to.equal(LOGO_NAME);
    expect(result.asset.registeredBy).to.equal(owner.address);
  });

  it("shows a verification failure result for an incorrect hash", async function () {
    const { registry, tokenId } = await loadFixture(registeredLogoFixture);

    const result = await verifyLogo(registry, tokenId, hashOfTamperedLogo());
    expect(result.isAuthentic).to.equal(false);
    expect(result.title).to.equal(MODIFIED_TITLE);
    expect(result.asset).to.equal(undefined);
  });

  it("updates the recipient's balance after distributeShares", async function () {
    const { token, faculty } = await loadFixture(deployTokenFixture);

    await distributeShares(token, faculty.address, 100_000n);

    const holder = await readHolder(token, faculty.address);
    expect(holder.balance).to.equal(100_000n);
    expect(holder.percentage).to.equal(10n);
  });
});
