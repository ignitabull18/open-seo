const checks = [
  {
    name: "SERP API",
    url: "https://dataforseo.com/apis/serp-api/pricing",
    expected: ["$0.0006", "$0.002"],
  },
  {
    name: "Google DataForSEO Labs",
    url: "https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api",
    expected: ["DataForSEO Labs", "Google"],
  },
  {
    name: "Backlinks",
    url: "https://dataforseo.com/pricing/backlinks/backlinks",
    expected: ["$100"],
  },
  {
    name: "DataForSEO account minimums",
    url: "https://dataforseo.com/help-center/minimum-payment",
    expected: ["$1", "$50"],
  },
];

let failed = false;

for (const check of checks) {
  const response = await fetch(check.url);
  if (!response.ok) {
    failed = true;
    console.error(`${check.name}: ${response.status} ${check.url}`);
    continue;
  }

  const body = await response.text();
  const missing = check.expected.filter((needle) => !body.includes(needle));
  if (missing.length > 0) {
    failed = true;
    console.error(
      `${check.name}: did not find expected pricing markers ${missing.join(", ")}`,
    );
  } else {
    console.log(`${check.name}: pricing markers present`);
  }
}

if (failed) {
  console.error(
    "Refresh README cost guidance manually against the source URLs above.",
  );
  process.exit(1);
}

console.log(
  `DataForSEO pricing markers verified on ${new Date().toISOString()}`,
);

export {};
