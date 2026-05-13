import {
  ChevronDown,
  Copy,
  Download,
  FileDown,
  Loader2,
  Sheet,
  Tags,
  Trash2,
} from "lucide-react";
import {
  TableBulkActionBar,
  TableBulkActionButton,
} from "@/client/components/table/TableBulkActionBar";

export function SavedKeywordsBulkActionBar({
  selectedCount,
  onCopy,
  onOpenTags,
  onExportCsv,
  onExportSheets,
  onDelete,
  onClear,
  exportingSelection,
}: {
  selectedCount: number;
  onCopy: () => void;
  onOpenTags: () => void;
  onExportCsv: () => void;
  onExportSheets: () => void;
  onDelete: () => void;
  onClear: () => void;
  exportingSelection: "csv" | "sheets" | null;
}) {
  if (selectedCount === 0) return null;
  const exportBusy = exportingSelection != null;

  return (
    <TableBulkActionBar
      selectedCount={selectedCount}
      onClear={onClear}
      actions={
        <>
          <div className="flex items-center gap-0.5 px-1.5">
            <TableBulkActionButton
              icon={<Tags className="size-3.5" />}
              onClick={onOpenTags}
            >
              Tag
            </TableBulkActionButton>

            <div className="dropdown dropdown-top dropdown-end">
              <button
                type="button"
                tabIndex={0}
                disabled={exportBusy}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-base-content/85 hover:bg-base-content/10 disabled:opacity-50"
              >
                {exportBusy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Export
                <ChevronDown className="size-3 opacity-60" />
              </button>
              <ul
                tabIndex={0}
                role="menu"
                className="dropdown-content menu z-10 mb-2 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
              >
                <li>
                  <button type="button" onClick={onCopy}>
                    <Copy className="size-4" />
                    Copy keywords
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onExportSheets}
                    disabled={exportBusy}
                  >
                    <Sheet className="size-4" />
                    Export to Sheets
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onExportCsv}
                    disabled={exportBusy}
                  >
                    <FileDown className="size-4" />
                    Export CSV
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center border-l border-base-content/10 px-1.5">
            <TableBulkActionButton
              icon={<Trash2 className="size-3.5" />}
              onClick={onDelete}
              variant="danger"
            >
              Delete
            </TableBulkActionButton>
          </div>
        </>
      }
    />
  );
}
