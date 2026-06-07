const baseUrl = process.env.OPEN_SEO_WEB_URL ?? "https://openseo.so";
const wwwUrl = process.env.OPEN_SEO_WEB_WWW_URL ?? "https://www.openseo.so";
const paths = [
  "/",
  "/pricing",
  "/features/mcp",
  "/guides",
  "/guides/seo-for-startups",
];

async function expectOk(url: URL) {
  const response = await fetch(url, { redirect: "follow" });
  if (response.status !== 200) {
    throw new Error(`${url.toString()} returned ${response.status}`);
  }
  console.log(`${response.status} ${url.toString()}`);
}

for (const path of paths) {
  await expectOk(new URL(path, baseUrl));
}

const wwwResponse = await fetch(wwwUrl, { redirect: "manual" });
if (![200, 301, 302, 307, 308].includes(wwwResponse.status)) {
  throw new Error(`${wwwUrl} returned ${wwwResponse.status}`);
}
console.log(`${wwwResponse.status} ${wwwUrl}`);
console.log(`Marketing smoke checks passed for ${baseUrl}`);

export {};
