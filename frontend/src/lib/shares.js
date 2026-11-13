import { isAddress } from "ethers";
import { formatShares } from "./format.js";

export async function readTotalSupply(token) {
  return formatShares(await token.totalSupply());
}

export async function readHolder(token, address) {
  const [balance, percentage] = await Promise.all([token.balanceOf(address), token.ownershipPercentage(address)]);
  return { address, balance, percentage };
}

// ownershipPercentage rounds down, so a small holder would read as 0%.
export function describePercentage(holder) {
  if (holder.percentage === 0n && holder.balance > 0n) {
    return "less than 1%";
  }
  return `${holder.percentage}%`;
}

// Checks the form before anything is sent, so the owner does not pay gas for a
// transaction the contract would reject. Returns the amount, or an error message.
export function checkDistribution(recipient, amountText, ownerBalance) {
  if (!isAddress(recipient)) {
    return { error: "Enter a valid wallet address: 0x followed by 40 letters and numbers." };
  }
  if (!/^\d+$/.test(amountText.trim())) {
    return { error: "Enter a whole number of shares, for example 50000." };
  }
  const amount = BigInt(amountText.trim());
  if (amount === 0n) {
    return { error: "The amount must be greater than zero." };
  }
  if (amount > ownerBalance) {
    return { error: `The owner only holds ${formatShares(ownerBalance)} ALUT.` };
  }
  return { amount };
}

export async function distributeShares(token, recipient, amount) {
  const transaction = await token.distributeShares(recipient, amount);
  return transaction.wait();
}
