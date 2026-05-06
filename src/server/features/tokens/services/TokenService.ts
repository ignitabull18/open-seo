import { TokenRepository } from "@/server/features/tokens/repositories/TokenRepository";
import { AppError } from "@/server/lib/errors";

const TOKEN_PREFIX = "op_live_";
const RANDOM_BYTES = 32;
const PREVIEW_LENGTH = 12;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const random = new Uint8Array(RANDOM_BYTES);
  crypto.getRandomValues(random);
  return TOKEN_PREFIX + bytesToBase64Url(random);
}

function isValidTokenShape(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length;
}

type CreatedToken = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  // Plaintext token, only returned at creation time.
  token: string;
};

type ListedToken = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type ValidatedToken = {
  id: string;
  userId: string;
  organizationId: string;
  scopes: string[];
};

async function create(input: {
  userId: string;
  organizationId: string;
  name: string;
}): Promise<CreatedToken> {
  const trimmedName = input.name.trim();
  if (trimmedName.length === 0 || trimmedName.length > 100) {
    throw new AppError("VALIDATION_ERROR");
  }

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const tokenPrefix = token.slice(0, PREVIEW_LENGTH);
  const id = crypto.randomUUID();
  const scopes = ["mcp"] as const;

  await TokenRepository.insert({
    id,
    userId: input.userId,
    organizationId: input.organizationId,
    name: trimmedName,
    tokenHash,
    tokenPrefix,
    scopes: JSON.stringify(scopes),
  });

  return {
    id,
    name: trimmedName,
    prefix: tokenPrefix,
    scopes: [...scopes],
    createdAt: new Date().toISOString(),
    token,
  };
}

function parseScopes(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

async function list(
  userId: string,
  organizationId: string,
): Promise<ListedToken[]> {
  const rows = await TokenRepository.listForUser(userId, organizationId);
  return rows
    .filter((row) => row.revokedAt == null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.tokenPrefix,
      scopes: parseScopes(row.scopes),
      lastUsedAt: row.lastUsedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    }));
}

async function revoke(input: {
  id: string;
  userId: string;
  organizationId: string;
}) {
  const existing = await TokenRepository.getById(
    input.id,
    input.userId,
    input.organizationId,
  );
  if (!existing) {
    throw new AppError("NOT_FOUND");
  }
  if (existing.revokedAt != null) {
    return; // already revoked, idempotent
  }
  await TokenRepository.revoke(input.id, input.userId, input.organizationId);
}

async function validate(token: string): Promise<ValidatedToken | null> {
  if (!isValidTokenShape(token)) return null;
  const tokenHash = await sha256Hex(token);
  const row = await TokenRepository.findByHash(tokenHash);
  if (!row) return null;
  if (row.expiresAt != null && new Date(row.expiresAt) < new Date()) {
    return null;
  }
  // Best-effort touch — don't await failure path since the validate call
  // shouldn't fail on a write hiccup. (Background-write debouncing could be
  // added later via KV if D1 write volume becomes a concern.)
  void TokenRepository.touchLastUsed(row.id);

  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    scopes: parseScopes(row.scopes),
  };
}

export const TokenService = {
  create,
  list,
  revoke,
  validate,
} as const;
