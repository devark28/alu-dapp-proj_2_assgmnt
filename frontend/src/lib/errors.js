const CONTRACT_MESSAGES = {
  "This file has already been registered":
    "This file is already registered on the blockchain. Each file can only be registered once.",
  "Asset name cannot be empty": "Enter a name for the asset.",
  "File type cannot be empty": "Enter the file type, for example PNG.",
  "Content hash cannot be empty": "Choose a file first.",
  "No asset is registered with this token ID": "No asset is registered with that token ID.",
  "Amount must be greater than zero": "The amount must be greater than zero.",
  "Recipient cannot be the zero address": "Enter a real recipient address.",
};

// Turns wallet and contract errors from ethers into a sentence for the user.
export function friendlyError(error) {
  if (error.code === "ACTION_REJECTED" || error.code === 4001) {
    return "You rejected the request in your wallet, so nothing was sent.";
  }
  if (error.code === "INSUFFICIENT_FUNDS") {
    return "Your wallet does not have enough ETH to pay the gas fee.";
  }
  if (error.revert?.name === "OwnableUnauthorizedAccount") {
    return "The contract rejected this wallet: only the contract owner can distribute shares.";
  }
  if (error.revert?.name === "ERC20InsufficientBalance") {
    return "The owner does not hold enough ALUT for this transfer.";
  }
  if (CONTRACT_MESSAGES[error.reason]) {
    return CONTRACT_MESSAGES[error.reason];
  }
  return error.shortMessage || error.message || "Something went wrong. Please try again.";
}
