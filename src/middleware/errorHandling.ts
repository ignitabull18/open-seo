import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { waitUntil } from "cloudflare:workers";
import { shouldCaptureAppErrorCode } from "@/shared/error-codes";
import { asAppError, toClientError } from "@/server/lib/errors";
import { captureServerError } from "@/server/lib/posthog";

const posthogCapturedErrors = new WeakSet<Error>();

function isPostHogCapturedError(error: Error) {
  return posthogCapturedErrors.has(error);
}

function markPostHogCapturedError(error: Error) {
  posthogCapturedErrors.add(error);
}

function getStringContextValue(context: unknown, key: string) {
  if (!context || typeof context !== "object") return undefined;

  const value: unknown = Reflect.get(context, key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getHeaderValue(request: Request, name: string) {
  const value = request.headers.get(name)?.trim();
  return value ? value : undefined;
}

function captureReportableServerError(error: Error, context: unknown) {
  const appError = asAppError(error);

  if (
    isPostHogCapturedError(error) ||
    !shouldCaptureAppErrorCode(appError?.code)
  ) {
    return;
  }

  const request = getRequest();
  const url = new URL(request.url);
  const userId = getStringContextValue(context, "userId");
  const organizationId = getStringContextValue(context, "organizationId");
  const posthogDistinctId = getHeaderValue(request, "x-posthog-distinct-id");
  const posthogSessionId = getHeaderValue(request, "x-posthog-session-id");
  const posthogWindowId = getHeaderValue(request, "x-posthog-window-id");

  markPostHogCapturedError(error);
  console.error("server.function error:", error);
  waitUntil(
    captureServerError(error, {
      distinctId: userId ?? posthogDistinctId,
      organizationId,
      properties: {
        errorCode: appError?.code ?? "INTERNAL_ERROR",
        method: request.method,
        path: url.pathname,
        ...(posthogSessionId ? { $session_id: posthogSessionId } : {}),
        ...(posthogWindowId ? { $window_id: posthogWindowId } : {}),
        ...appError?.details,
      },
    }),
  );
}

export const errorHandlingMiddleware = createMiddleware({
  type: "function",
}).server(async ({ context, next }) => {

  try {
    return await next();
  } catch (error) {
    if (!(error instanceof Error)) {
      throw new Error("INTERNAL_ERROR", { cause: error });
    }

    captureReportableServerError(error, context);

    throw toClientError(error);
  }
});

export const authenticatedErrorTrackingMiddleware = createMiddleware({
  type: "function",
}).server(async ({ context, next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof Error) {
      captureReportableServerError(error, context);
    }

    throw error;
  }
});
