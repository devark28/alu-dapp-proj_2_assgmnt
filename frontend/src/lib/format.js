const numberFormat = new Intl.NumberFormat("en-US");

export function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatShares(amount) {
  return numberFormat.format(amount);
}

export function formatDate(date) {
  return date.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
}
