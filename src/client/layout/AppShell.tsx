import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleHelp, CreditCard, Menu, Settings, User } from "lucide-react";
import {
  AppContent,
  MissingSeoSetupModal,
  SeoApiStatusBanners,
} from "@/client/layout/AppShellParts";
import { signOutAndRedirect, useSession } from "@/lib/auth-client";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { BILLING_ROUTE } from "@/shared/billing";
import { getSeoApiKeyStatus } from "@/serverFunctions/config";
import { getOrCreateDefaultProject } from "@/serverFunctions/projects";

const DATAFORSEO_HELP_PATH = "/help/dataforseo-api-key";
const SUPPORT_PATH = "/support";

export function AuthenticatedAppLayout({
  children,
  projectId,
  banner,
}: {
  children: React.ReactNode;
  projectId?: string;
  banner?: React.ReactNode;
}) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const setupModalRef = React.useRef<HTMLDivElement | null>(null);
  const [showMissingSeoApiKeyModal, setShowMissingSeoApiKeyModal] =
    React.useState(false);
  const defaultProjectQuery = useQuery({
    queryKey: ["defaultProject"],
    queryFn: () => getOrCreateDefaultProject(),
    enabled: !projectId,
  });
  const headerProjectId = projectId ?? defaultProjectQuery.data?.id ?? null;
  const shouldCheckSeoApiKeyStatus = location.pathname !== BILLING_ROUTE;
  const seoApiKeyStatusQuery = useQuery({
    queryKey: ["seoApiKeyStatus"],
    queryFn: () => getSeoApiKeyStatus(),
    enabled: shouldCheckSeoApiKeyStatus,
  });
  const isSeoApiKeyConfigured = shouldCheckSeoApiKeyStatus
    ? (seoApiKeyStatusQuery.data?.configured ?? null)
    : null;
  const seoApiKeyStatusError =
    shouldCheckSeoApiKeyStatus && seoApiKeyStatusQuery.isError;

  React.useEffect(() => {
    if (!shouldCheckSeoApiKeyStatus) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (seoApiKeyStatusQuery.isError) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (!seoApiKeyStatusQuery.isSuccess) return;
    setShowMissingSeoApiKeyModal(!seoApiKeyStatusQuery.data.configured);
  }, [
    location.pathname,
    seoApiKeyStatusQuery.data,
    seoApiKeyStatusQuery.isError,
    seoApiKeyStatusQuery.isSuccess,
    shouldCheckSeoApiKeyStatus,
  ]);

  const shouldShowMissingSeoApiKeyModal =
    showMissingSeoApiKeyModal && location.pathname !== DATAFORSEO_HELP_PATH;

  const shouldShowSeoApiWarning =
    !seoApiKeyStatusError &&
    isSeoApiKeyConfigured === false &&
    !shouldShowMissingSeoApiKeyModal;

  React.useEffect(() => {
    if (!shouldShowMissingSeoApiKeyModal) return;

    setupModalRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMissingSeoApiKeyModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shouldShowMissingSeoApiKeyModal]);

  React.useEffect(() => {
    if (!projectId) {
      setDrawerOpen(false);
    }
  }, [projectId]);

  return (
    <div className="flex h-[100dvh] bg-base-200">
      <AppContent
        drawerOpen={drawerOpen}
        projectId={headerProjectId}
        onCloseDrawer={() => setDrawerOpen(false)}
      >
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <TopBar
            drawerOpen={drawerOpen}
            projectId={headerProjectId}
            pathname={location.pathname}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <SeoApiStatusBanners
            shouldShowSeoApiWarning={shouldShowSeoApiWarning}
            seoApiKeyStatusError={seoApiKeyStatusError}
          />

          {banner}

          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </AppContent>

      <MissingSeoSetupModal
        ref={setupModalRef}
        isOpen={shouldShowMissingSeoApiKeyModal}
        onClose={() => setShowMissingSeoApiKeyModal(false)}
      />
    </div>
  );
}

function TopBar({
  drawerOpen,
  projectId,
  pathname,
  onOpenDrawer,
}: {
  drawerOpen: boolean;
  projectId: string | null;
  pathname: string;
  onOpenDrawer: () => void;
}) {
  const isSupportActive = pathname === SUPPORT_PATH;

  return (
    <div className="navbar shrink-0 gap-2 border-b border-base-300 bg-base-100 md:min-h-14">
      <div className="flex flex-none items-center md:hidden">
        {projectId ? (
          <button
            type="button"
            className="btn btn-square btn-ghost"
            aria-label="Toggle sidebar"
            aria-expanded={drawerOpen}
            onClick={onOpenDrawer}
          >
            <Menu className="h-6 w-6" />
          </button>
        ) : null}
        <Link to="/" className="ml-1 font-semibold text-base-content">
          OpenSEO
        </Link>
      </div>

      <div className="hidden min-w-0 items-center md:flex">
        <span className="px-1 text-sm font-medium text-base-content/55">
          Workspace
        </span>
      </div>

      <div className="flex-1" />

      <div className="hidden flex-none items-center gap-2 md:flex">
        <div className="tooltip tooltip-bottom" data-tip="Help & Community">
          <Link
            to={SUPPORT_PATH}
            className={`btn btn-ghost btn-circle btn-sm ${
              isSupportActive
                ? "bg-primary/10 text-primary"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <CircleHelp className="h-4 w-4" />
          </Link>
        </div>

        <AccountMenu />
      </div>

      <AccountMenu mobileOnly />
    </div>
  );
}

function AccountMenu({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const { data: session } = useSession();
  const isHostedMode = isHostedClientAuthMode();
  const email = session?.user?.email;

  const handleSignOut = () => signOutAndRedirect();

  const menu = (
    <div className={mobileOnly ? "ml-2 flex-none md:hidden" : "flex-none"}>
      <div className="dropdown dropdown-end">
        <button
          type="button"
          tabIndex={0}
          className={`btn btn-ghost btn-circle ${mobileOnly ? "" : "hover:bg-base-200/80"}`}
          aria-label="Open account menu"
        >
          <User className="h-5 w-5" />
        </button>
        <ul
          tabIndex={0}
          className="dropdown-content z-20 menu mt-3 min-w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
        >
          {email ? (
            <li className="menu-title max-w-full">
              <span className="truncate text-base-content" data-ph-mask>
                {email}
              </span>
            </li>
          ) : null}
          {mobileOnly ? (
            <li>
              <Link to={SUPPORT_PATH} className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4" />
                Help & Community
              </Link>
            </li>
          ) : null}
          {isHostedMode ? (
            <li>
              <a href={BILLING_ROUTE} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </a>
            </li>
          ) : null}
          <li>
            <Link to="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </li>
          {isHostedMode && email ? (
            <li>
              <button
                type="button"
                className="text-error"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );

  if (mobileOnly) {
    return menu;
  }

  return (
    <>
      <div className="mx-1 h-6 w-px bg-base-300" />
      {menu}
    </>
  );
}
