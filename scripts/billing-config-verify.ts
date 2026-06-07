import { readFileSync } from "node:fs";

const checks: Array<{ file: string; markers: string[] }> = [
  {
    file: "package.json",
    markers: ['"autumn-js"', '"billing:verify"'],
  },
  {
    file: "src/shared/billing.ts",
    markers: [
      "AUTUMN_PAID_PLAN_ID",
      "AUTUMN_PAID_PLAN_FEATURE_ID",
      "AUTUMN_SEO_DATA_BALANCE_FEATURE_ID",
      "AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID",
    ],
  },
  {
    file: "src/server/billing/autumn.ts",
    markers: ["AUTUMN_SECRET_KEY", "new Autumn"],
  },
  {
    file: "src/routes/api/autumn/$.ts",
    markers: ["autumnHandler", "resolveHostedContext", "isHostedAuthMode"],
  },
  {
    file: "docs/OPERATION_RUNBOOKS.md",
    markers: [
      "## Autumn billing validation",
      "AUTUMN_SECRET_KEY",
      "webhook signing",
    ],
  },
];

const missing: string[] = [];

for (const check of checks) {
  const text = readFileSync(check.file, "utf8");
  for (const marker of check.markers) {
    if (!text.includes(marker)) {
      missing.push(`${check.file}: ${marker}`);
    }
  }
}

if (missing.length > 0) {
  console.error("Billing config verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Autumn billing config verification passed");
