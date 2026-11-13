import { useState } from "react";
import FilePicker from "../components/FilePicker.jsx";
import VerificationResult from "../components/VerificationResult.jsx";
import { logoTokenId } from "../config.js";
import { registryContract } from "../lib/contracts.js";
import { parseHash } from "../lib/hash.js";
import { verifyLogo } from "../lib/verification.js";

const CONNECTION_ERROR = "We could not reach the blockchain to check this logo. Check your internet connection and try again.";

// Public page: every call here is a free read, so no wallet is needed.
export default function VerifyPage() {
  const [fileResult, setFileResult] = useState(null);
  const [fileError, setFileError] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [checkingFile, setCheckingFile] = useState(false);

  const [pastedHash, setPastedHash] = useState("");
  const [hashResult, setHashResult] = useState(null);
  const [hashError, setHashError] = useState("");
  const [checkingHash, setCheckingHash] = useState(false);

  async function handleFileHashed(file, hash) {
    setFileHash(hash);
    setFileResult(null);
    setFileError("");
    setCheckingFile(true);
    try {
      setFileResult(await verifyLogo(registryContract(), logoTokenId, hash));
    } catch {
      setFileError(CONNECTION_ERROR);
    } finally {
      setCheckingFile(false);
    }
  }

  async function handleHashSubmit(event) {
    event.preventDefault();
    setHashResult(null);
    setHashError("");
    const hash = parseHash(pastedHash);
    if (!hash) {
      setHashError("That is not a complete SHA-256 hash. It should be 64 characters long, using 0-9 and a-f.");
      return;
    }
    setCheckingHash(true);
    try {
      setHashResult(await verifyLogo(registryContract(), logoTokenId, hash));
    } catch {
      setHashError(CONNECTION_ERROR);
    } finally {
      setCheckingHash(false);
    }
  }

  return (
    <>
      <section className="intro">
        <h1>Is this the real ALU logo?</h1>
        <p>
          Upload a copy of the ALU logo you received. We compare it with the official logo that ALU registered on the
          blockchain. Your file stays on your device and no wallet is needed.
        </p>
      </section>

      <section className="card">
        <h2>Check a logo file</h2>
        <FilePicker prompt="Choose the logo file to check" onFileHashed={handleFileHashed} />
        {checkingFile && <p className="muted">Checking the logo...</p>}
        {fileError && <p className="error-text">{fileError}</p>}
        {fileResult && <VerificationResult result={fileResult} />}
        {fileHash && (
          <details className="technical">
            <summary>Technical details</summary>
            <p>
              SHA-256 fingerprint of your file: <code>{fileHash}</code>
            </p>
          </details>
        )}
      </section>

      <section className="card">
        <h2>Check a fingerprint instead</h2>
        <p className="muted">If someone sent you the file's SHA-256 fingerprint rather than the file, paste it here.</p>
        <form className="inline-form" onSubmit={handleHashSubmit}>
          <input
            value={pastedHash}
            onChange={(event) => setPastedHash(event.target.value)}
            placeholder="Paste the SHA-256 fingerprint"
            aria-label="SHA-256 fingerprint"
          />
          <button className="button primary" disabled={checkingHash || !pastedHash.trim()}>
            {checkingHash ? "Checking..." : "Check"}
          </button>
        </form>
        {hashError && <p className="error-text">{hashError}</p>}
        {hashResult && <VerificationResult result={hashResult} />}
      </section>
    </>
  );
}
