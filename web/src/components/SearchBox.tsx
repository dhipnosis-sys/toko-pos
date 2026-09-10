import { Input } from "@/components/ui";

export function SearchBox({
  placeholder = "Cari...",
  defaultValue,
}: {
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <form method="GET" className="w-full max-w-xs">
      <Input
        type="search"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="py-1.5 text-sm"
      />
    </form>
  );
}