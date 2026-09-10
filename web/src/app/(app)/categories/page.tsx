import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { formatDateOnly, slugify } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteCategory } from "@/app/actions/categories";
import { SearchBox } from "@/components/SearchBox";

export default async function CategoriesPage(props: PageProps<"/categories">) {
  await getCurrentUser();
  const q = (await props.searchParams).q;
  const search = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("id, name, slug, description, created_at, products:products(count)")
    .order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  const { data: categories } = await query;

  return (
    <div>
      <PageHeader
        title="Kategori"
        subtitle="Kelompok produk untuk memudahkan pencarian dan laporan"
        action={
          <Link
            href="/categories/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Kategori
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{categories?.length || 0} kategori</p>
          <SearchBox placeholder="Cari kategori..." />
        </div>
        {!categories || categories.length === 0 ? (
          <EmptyState message={search ? "Tidak ditemukan" : "Belum ada kategori"} />
        ) : (
          <Table>
            <THead>
              <Th>Nama</Th>
              <Th>Slug</Th>
              <Th>Jumlah Produk</Th>
              <Th>Dibuat</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.description && (
                      <div className="text-xs text-gray-500 max-w-[260px] truncate">
                        {c.description}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <Badge className="bg-gray-100 text-gray-600">{slugify(c.slug)}</Badge>
                  </Td>
                  <Td>{c.products?.[0]?.count ?? 0}</Td>
                  <Td>{formatDateOnly(c.created_at)}</Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        href={"/categories/" + c.id + "/edit"}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <DeleteButton action={deleteCategory} id={c.id} />
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}