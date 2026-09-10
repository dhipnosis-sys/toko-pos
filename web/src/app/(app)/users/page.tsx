import Link from "next/link";
import { formatDateOnly } from "@/lib/utils";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteUser } from "@/app/actions/users";

const roleLabels: Record<string, string> = {
  owner: "Pemilik",
  cashier: "Kasir",
  warehouse: "Gudang",
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700",
  cashier: "bg-emerald-100 text-emerald-700",
  warehouse: "bg-sky-100 text-sky-700",
};

export default async function UsersPage(props: PageProps<"/users">) {
  const current = await requireRole("owner");
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, email, role, phone, is_active, created_at")
    .order("name");

  return (
    <div>
      <PageHeader
        title="Pengguna"
        subtitle="Kelola akun staf toko"
        action={
          <Link
            href="/users/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Pengguna
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />

      <Card>
        {!users || users.length === 0 ? (
          <EmptyState message="Belum ada pengguna" />
        ) : (
          <Table>
            <THead>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Telepon</Th>
              <Th>Status</Th>
              <Th>Bergabung</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <Td>
                    <span className="font-medium text-gray-900">{u.name}</span>
                    {u.id === current.id && (
                      <span className="ml-1.5 text-xs text-gray-400">(Anda)</span>
                    )}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge className={roleColors[u.role] || "bg-gray-100 text-gray-600"}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </Td>
                  <Td>{u.phone || "-"}</Td>
                  <Td>
                    {u.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-600">Nonaktif</Badge>
                    )}
                  </Td>
                  <Td>{formatDateOnly(u.created_at)}</Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        href={"/users/" + u.id + "/edit"}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      {u.id !== current.id && (
                        <DeleteButton action={deleteUser} id={u.id} confirmText="Hapus?" />
                      )}
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