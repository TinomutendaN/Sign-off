import { SearchIcon } from "@/components/icons";

export function SideSearch({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex items-center gap-2 rounded-control px-[10px] py-2 text-[13px] text-muted">
      <SearchIcon />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder.replace("…", "")}
        className="w-full border-0 bg-transparent text-ink outline-none placeholder:text-muted"
      />
    </label>
  );
}
