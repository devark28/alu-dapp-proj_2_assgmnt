const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const path = require("path");
const { sha256OfFile } = require("../scripts/hash-logo");
const { parseHash } = require("../frontend/src/lib/hash.js");
const { checkDistribution } = require("../frontend/src/lib/shares.js");

const LOGO_HASH = sha256OfFile(path.join(__dirname, "..", "alu-logo.png"));

async function deployBothFixture() {
  const [owner, otherAccount] = await ethers.getSigners();
  const registry = await ethers.deployContract("ALUAssetRegistry");
  const token = await ethers.deployContract("ALULogoToken", [owner.address]);
  return { registry, token, owner, otherAccount };
}

describe("Edge cases", function () {
  it("rejects an empty hash, name or file type", async function () {
    const { registry } = await loadFixture(deployBothFixture);

    await expect(registry.registerAsset("Logo", "image/png", ethers.ZeroHash)).to.be.revertedWith(
      "Content hash cannot be empty"
    );
    await expect(registry.registerAsset("", "image/png", LOGO_HASH)).to.be.revertedWith("Asset name cannot be empty");
    await expect(registry.registerAsset("Logo", "", LOGO_HASH)).to.be.revertedWith("File type cannot be empty");
  });

  it("rejects lookups of a token ID that was never registered", async function () {
    const { registry } = await loadFixture(deployBothFixture);

    await expect(registry.getAsset(1n)).to.be.revertedWith("No asset is registered with this token ID");
    await expect(registry.verifyLogoIntegrity(1n, LOGO_HASH)).to.be.revertedWith(
      "No asset is registered with this token ID"
    );
  });

  it("gives different files different token IDs and counts them", async function () {
    const { registry, otherAccount } = await loadFixture(deployBothFixture);

    await registry.registerAsset("ALU Official Logo", "image/png", LOGO_HASH);
    await registry.connect(otherAccount).registerAsset("Other File", "application/pdf", ethers.id("other file"));

    expect(await registry.totalAssets()).to.equal(2n);
    expect(await registry.ownerOf(2n)).to.equal(otherAccount.address);
    expect(await registry.isHashRegistered(LOGO_HASH)).to.equal(true);
  });

  it("only lets the owner distribute shares", async function () {
    const { token, otherAccount } = await loadFixture(deployBothFixture);

    await expect(token.connect(otherAccount).distributeShares(otherAccount.address, 1n))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(otherAccount.address);
  });

  it("rejects distributing zero shares or more shares than the owner holds", async function () {
    const { token, otherAccount } = await loadFixture(deployBothFixture);

    await expect(token.distributeShares(otherAccount.address, 0n)).to.be.revertedWith(
      "Amount must be greater than zero"
    );
    await expect(token.distributeShares(otherAccount.address, 1_000_001n)).to.be.revertedWithCustomError(
      token,
      "ERC20InsufficientBalance"
    );
  });

  it("rounds ownership percentages down to whole numbers", async function () {
    const { token, otherAccount } = await loadFixture(deployBothFixture);

    await token.distributeShares(otherAccount.address, 9_999n);
    expect(await token.ownershipPercentage(otherAccount.address)).to.equal(0n);
    expect(await token.decimals()).to.equal(0n);
  });

  it("frontend catches a bad hash or distribution form before anything is sent", async function () {
    const { otherAccount } = await loadFixture(deployBothFixture);

    expect(parseHash(LOGO_HASH.slice(2).toUpperCase())).to.equal(LOGO_HASH);
    expect(parseHash("0x1234")).to.equal(null);

    expect(checkDistribution("0x1234", "10", 1_000_000n).error).to.include("valid wallet address");
    expect(checkDistribution(otherAccount.address, "0", 1_000_000n).error).to.include("greater than zero");
    expect(checkDistribution(otherAccount.address, "2.5", 1_000_000n).error).to.include("whole number");
    expect(checkDistribution(otherAccount.address, "1000001", 1_000_000n).error).to.include("only holds");
    expect(checkDistribution(otherAccount.address, "250000", 1_000_000n).amount).to.equal(250_000n);
  });
});
