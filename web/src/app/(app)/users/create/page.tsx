import { requireRole } from "@/lib/dal";
import { Card, CardHeader, Label, Input, Select, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { createUser } from "@/app/actions/users";

export default async function CreateUserPage(props: PageProps<"/users/create">) {
  await requireRole("owner");

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <CardHeader title="Tambah Pengguna" subtitle="Password otomatis dikonfirmasi (tanpa email verifikasi)" />
        <form action={createUser} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" required>
              Nama Lengkap
            </Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email" required>
              Email (username login)
            </Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password" required>
              Password (min. 6 karakter)
            </Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue="cashier">
                <option value="cashier">Kasir</option>
                <option value="warehouse">Gudang</option>
                <option value="owner">Pemilik</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              Akun aktif
            </label>
          </div>
          <div className="flex items-center justify-between pt-2">
            <LinkBack href="/users" />
            <button type="submit" className={btn.primary}>
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}