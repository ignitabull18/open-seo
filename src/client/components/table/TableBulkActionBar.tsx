import { X } from "lucide-react";
import type { ReactNode } from "react";

export function TableBulkActionBar({
  selectedCount,
  selectedLabel = "selected",
  actions,
  onClear,
  placement = "fixed",
}: {
  selectedCount: number;
  selectedLabel?: string;
  actions: ReactNode;
  onClear: () => void;
  placement?: "fixed" | "inline";
}) {
  if (selectedCount === 0) return null;

  const wrapperClass =
    placement === "fixed"
      ? "pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4"
      : "flex justify-center";
  const toolbarClass =
    placement === "fixed"
      ? "pointer-events-auto flex items-stretch overflow-visible rounded-xl border border-base-content/15 bg-base-300/85 shadow-2xl backdrop-blur"
      : "flex items-stretch overflow-visible rounded-xl border border-base-content/15 bg-base-200";

  return (
    <div className={wrapperClass}>
      <div role="toolbar" aria-label="Bulk actions" className={toolbarClass}>
        <div className="flex items-center gap-2 border-r border-base-content/10 px-3 py-2 text-sm">
          <button
            type="button"
            aria-label="Clear selection"
            className="-ml-1 rounded p-1 text-base-content/55 hover:bg-base-content/10 hover:text-base-content"
            onClick={onClear}
          >
            <X className="size-3.5" />
          </button>
          <span className="font-medium tabular-nums">{selectedCount}</span>
          <span className="text-base-content/60">{selectedLabel}</span>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function TableBulkActionButton({
  icon,
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  const color =
    variant === "danger"
      ? "text-error hover:bg-error/10"
      : "text-base-content/85 hover:bg-base-content/10";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm disabled:opacity-50 ${color}`}
    >
      {icon}
      {children}
    </button>
  );
}
