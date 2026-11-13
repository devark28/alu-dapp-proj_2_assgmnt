import { explorerLink } from "../lib/contracts.js";
import { formatDate, shortenAddress } from "../lib/format.js";

function WalletName({ address }) {
  const text = `ALU wallet ${shortenAddress(address)}`;
  const link = explorerLink("address", address);
  if (!link) {
    return text;
  }
  return (
    <a href={link} target="_blank" rel="noreferrer">
      {text}
    </a>
  );
}

export default function VerificationResult({ result }) {
  const kind = result.isAuthentic ? "authentic" : "modified";
  return (
    <div className={`result ${kind}`} role="status">
      <div className="result-icon" aria-hidden="true">
        {result.isAuthentic ? "✓" : "!"}
      </div>
      <div>
        <h3>{result.title}</h3>
        <p>{result.explanation}</p>
        {result.asset && (
          <dl className="details">
            <dt>Registered as</dt>
            <dd>{result.asset.name}</dd>
            <dt>Registered on</dt>
            <dd>{formatDate(result.asset.registeredAt)}</dd>
            <dt>Registered by</dt>
            <dd>
              <WalletName address={result.asset.registeredBy} />
            </dd>
          </dl>
        )}
      </div>
    </div>
  );
}
