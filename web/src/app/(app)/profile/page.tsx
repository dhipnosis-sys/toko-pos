import { getCurrentUser } from "@/lib/dal";
import { Card, CardHeader, Label, Input, btn, Badge } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { updateOwnProfile } from "@/app/actions/users";

const roleLabels: Record<string, string> = {
  owner: "Pemilik",
  cashier: "Kasir",
  warehouse: "Gudang",
};

export default async function ProfilePage(props: PageProps<"/profile">) {
  const profile = await getCurrentUser();

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <CardHeader
          title="Profil Saya"
          subtitle={profile.email + " · " + roleLabels[profile.role] || roleLabels[profile.role]}
        />
        <form action={updateOwnProfile} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" required>
              Nama Lengkap
            </Label>
            <Input id="name" name="name" defaultValue={profile.name} required />
          </div>
          <div>
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone || ""} placeholder="08xxxx" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <LinkBack href="/dashboard" label="Kembali" />
            <button type="submit" className={btn.primary}>
              Simpan Profil
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}