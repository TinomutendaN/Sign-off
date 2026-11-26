import Image from "next/image";
import { FileIcon } from "@/components/icons";
import { cx } from "@/components/ui/cx";
import { fileSize } from "@/lib/format";

const IMAGE_FILE = /\.(png|jpe?g|webp|gif)$/i;

type FilePreviewProps = {
  title: string;
  fileName: string;
  fileUrl: string;
  size: number;
  /** A picture to show instead of the file (the seeded Homepage v2 illustration). */
  previewUrl?: string | null;
  /** "large" fills the client project view's preview box; "thumb" is Client home's 120×80. */
  variant?: "large" | "thumb";
};

/**
 * What the client sees of a deliverable, in the soft-grey #F5F5F9 box: the preview picture if
 * there is one, an image file as itself, or else (PDF, zip) a file tile with its type and size.
 */
export function FilePreview({ title, fileName, fileUrl, size, previewUrl, variant = "large" }: FilePreviewProps) {
  const picture = previewUrl ?? (IMAGE_FILE.test(fileName) ? fileUrl : null);
  const thumb = variant === "thumb";
  const box = thumb
    ? "flex h-20 w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-control bg-soft p-2"
    : "flex min-w-0 flex-[1_1_300px] flex-col rounded-control bg-soft p-[14px]";

  if (picture) {
    return (
      <div className={box}>
        <Image
          src={picture}
          alt={`Preview of ${title}`}
          width={600}
          height={388}
          unoptimized
          className={cx(
            "object-contain",
            thumb ? "h-full w-full" : "h-auto max-h-[440px] w-full rounded-lg",
          )}
        />
      </div>
    );
  }

  const ext = (/\.([a-z0-9]+)$/i.exec(fileName)?.[1] ?? "file").toUpperCase();

  if (thumb) {
    return (
      <div className={box} role="img" aria-label={`${ext} file: ${fileName}`}>
        <span className="flex flex-col items-center gap-1.5 text-muted">
          <FileIcon size={26} />
          <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-ink-3">{ext}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cx(box, "items-center justify-center gap-3 py-10 text-center")}>
      <span className="flex size-16 items-center justify-center rounded-card bg-card text-violet-icon shadow-card">
        <FileIcon size={30} />
      </span>
      <span className="rounded-full bg-violet-tint px-2 py-[3px] text-[11px] font-semibold text-violet-ink">{ext}</span>
      <span className="flex max-w-full flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-ink">{fileName}</span>
        <span className="text-xs text-muted">{fileSize(size)}</span>
      </span>
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium">
        Open file
      </a>
    </div>
  );
}
