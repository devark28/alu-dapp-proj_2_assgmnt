const crypto = require("crypto");
const fs = require("fs");

// Returns the SHA-256 hash of a file's bytes as 0x-prefixed hex, the form a
// Solidity bytes32 argument takes.
function sha256OfFile(path) {
  const fileBytes = fs.readFileSync(path);
  return "0x" + crypto.createHash("sha256").update(fileBytes).digest("hex");
}

module.exports = { sha256OfFile };

if (require.main === module) {
  const path = process.argv[2] || "alu-logo.png";
  console.log(`SHA-256 of ${path}:`);
  console.log(sha256OfFile(path));
}
