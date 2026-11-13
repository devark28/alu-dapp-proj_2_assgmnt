import { useCallback, useEffect, useState } from "react";
import { getAddress } from "ethers";
import StatusMessage from "../components/StatusMessage.jsx";
import { exampleHolders } from "../config.js";
import { tokenContract, walletSigner } from "../lib/contracts.js";
import { friendlyError } from "../lib/errors.js";
import { formatShares, shortenAddress } from "../lib/format.js";
import { checkDistribution, describePercentage, distributeShares, readHolder, readTotalSupply } from "../lib/shares.js";
import { useWallet } from "../wallet/WalletContext.jsx";

export default function DashboardPage() {
  const wallet = useWallet();
  const [owner, setOwner] = useState(null);
  const [totalSupply, setTotalSupply] = useState(null);
  const [holders, setHolders] = useState([]);
  const [myHolding, setMyHolding] = useState(null);
  const [recentRecipients, setRecentRecipients] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const token = tokenContract();
      const ownerAddress = await token.owner();
      const rows = [
        { label: "ALU (contract owner)", address: ownerAddress },
        ...exampleHolders,
        ...recentRecipients.map((address) => ({ label: "Recent recipient", address })),
      ].map((row) => ({ ...row, address: getAddress(row.address) }));
      const uniqueRows = rows.filter((row, index) => rows.findIndex((other) => other.address === row.address) === index);

      setOwner(ownerAddress);
      setTotalSupply(await readTotalSupply(token));
      setHolders(
        await Promise.all(uniqueRows.map(async (row) => ({ ...row, ...(await readHolder(token, row.address)) })))
      );
      setMyHolding(wallet.account ? await readHolder(token, wallet.account) : null);
      setLoadError("");
    } catch {
      setLoadError("We could not load the token data from the blockchain. Check your connection and reload.");
    }
  }, [wallet.account, recentRecipients]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isOwner = Boolean(wallet.account && owner && wallet.account === owner);
  const ownerBalance = holders.find((holder) => holder.address === owner)?.balance ?? 0n;
  const isSending = status?.type === "pending";
  const formEnabled = isOwner && wallet.isCorrectNetwork && !isSending;

  async function handleSubmit(event) {
    event.preventDefault();
    const check = checkDistribution(recipient, amount, ownerBalance);
    if (check.error) {
      setStatus({ type: "error", message: check.error });
      return;
    }
    setStatus({ type: "pending", message: "Approve the transfer in your wallet." });
    try {
      const token = tokenContract(await walletSigner());
      const receipt = await distributeShares(token, recipient, check.amount);
      const recipientAddress = getAddress(recipient);
      setStatus({
        type: "success",
        message: `Sent ${formatShares(check.amount)} ALUT to ${shortenAddress(recipientAddress)}.`,
        transactionHash: receipt.hash,
      });
      setRecipient("");
      setAmount("");
      setRecentRecipients((previous) => [...previous, recipientAddress]);
      await wallet.refreshBalance();
    } catch (sendError) {
      setStatus({ type: "error", message: friendlyError(sendError) });
    }
  }

  return (
    <>
      <section className="intro">
        <h1>ALUT ownership</h1>
        <p>
          The ALU Logo Token splits ownership of the registered logo into 1,000,000 shares. Every figure on this page is
          read live from the token contract.
        </p>
      </section>

      {loadError && <p className="error-text">{loadError}</p>}

      <section className="stats">
        <div className="stat">
          <span className="stat-label">Total supply</span>
          <span className="stat-value">{totalSupply ?? "..."} ALUT</span>
        </div>
        <div className="stat">
          <span className="stat-label">Your balance</span>
          <span className="stat-value">{myHolding ? `${formatShares(myHolding.balance)} ALUT` : "Not connected"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Your ownership</span>
          <span className="stat-value">{myHolding ? describePercentage(myHolding) : "Not connected"}</span>
        </div>
      </section>

      <section className="card">
        <h2>Shareholders</h2>
        <table className="holders">
          <thead>
            <tr>
              <th>Holder</th>
              <th>Wallet</th>
              <th>Shares</th>
              <th>Ownership</th>
            </tr>
          </thead>
          <tbody>
            {holders.map((holder) => (
              <tr key={holder.address} className={holder.address === wallet.account ? "you" : ""}>
                <td>{holder.address === wallet.account ? `${holder.label} (you)` : holder.label}</td>
                <td title={holder.address}>{shortenAddress(holder.address)}</td>
                <td>{formatShares(holder.balance)}</td>
                <td>
                  <div className="share-bar">
                    <div className="share-fill" style={{ width: `${holder.percentage}%` }} />
                  </div>
                  {describePercentage(holder)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Distribute shares</h2>
        {!wallet.account && <p className="muted">Connect the owner's wallet to distribute shares.</p>}
        {wallet.account && !isOwner && owner && (
          <p className="notice">
            Only the contract owner, {shortenAddress(owner)}, can distribute shares. The wallet you connected is not the
            owner, so the contract would reject the transfer.
          </p>
        )}
        <form className="form" onSubmit={handleSubmit}>
          <fieldset disabled={!formEnabled}>
            <label>
              Recipient wallet
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x..."
                className="mono"
                required
              />
            </label>
            <label>
              Number of shares
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="numeric"
                placeholder="50000"
                required
              />
            </label>
            {isOwner && <p className="muted">You hold {formatShares(ownerBalance)} ALUT available to distribute.</p>}
            <button className="button primary">{isSending ? "Sending..." : "Distribute shares"}</button>
          </fieldset>
        </form>
        <StatusMessage status={status} />
      </section>
    </>
  );
}
