/** Formats a number as Bangladeshi Taka, e.g. 1500 -> "৳1,500". */
export function formatTaka(amount: number) {
  return `৳${amount.toLocaleString("en-US")}`;
}

/** Shortens big numbers, e.g. 3200 -> "3.2k". */
export function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
