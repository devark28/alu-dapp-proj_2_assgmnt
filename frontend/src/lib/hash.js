// SHA-256 of a file's bytes, computed in the browser with the Web Crypto API,
// returned as 0x-prefixed hex: the bytes32 form the contract expects.
export async function hashFile(file) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return "0x" + hex;
}

// Accepts a pasted hash with or without the 0x prefix. Returns it as bytes32,
// or null when it is not 64 hexadecimal characters.
export function parseHash(text) {
  const hex = text.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    return null;
  }
  return "0x" + hex;
}
