/**
 * Manual payment accounts shown to students on the enroll page.
 * These numbers are public (students send money to them).
 * Set `number` to "" to hide a method.
 */
export const manualPaymentMethods = [
  {
    id: "bkash",
    name: "bKash",
    number: "01713620014",
    accountType: "Personal",
    instruction: "Use Send Money",
    color: "bg-pink-600",
  },
  {
    id: "nagad",
    name: "Nagad",
    number: "",
    accountType: "Personal",
    instruction: "Use Send Money",
    color: "bg-orange-600",
  },
] as const;

export const activeManualMethods = manualPaymentMethods.filter((m) => m.number);
export type ManualMethodId = (typeof manualPaymentMethods)[number]["id"];
