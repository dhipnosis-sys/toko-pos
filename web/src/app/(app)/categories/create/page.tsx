import { requireRole } from "@/lib/dal";
import { Card, Label, Input, Textarea, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { createCategory } from "@/app/actions/categories";

export default async function CreateCategoryPage(props: PageProps<"/categories/create">) {
  await requireRole(["owner", "warehouse"]);

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <form action={createCategory} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" required>
              Nama Kategori
            </Label>
            <Input id="name" name="name" placeholder="contoh: Minuman" required />
          </div>
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Keterangan singkat (opsional)"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <LinkBack href="/categories" />
            <button type="submit" className={btn.primary}>
              Simpan Kategori
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}