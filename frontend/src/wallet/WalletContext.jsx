import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAddress } from "ethers";
import { network } from "../config.js";
import { tokenContract } from "../lib/contracts.js";
import { friendlyError } from "../lib/errors.js";

const WalletContext = createContext(null);

const hasWallet = typeof window.ethereum !== "undefined";

function firstAccount(accounts) {
  return accounts.length > 0 ? getAddress(accounts[0]) : null;
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");

  // Picks up a connection the user already approved, without a popup, and
  // follows account and network changes made in the wallet.
  useEffect(() => {
    if (!hasWallet) {
      return;
    }
    function handleAccountsChanged(accounts) {
      setAccount(firstAccount(accounts));
    }
    function handleChainChanged(chainIdHex) {
      setChainId(Number(chainIdHex));
    }

    window.ethereum.request({ method: "eth_accounts" }).then(handleAccountsChanged);
    window.ethereum.request({ method: "eth_chainId" }).then(handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!account) {
      setBalance(null);
      return;
    }
    try {
      setBalance(await tokenContract().balanceOf(account));
    } catch {
      setBalance(null);
    }
  }, [account]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  async function connect() {
    setError("");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(firstAccount(accounts));
    } catch (requestError) {
      setError(friendlyError(requestError));
    }
  }

  // MetaMask supports revoking the site's permission, so the next visit asks
  // again. Wallets without it are only disconnected inside the app.
  async function disconnect() {
    try {
      await window.ethereum.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      console.info("This wallet cannot revoke permissions; disconnecting in the app only.");
    }
    setAccount(null);
  }

  async function switchNetwork() {
    setError("");
    const chainIdHex = "0x" + network.chainId.toString(16);
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await addNetwork(chainIdHex);
      } else {
        setError(friendlyError(switchError));
      }
    }
  }

  // Error 4902 means the wallet does not know the network yet, which is the
  // case for a local Hardhat node.
  async function addNetwork(chainIdHex) {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    } catch (addError) {
      setError(friendlyError(addError));
    }
  }

  const value = {
    hasWallet,
    account,
    balance,
    error,
    isCorrectNetwork: chainId === network.chainId,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
  };
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}
