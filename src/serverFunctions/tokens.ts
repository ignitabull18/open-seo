import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TokenService } from "@/server/features/tokens/services/TokenService";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";

export const listMcpTokens = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) =>
    TokenService.list(context.userId, context.organizationId),
  );

export const createMcpToken = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .inputValidator((data: unknown) =>
    z.object({ name: z.string().min(1).max(100) }).parse(data),
  )
  .handler(async ({ data, context }) =>
    TokenService.create({
      userId: context.userId,
      organizationId: context.organizationId,
      name: data.name,
    }),
  );

export const revokeMcpToken = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await TokenService.revoke({
      id: data.id,
      userId: context.userId,
      organizationId: context.organizationId,
    });
    return { success: true };
  });
