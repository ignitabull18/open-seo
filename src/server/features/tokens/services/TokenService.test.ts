import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findByHashMock,
  insertMock,
  listForUserMock,
  getByIdMock,
  revokeMock,
  touchLastUsedMock,
} = vi.hoisted(() => ({
  findByHashMock: vi.fn(),
  insertMock: vi.fn(),
  listForUserMock: vi.fn(),
  getByIdMock: vi.fn(),
  revokeMock: vi.fn(),
  touchLastUsedMock: vi.fn(),
}));

vi.mock("@/server/features/tokens/repositories/TokenRepository", () => ({
  TokenRepository: {
    findByHash: findByHashMock,
    insert: insertMock,
    listForUser: listForUserMock,
    getById: getByIdMock,
    revoke: revokeMock,
    touchLastUsed: touchLastUsedMock,
  },
}));

import { TokenService } from "./TokenService";

describe("TokenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("generates a token with the op_live_ prefix and inserts a hashed row", async () => {
      let captured: { tokenHash: string; scopes: string } | null = null;
      insertMock.mockImplementation(
        (row: { tokenHash: string; scopes: string }) => {
          captured = row;
          return Promise.resolve();
        },
      );
      const result = await TokenService.create({
        userId: "user_1",
        organizationId: "org_1",
        name: "Claude Desktop",
      });
      expect(result.token).toMatch(/^op_live_/);
      expect(result.token.length).toBeGreaterThan(20);
      expect(result.prefix).toBe(result.token.slice(0, 12));
      expect(result.scopes).toEqual(["mcp"]);
      expect(insertMock).toHaveBeenCalledTimes(1);
      expect(captured).not.toBeNull();
      // Hash is stored, not the plaintext token. SHA-256 hex is 64 chars.
      expect(captured!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(captured!.tokenHash).not.toBe(result.token);
      expect(captured!.scopes).toBe(JSON.stringify(["mcp"]));
    });

    it("rejects empty or oversized names", async () => {
      await expect(
        TokenService.create({
          userId: "u",
          organizationId: "o",
          name: "",
        }),
      ).rejects.toThrow();
      await expect(
        TokenService.create({
          userId: "u",
          organizationId: "o",
          name: "x".repeat(101),
        }),
      ).rejects.toThrow();
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe("validate", () => {
    it("returns null for malformed tokens", async () => {
      await expect(TokenService.validate("not_a_token")).resolves.toBeNull();
      await expect(TokenService.validate("op_live_")).resolves.toBeNull();
      expect(findByHashMock).not.toHaveBeenCalled();
    });

    it("returns null when no row matches", async () => {
      findByHashMock.mockResolvedValue(undefined);
      await expect(
        TokenService.validate("op_live_abcdefgh"),
      ).resolves.toBeNull();
    });

    it("returns null for expired tokens", async () => {
      findByHashMock.mockResolvedValue({
        id: "t1",
        userId: "u1",
        organizationId: "o1",
        scopes: '["mcp"]',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        revokedAt: null,
      });
      await expect(
        TokenService.validate("op_live_abcdefgh"),
      ).resolves.toBeNull();
    });

    it("returns the row for a valid token and touches lastUsed", async () => {
      findByHashMock.mockResolvedValue({
        id: "t1",
        userId: "u1",
        organizationId: "o1",
        scopes: '["mcp","api:read"]',
        expiresAt: null,
        revokedAt: null,
      });
      const result = await TokenService.validate("op_live_abcdefgh");
      expect(result).toEqual({
        id: "t1",
        userId: "u1",
        organizationId: "o1",
        scopes: ["mcp", "api:read"],
      });
      expect(touchLastUsedMock).toHaveBeenCalledWith("t1");
    });
  });

  describe("list", () => {
    it("filters out revoked tokens and parses scopes", async () => {
      listForUserMock.mockResolvedValue([
        {
          id: "t1",
          name: "active",
          tokenPrefix: "op_live_aaa",
          scopes: '["mcp"]',
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: null,
          createdAt: "2026-05-04",
        },
        {
          id: "t2",
          name: "revoked",
          tokenPrefix: "op_live_bbb",
          scopes: '["mcp"]',
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: "2026-05-03",
          createdAt: "2026-05-01",
        },
      ]);
      const result = await TokenService.list("u1", "o1");
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("t1");
    });
  });

  describe("revoke", () => {
    it("calls the repo when the token exists", async () => {
      getByIdMock.mockResolvedValue({ id: "t1", revokedAt: null });
      await TokenService.revoke({
        id: "t1",
        userId: "u1",
        organizationId: "o1",
      });
      expect(revokeMock).toHaveBeenCalledWith("t1", "u1", "o1");
    });

    it("is a no-op for already-revoked tokens", async () => {
      getByIdMock.mockResolvedValue({
        id: "t1",
        revokedAt: "2026-05-01",
      });
      await TokenService.revoke({
        id: "t1",
        userId: "u1",
        organizationId: "o1",
      });
      expect(revokeMock).not.toHaveBeenCalled();
    });

    it("throws when the token doesn't exist", async () => {
      getByIdMock.mockResolvedValue(undefined);
      await expect(
        TokenService.revoke({
          id: "missing",
          userId: "u",
          organizationId: "o",
        }),
      ).rejects.toThrow();
    });
  });
});
