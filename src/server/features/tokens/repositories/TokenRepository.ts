import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { mcpTokens } from "@/db/schema";

type TokenRow = typeof mcpTokens.$inferSelect;

async function findByHash(tokenHash: string): Promise<TokenRow | undefined> {
  return db.query.mcpTokens.findFirst({
    where: and(eq(mcpTokens.tokenHash, tokenHash), isNull(mcpTokens.revokedAt)),
  });
}

async function listForUser(userId: string, organizationId: string) {
  return db.query.mcpTokens.findMany({
    where: and(
      eq(mcpTokens.userId, userId),
      eq(mcpTokens.organizationId, organizationId),
    ),
    orderBy: desc(mcpTokens.createdAt),
  });
}

async function getById(
  id: string,
  userId: string,
  organizationId: string,
): Promise<TokenRow | undefined> {
  return db.query.mcpTokens.findFirst({
    where: and(
      eq(mcpTokens.id, id),
      eq(mcpTokens.userId, userId),
      eq(mcpTokens.organizationId, organizationId),
    ),
  });
}

async function insert(row: {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  scopes: string;
}) {
  await db.insert(mcpTokens).values(row);
}

async function revoke(id: string, userId: string, organizationId: string) {
  await db
    .update(mcpTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(mcpTokens.id, id),
        eq(mcpTokens.userId, userId),
        eq(mcpTokens.organizationId, organizationId),
      ),
    );
}

async function touchLastUsed(id: string) {
  await db
    .update(mcpTokens)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(mcpTokens.id, id));
}

export const TokenRepository = {
  findByHash,
  listForUser,
  getById,
  insert,
  revoke,
  touchLastUsed,
} as const;
