import { useState } from "react";
import FilePicker from "../components/FilePicker.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { registeredTokenId, registryContract, walletSigner } from "../lib/contracts.js";
import { friendlyError } from "../lib/errors.js";
import { useWallet } from "../wallet/WalletContext.jsx";

function fileTypeOf(file) {
  const extension = file.name.split(".").pop();
  return extension === file.name ? "" : extension.toUpperCase();
}

export default function RegisterPage() {
  const wallet = useWallet();
  const [contentHash, setContentHash] = useState("");
  const [name, setName] = useState("");
  const [fileType, setFileType] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [status, setStatus] = useState(null);

  const isSending = status?.type === "pending";
  const canSubmit =
    wallet.account && wallet.isCorrectNetwork && contentHash && !alreadyRegistered && !isSending;

  // Checking the hash first is a free read, so a duplicate is caught before
  // the user is asked to pay for a transaction that would fail.
  async function handleFileHashed(file, hash) {
    setContentHash(hash);
    setFileType(fileTypeOf(file));
    setStatus(null);
    setAlreadyRegistered(await registryContract().isHashRegistered(hash));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "pending", message: "Approve the transaction in your wallet to register the file." });
    try {
      const registry = registryContract(await walletSigner());
      const transaction = await registry.registerAsset(name.trim(), fileType.trim(), contentHash);
      setStatus({ type: "pending", message: "Transaction sent. Waiting for the network to confirm it..." });
      const receipt = await transaction.wait();
      const tokenId = registeredTokenId(registry, receipt);
      setAlreadyRegistered(true);
      setStatus({
        type: "success",
        message: `Registered. "${name.trim()}" is now token #${tokenId}, owned by your wallet.`,
        transactionHash: transaction.hash,
      });
    } catch (sendError) {
      setStatus({ type: "error", message: friendlyError(sendError) });
    }
  }

  return (
    <>
      <section className="intro">
        <h1>Register an asset</h1>
        <p>
          Registering stores the file's SHA-256 fingerprint on the blockchain and gives your wallet an NFT for it. The
          file itself is never uploaded: the fingerprint is computed in your browser.
        </p>
      </section>

      <section className="card">
        <h2>1. Choose the file</h2>
        <FilePicker prompt="Choose the file to register" onFileHashed={handleFileHashed} />
        {alreadyRegistered && !status && (
          <p className="error-text">
            This file is already registered on the blockchain. Each file can only be registered once.
          </p>
        )}
      </section>

      <section className="card">
        <h2>2. Describe it and register</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Content hash (SHA-256, bytes32)
            <input value={contentHash} readOnly placeholder="Filled in when you choose a file" className="mono" />
          </label>
          <label>
            Asset name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ALU Official Logo 2026"
              required
            />
          </label>
          <label>
            File type
            <input value={fileType} onChange={(event) => setFileType(event.target.value)} placeholder="PNG" required />
          </label>
          <button className="button primary" disabled={!canSubmit}>
            {isSending ? "Registering..." : "Register on the blockchain"}
          </button>
          {!wallet.account && <p className="muted">Connect your wallet to register. Registering costs a small gas fee.</p>}
        </form>
        <StatusMessage status={status} />
      </section>
    </>
  );
}
