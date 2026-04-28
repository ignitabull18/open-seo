import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAnalyticsOptOutStatus,
  setAnalyticsOptOutStatus,
} from "@/client/lib/posthog";
import { isHostedClientAuthMode } from "@/lib/auth-mode";

export const Route = createFileRoute("/_app/settings")({
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
      throw notFound();
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const [isOptedOut, setIsOptedOut] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreference() {
      const status = await getAnalyticsOptOutStatus();
      if (cancelled) return;

      if (status === null) {
        setIsUnavailable(true);
      } else {
        setIsOptedOut(status);
      }
      setIsLoading(false);
    }

    void loadPreference();

    return () => {
      cancelled = true;
    };
  }, []);

  const analyticsEnabled = isOptedOut === false;

  async function updateAnalyticsPreference(enabled: boolean) {
    setIsSaving(true);
    try {
      const status = await setAnalyticsOptOutStatus(!enabled);
      if (status === null) {
        setIsUnavailable(true);
        toast.error("Analytics settings are unavailable right now.");
      } else {
        setIsOptedOut(status);
        toast.success(enabled ? "Analytics enabled" : "Analytics disabled");
      }
    } catch {
      toast.error("We couldn't update your analytics setting.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-base-content/40">Settings</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Privacy controls
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            Control optional product analytics for this browser.
          </p>
        </div>

        <section className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Product analytics</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Help us improve hosted OpenSEO with PostHog analytics, error
                  monitoring, and session replay. Form inputs are masked before
                  recording.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 self-start">
              <span className="text-sm font-medium text-base-content/70">
                {analyticsEnabled ? "On" : "Off"}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={analyticsEnabled}
                disabled={isLoading || isSaving || isUnavailable}
                onChange={(event) => {
                  void updateAnalyticsPreference(event.currentTarget.checked);
                }}
                aria-label="Enable product analytics"
              />
            </label>
          </div>

          <div className="mt-5 rounded-lg bg-base-200/70 px-4 py-3 text-sm text-base-content/60">
            {isUnavailable ? (
              <p>
                Analytics is not configured for this deployment, so there is
                nothing to disable.
              </p>
            ) : (
              <p>
                This opt-out is stored on this browser. If you use OpenSEO from
                another browser or device, update the setting there too.
              </p>
            )}
          </div>
        </section>

        <p className="text-sm text-base-content/50">
          Read the hosted service privacy policy at{" "}
          <a
            href="https://openseo.so/privacy"
            className="link link-hover text-base-content"
          >
            openseo.so/privacy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
