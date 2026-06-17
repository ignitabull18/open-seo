import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, CircleHelp, Plug, Settings, X } from "lucide-react";
import { getProjectNavGroups } from "@/client/navigation/items";

interface SidebarProps {
  projectId: string;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ projectId, onNavigate, onClose }: SidebarProps) {
  const navGroups = getProjectNavGroups(projectId);
  const navLinkClass =
    "group relative mx-2 flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-base-200 hover:text-base-content";
  const navLinkActiveClass =
    "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]";

  return (
    <div className="sidebar flex h-full w-64 flex-col border-r border-base-300 bg-base-100">
      {/* Header */}
      <div className="flex min-h-14 items-center justify-between border-b border-base-300 px-4">
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-base-content">
            OpenSEO
          </span>
          <span className="block truncate text-xs text-base-content/45">
            Search intelligence
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle shrink-0"
            aria-label="Close sidebar"
          >
            <X className="size-4.5" />
          </button>
        )}
      </div>

      {/* Project picker */}
      <div className="border-b border-base-300 px-3 py-3">
        <div
          className="tooltip tooltip-bottom w-full"
          data-tip="Multiple projects coming soon"
        >
          <button
            type="button"
            className="flex min-h-11 w-full cursor-default items-center justify-between gap-3 rounded-lg border border-base-300 bg-base-200/50 px-3 py-2 text-left transition-colors hover:bg-base-200"
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium uppercase tracking-wide text-base-content/40">
                Project
              </span>
              <span className="block truncate text-sm font-semibold text-base-content">
                Default
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-base-content/35" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map((entry) => {
          if (entry.type === "standalone") {
            const { icon: Icon, ...linkProps } = entry.item;
            return (
              <Link
                key={linkProps.to}
                {...linkProps}
                onClick={onNavigate}
                activeOptions={{ exact: false, includeSearch: false }}
                className={navLinkClass}
                activeProps={{ className: navLinkActiveClass }}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive ? (
                      <div className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-primary" />
                    ) : null}
                    <Icon
                      className={`size-4.5 shrink-0 ${isActive ? "text-primary" : "text-base-content/45 group-hover:text-base-content/70"}`}
                    />
                    <span className="truncate">{entry.item.label}</span>
                  </>
                )}
              </Link>
            );
          }

          return (
            <div key={entry.label} className="mb-2">
              <div className="px-4 pb-1.5 pt-3 text-[0.68rem] font-semibold uppercase tracking-wide text-base-content/40">
                {entry.label}
              </div>
              {entry.items.map((item) => {
                const { icon: Icon, ...linkProps } = item;
                return (
                  <Link
                    key={linkProps.to}
                    {...linkProps}
                    onClick={onNavigate}
                    activeOptions={{ exact: false, includeSearch: false }}
                    className={navLinkClass}
                    activeProps={{ className: navLinkActiveClass }}
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <>
                        {isActive ? (
                          <div className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-primary" />
                        ) : null}
                        <Icon
                          className={`size-4.5 shrink-0 ${isActive ? "text-primary" : "text-base-content/45 group-hover:text-base-content/70"}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-base-300 px-2 py-2">
        <Link
          to="/tools"
          onClick={onNavigate}
          activeOptions={{ exact: false, includeSearch: false }}
          className="group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-base-content/55 transition-colors hover:bg-base-200 hover:text-base-content"
          activeProps={{ className: "bg-base-200 text-base-content" }}
        >
          <Plug className="size-4.5 shrink-0 text-base-content/45 group-hover:text-base-content/70" />
          <span className="truncate">Connected tools</span>
        </Link>
        <Link
          to="/support"
          onClick={onNavigate}
          activeOptions={{ exact: false, includeSearch: false }}
          className="group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-base-content/55 transition-colors hover:bg-base-200 hover:text-base-content"
          activeProps={{ className: "bg-base-200 text-base-content" }}
        >
          <CircleHelp className="size-4.5 shrink-0 text-base-content/45 group-hover:text-base-content/70" />
          <span className="truncate">Support</span>
        </Link>
        <Link
          to="/settings"
          onClick={onNavigate}
          activeOptions={{ exact: false, includeSearch: false }}
          className="group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-base-content/55 transition-colors hover:bg-base-200 hover:text-base-content"
          activeProps={{ className: "bg-base-200 text-base-content" }}
        >
          <Settings className="size-4.5 shrink-0 text-base-content/45 group-hover:text-base-content/70" />
          <span className="truncate">Settings</span>
        </Link>
      </div>
    </div>
  );
}
