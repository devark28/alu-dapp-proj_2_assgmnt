import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { deployment, network } from "../config.js";
import registryArtifact from "../contracts/ALUAssetRegistry.json";
import tokenArtifact from "../contracts/ALULogoToken.json";

// Reads go through a public node, so they work without a wallet and cost nothing.
const readProvider = new JsonRpcProvider(network.rpcUrl, network.chainId, { staticNetwork: true });

// Pass a signer to send transactions; leave it out for read-only calls.
export function registryContract(runner = readProvider) {
  return new Contract(deployment.ALUAssetRegistry, registryArtifact.abi, runner);
}

export function tokenContract(runner = readProvider) {
  return new Contract(deployment.ALULogoToken, tokenArtifact.abi, runner);
}

// A new BrowserProvider each time, so a network switch in the wallet never
// leaves the app holding a provider for the old network.
export async function walletSigner() {
  const provider = new BrowserProvider(window.ethereum);
  return provider.getSigner();
}

export function registeredTokenId(registry, receipt) {
  const event = receipt.logs
    .map((log) => registry.interface.parseLog(log))
    .find((parsed) => parsed && parsed.name === "AssetRegistered");
  return event.args.tokenId;
}

export function explorerLink(kind, value) {
  if (!network.explorerUrl) {
    return null;
  }
  return `${network.explorerUrl}/${kind}/${value}`;
}
