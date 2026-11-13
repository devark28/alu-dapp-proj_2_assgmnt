export const AUTHENTIC_TITLE = "Logo Verified: This is the authentic ALU logo";
export const MODIFIED_TITLE = "Warning: This logo has been modified";

// Asks the registry whether a hash matches the registered asset and turns the
// answer into what the verification page shows.
export async function verifyLogo(registry, tokenId, contentHash) {
  const [isAuthentic] = await registry.verifyLogoIntegrity(tokenId, contentHash);

  if (!isAuthentic) {
    return {
      isAuthentic: false,
      title: MODIFIED_TITLE,
      explanation:
        "This file is not the official ALU logo registered on the blockchain. It may have been edited, " +
        "re-saved or replaced. Do not use it as the official logo.",
    };
  }

  const asset = await registry.getAsset(tokenId);
  return {
    isAuthentic: true,
    title: AUTHENTIC_TITLE,
    explanation: "This file is exactly the same as the logo ALU registered on the blockchain.",
    asset: {
      name: asset.name,
      registeredAt: new Date(Number(asset.registeredAt) * 1000),
      registeredBy: asset.registeredBy,
    },
  };
}
