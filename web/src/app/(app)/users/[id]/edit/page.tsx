import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Label, Input, Select, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { updateUser } from "@/app/actions/users";

export default async function EditUserPage(props: PageProps<"/users/[id]/edit">) {
  await requireRole("owner");
  const { id } = await props.params;
  const userId = String(id);
  if (!userId) notFound();

  const supabase = await createClient();
  const { data: user } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!user) notFound();

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <CardHeader title="Edit Pengguna" subtitle="Kosongkan password untuk membiarkannya tidak berubah" />
        <form action={updateUser.bind(null, userId)} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" required>
              Nama Lengkap
            </Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled className="opacity-60" />
            <p className="mt-1 text-xs text-gray-400">Email tidak bisa diubah dari sini.</p>
          </div>
          <div>
            <Label htmlFor="password">Password Baru (opsional)</Label>
            <Input id="password" name="password" type="password" minLength={6} placeholder="kosongkan jika tidak diganti" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue={user.role}>
                <option value="cashier">Kasir</option>
                <option value="warehouse">Gudang</option>
                <option value="owner">Pemilik</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input id="phone" name="phone" defaultValue={user.phone || ""} />
            </div>
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={user.is_active}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Akun aktif
            </label>
          </div>
          <div className="flex items-center justify-between pt-2">
            <LinkBack href="/users" />
            <button type="submit" className={btn.primary}>
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}