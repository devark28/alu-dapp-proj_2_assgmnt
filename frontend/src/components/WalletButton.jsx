import { useState } from "react";
import { useWallet } from "../wallet/WalletContext.jsx";
import { formatShares, shortenAddress } from "../lib/format.js";

export default function WalletButton() {
  const wallet = useWallet();
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  function handleConnect() {
    if (wallet.hasWallet) {
      wallet.connect();
    } else {
      setShowInstallHelp(true);
    }
  }

  if (!wallet.account) {
    return (
      <div className="wallet">
        <button className="button primary" onClick={handleConnect}>
          Connect Wallet
        </button>
        {showInstallHelp && (
          <p className="wallet-note">
            No Web3 wallet was found in this browser. Install{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              MetaMask
            </a>{" "}
            or Coinbase Wallet, then reload the page. You can still verify a logo without one.
          </p>
        )}
        {wallet.error && <p className="wallet-note error-text">{wallet.error}</p>}
      </div>
    );
  }

  return (
    <div className="wallet">
      <div className="wallet-details">
        <span className="wallet-address" title={wallet.account}>
          {shortenAddress(wallet.account)}
        </span>
        <span className="wallet-balance">{wallet.balance === null ? "..." : formatShares(wallet.balance)} ALUT</span>
      </div>
      <button className="button secondary" onClick={wallet.disconnect}>
        Disconnect
      </button>
      {wallet.error && <p className="wallet-note error-text">{wallet.error}</p>}
    </div>
  );
}
