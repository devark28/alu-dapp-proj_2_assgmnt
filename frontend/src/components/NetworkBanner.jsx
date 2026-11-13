import { network } from "../config.js";
import { useWallet } from "../wallet/WalletContext.jsx";

// Shown on every page while the wallet is on a network without the contracts.
export default function NetworkBanner() {
  const wallet = useWallet();
  if (!wallet.account || wallet.isCorrectNetwork) {
    return null;
  }
  return (
    <div className="banner">
      <span>Your wallet is on a different network. The ALU contracts are on {network.name}.</span>
      <button className="button small" onClick={wallet.switchNetwork}>
        Switch to {network.name}
      </button>
    </div>
  );
}
