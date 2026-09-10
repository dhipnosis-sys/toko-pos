import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, Label, Input, Textarea, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { updateCategory } from "@/app/actions/categories";

export default async function EditCategoryPage(props: PageProps<"/categories/[id]/edit">) {
  await requireRole(["owner", "warehouse"]);
  const { id } = await props.params;
  const categoryId = Number(id);
  if (Number.isNaN(categoryId)) notFound();

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();
  if (!category) notFound();

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <form action={updateCategory.bind(null, categoryId)} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" required>
              Nama Kategori
            </Label>
            <Input id="name" name="name" defaultValue={category.name} required />
          </div>
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={category.description || ""}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <LinkBack href="/categories" />
            <button type="submit" className={btn.primary}>
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}