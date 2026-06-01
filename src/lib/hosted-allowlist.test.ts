import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOSTED_ALLOWED_EMAIL,
  getHostedAllowedEmails,
  isHostedEmailAllowed,
} from "./hosted-allowlist";

describe("hosted allowlist", () => {
  it("defaults to Jeremy's email", () => {
    expect(getHostedAllowedEmails(undefined)).toEqual(
      new Set([DEFAULT_HOSTED_ALLOWED_EMAIL]),
    );
  });

  it("normalizes configured email addresses", () => {
    expect(
      isHostedEmailAllowed(
        " JEREMY@IGNITABULL.COM ",
        " admin@example.com, jeremy@ignitabull.com ",
      ),
    ).toBe(true);
  });

  it("rejects emails outside the allowlist", () => {
    expect(
      isHostedEmailAllowed("someone@example.com", "jeremy@ignitabull.com"),
    ).toBe(false);
  });
});
