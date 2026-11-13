import { explorerLink } from "../lib/contracts.js";

// status is { type: "pending" | "success" | "error", message, transactionHash? }
export default function StatusMessage({ status }) {
  if (!status) {
    return null;
  }
  const link = status.transactionHash && explorerLink("tx", status.transactionHash);
  return (
    <div className={`status ${status.type}`} role="status">
      <span>{status.message}</span>
      {link && (
        <a href={link} target="_blank" rel="noreferrer">
          View the transaction on Etherscan
        </a>
      )}
    </div>
  );
}
