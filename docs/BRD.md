# BRD — Sistem POS & Inventori "Warung Nuhahade"

| | |
|---|---|
| **Dokumen** | Business Requirements Document (BRD) |
| **Produk** | Sistem Point of Sale (POS) & Inventori Toko |
| **Persiapan Status** | Dasar pembahasan & pengembangan berikutnya |
| **Sumber** | Dihasilkan dari implementasi aktual di repositori `Toko` (Laravel → Next.js + Supabase) |
| **Bahasa Produk** | Bahasa Indonesia |

---

## 1. Ringkasan Eksekutif

Sistem POS & Inventori yang dipakai toko untuk menjalankan operasional harian:

1. **Kasir** mencatat penjualan cepat (barcode / tombol / papan nomor), menghitung kembalian, mencetak struk, mencatat piutang pelanggan, dan memantau stok menipis.
2. **Staf Gudang** mengelola produk, kategori, supplier, pembelian stok, resep (BOM), dan produksi barang jadi.
3. **Owner/Pemilik** melihat ringkasan omzet, laporan penjualan, produk terlaris, hutang–piutang, riwayat harga beli per supplier, serta mengelola pengguna, pengaturan toko, dan harga.

Sasaran jangka panjang: **satu sumber data (single source of truth)** untuk penjualan, stok, dan modal, sehingga pemilik bisa mengukur keuntungan dan membuat keputusan pembelian yang lebih tepat.

---

## 2. Latar Belakang & Tujuan Bisnis

### 2.1 Masalah
- Perhitungan untung masih manual; harga modal antar-supplier sulit dilacak.
- Data penjualan, hutang pelanggan, dan hutang supplier tersebar / tidak tercatat sistematis.
- Stok tidak terpantau → risiko kehabisan barang (stockout) atau barang menumpuk.

### 2.2 Tujuan
1. Mempercepat proses checkout & pencatatan transaksi (struk otomatis).
2. Menjaga **stok akurat & real-time** dengan peringatan stok menipis.
3. Menyediakan **harga modal otomatis (rata-rata tertimbang)** dan **riwayat harga per supplier** agar untung terukur.
4. Mengelola **piutang pelanggan & hutang supplier** dalam satu tempat.
5. Memberi **laporan omzet, produk terlaris, dan metode pembayaran** untuk pengambilan keputusan.
6. Mendukung **produksi barang jadi** dari bahan baku (BOM) dengan kalkulasi HPP & harga jual saran.

---

## 3. Lingkup (In-Scope)

| Kode | Modul | Deskripsi |
|---|---|---|
| M-01 | Autentikasi & Profil | Register/login, keluar, ubah profil & sandi |
| M-02 | Dashboard | Ringkasan omzet, transaksi, grafik 30 hari, stok menipis, penjualan terbaru |
| M-03 | Master Produk | CRUD produk, kategori, satuan, barcode, stok, harga tiers, status aktif |
| M-04 | Master Pelanggan | CRUD pelanggan, total pembelian, bayar, saldo piutang |
| M-05 | Master Supplier | CRUD supplier, total pembelian, total hutang, pembayaran hutang |
| M-06 | POS (Kasir) | Cari/barcode produk, keranjang, harga per tier, diskon, pembayaran, kembalian, struk |
| M-07 | Penjualan | Riwayat penjualan, detail, cetak/pajang struk |
| M-08 | Pembelian | Catat pembelian stok + harga modal, stok bertambah otomatis |
| M-09 | Riwayat Harga | Tracking harga beli per produk & per supplier, ringkasan harga terakhir + termurah |
| M-10 | BOM & Produksi | Resep barang jadi, perencanaan produksi, pemakaian bahan, terapkan HPP |
| M-11 | Laporan | Omzet (hari/bulan/30 hari), grafik, metode pembayaran, produk terlaris, hutang–piutang |
| M-12 | Pengaturan & Pengguna | Identitas toko (struk), tarif pajak, manajemen pengguna & peran |
| M-13 | Penjualan Digital | Token listrik, tagihan pascabayar, penarikan Dana & layanan lain; jenis extensible, biaya admin, saldo modal per jenis (top-up Owner), keuntungan = admin − modal |

---

## 4. Peran & Hak Akses

| Peran | Hak utama |
|---|---|
| **Owner** | Semua menu + pengaturan toko + manajemen pengguna |
| **Kasir** | Dashboard, POS, penjualan, pelanggan, laporan penjualan |
| **Staf Gudang (Warehouse)** | Produk, kategori, supplier, pembelian, BOM, produksi, riwayat harga |

Aturan: **pengguna pertama** yang terdaftar otomatis menjadi **Owner**; pengguna berikutnya default **Kasir** dan perannya bisa diubah Owner. Akun dinonaktifkan tidak bisa login.

---

## 5. Kebutuhan Fungsional

### M-01 Autentikasi & Profil
- **FR-01** Pengguna dapat mendaftar (nama, email, sandi) dan login.
- **FR-02** Pengguna pertama = Owner; berikutnya Kasir (lihat BR-04).
- **FR-03** Pengguna dapat mengubah profil (nama, email, sandi) di menu Profil.
- **FR-04** Halaman login & register menampilkan logo toko.

### M-02 Dashboard
- **FR-05** Menampilkan: omzet hari ini, omzet 30 hari, jumlah transaksi hari ini, jumlah stok menipis.
- **FR-06** Grafik omzet 30 hari terakhir.
- **FR-07** Daftar 6 produk paling menipis dan 8 penjualan terbaru.
- **FR-08** Tombol pintas "Buat Penjualan".

### M-03 Master Produk & Kategori
- **FR-09** CRUD kategori (soft delete / cek pemakaian).
- **FR-10** CRUD produk: nama, SKU, barcode, kategori, satuan, stok & stok minimal, harga modal, harga retail/grosir/reseller, status aktif.
- **FR-11** Filter produk: pencarian (nama/SKU/barcode), kategori, status, stok menipis.
- **FR-12** Kolom margin otomatis = harga retail − harga modal (rata-rata).
- **FR-13** Tautan "Riwayat Harga" per produk.

### M-04 Pelanggan
- **FR-14** CRUD pelanggan (nama, kontak, alamat).
- **FR-15** Rekap per pelanggan: total pembelian, total bayar, saldo piutang (di-update otomatis saat transaksi).
- **FR-49** **Catat pembayaran piutang**: kasir/owner mencatat pelunasan (jumlah, metode, catatan) → `total_paid` naik, `total_debt` turun (tidak diizinkan negatif), tersimpan di `payments` (`payable_type='customer'`).
- **FR-50** Detail pelanggan menampilkan pembayaran **saat transaksi** & **pelunasan piutang** secara terpisah; tombol "Bayar Piutang" muncul bila sisa piutang > 0; daftar pelanggan punya tombol "Bayar" untuk yang berpiutang.

### M-05 Supplier
- **FR-16** CRUD supplier (nama, kontak, alamat).
- **FR-17** Rekap: total pembelian, total hutang (bertambah saat pembelian).
- **FR-18** Pembayaran hutang dengan metode pembayaran; saldo hutang berkurang otomatis.

### M-06 POS (Kasir)
- **FR-19** Pilih produk via pencarian atau scanner barcode.
- **FR-20** Barang multi-satuan (pcs/pack/box) dan harga mengikuti tier yang dipilih (retail/grosir/reseller).
- **FR-21** Keranjang: ubah qty, harga, hapus item, hitung subtotal.
- **FR-22** Diskon per transaksi (tidak melebihi subtotal).
- **FR-23** Metode pembayaran: Tunai, Transfer, QRIS, E-Wallet, Kredit, Debit, Piutang.
- **FR-24** Hitung kembalian otomatis; pembayaran kurang dari total → otomatis jadi piutang pelanggan.
- **FR-25** Persistensi atomik: stok berkurang & semua detail tersimpan dalam satu transaksi DB (tidak boleh stok minus).
- **FR-26** Struk dicetak (browser print) dengan identitas toko & footer dari Pengaturan.
- **FR-51** **Tambah pelanggan cepat dari POS**: kasir membuat pelanggan baru (nama wajib + telepon opsional) tepat di langkah pembayaran; pelanggan baru langsung terpilih.
- **FR-52** **Pembeda pelanggan**: dropdown POS menampilkan nama + pengenal (telepon/kota/alamat) agar nama sama tapi orang berbeda tidak tertukar.

### M-07 Penjualan
- **FR-27** Daftar penjualan (cari no. invoice, filter status, urut terbaru).
- **FR-28** Detail penjualan: item, harga satuan, modal (snapshot saat transaksi), subtotal, diskon, total, pembayaran, status.
- **FR-29** Cetak ulang struk.

### M-08 Pembelian
- **FR-30** Catat pembelian: supplier (opsional), item (produk, qty, harga modal), catatan.
- **FR-31** Stok otomatis bertambah; hutang supplier bertambah (bila ada supplier).
- **FR-32** **BR-08**: harga modal produk di-update menjadi rata-rata tertimbang.
- **FR-33** Daftar & detail pembelian (no. invoice, status, total).

### M-09 Riwayat Harga
- **FR-34** Tabel riwayat harga beli: tanggal, produk, supplier, invoice, qty, harga/unit, total.
- **FR-35** Filter berdasarkan produk dan/atau supplier.
- **FR-36** Ringkasan "harga terakhir per supplier" untuk produk terpilih, dengan penanda supplier **termurah**.

### M-10 BOM & Produksi
- **FR-37** Resep barang jadi: item bahan (produk + kuantitas), biaya tenaga, biaya overhead.
- **FR-38** Kalkulasi HPP otomatis & harga jual saran (profit % atau nominal).
- **FR-39** Order produksi: status rencana → proses → selesai.
- **FR-40** Proses produksi: bahan baku dikurangi, barang jadi ditambahkan, HPP per unit dihitung.
- **FR-41** Setelah selesai, terapkan HPP ke harga modal produk (opsional, satu kali).

### M-11 Laporan
- **FR-42** Omzet: hari ini, bulan ini, 30 hari; grafik 30 hari; transaksi terbaru.
- **FR-43** Metode pembayaran bulan ini (distribusi & proporsi).
- **FR-44** Produk terlaris 30 hari (qty & revenue).
- **FR-45** Piutang pelanggan & hutang supplier, dengan tautan "Bayar" untuk supplier.

### M-12 Pengaturan & Pengguna
- **FR-46** Pengaturan toko: nama, alamat, telepon, email, tarif pajak, mata uang, footer struk.
- **FR-47** Manajemen pengguna: daftar, ubah peran, aktif/nonaktif, hapus.
- **FR-48** Kamu tidak dapat menghapus akun sendiri.

### M-13 Penjualan Digital
- **FR-53** Katalog **jenis layanan extensible** (Token Listrik PLN, PLN Pascabayar, Penarikan Dana sebagai contoh); Owner dapat tambah/edit/aktif-nonaktifkan jenis (`digital_types`).
- **FR-54** Setiap jenis punya **saldo modal** sendiri; Owner melakukan **top-up modal** (tercatat di buku kas `digital_balance_movements`).
- **FR-55** Catat transaksi digital (Owner & Kasir): jenis, nomor/ID pelanggan, nominal, **biaya admin**, **biaya modal**, metode bayar, catatan → auto invoice `DIG-...`.
- **FR-56** Perbedaan per jenis: **memotong saldo modal** (token, pascabayar) vs **tidak memotong** (cashout) lewat flag `reduces_balance`.
- **FR-57** Halaman Digital: stat omzet & keuntungan admin (hari/bulan), ringkasan saldo per jenis, filter jenis pada riwayat.

---

## 6. Aturan Bisnis (Business Rules)

| Kode | Aturan |
|---|---|
| BR-01 | Seluruh nilai uang disimpan sebagai **integer rupiah** (bukan float) untuk menghindari kesalahan pembulatan. |
| BR-02 | Satuan produk hanya: `pcs`, `pack`, `box`. |
| BR-03 | Tiga jenjang harga: `retail_price`, `wholesale_price`, `reseller_price`. |
| BR-04 | Pengguna pertama yang mendaftar menjadi **owner**; lainnya `cashier` sampai diubah Owner. Default user baru dari halaman Users = `cashier`. |
| BR-05 | Margin produk = `retail_price − cost_price`. |
| BR-06 | Diskon maksimal = subtotal (tidak boleh negatif). |
| BR-07 | Uang yang dibayar < total → selisih otomatis tercatat sebagai **piutang pelanggan**; > total → **kembalian**. |
| BR-08 | **Harga modal (cost_price)** diperbarui dengan **rata-rata tertimbang** setiap pembelian: `(modal_lama × stok_lama + harga_baru × qty) / (stok_lama + qty)`. Bila stok kosong → pakai harga beli terbaru. |
| BR-09 | Pembelian ke supplier menambah **total hutang** supplier; pembayaran hutang mengurangi. |
| BR-10 | Stok tidak boleh minus; transaksi dijalankan atomik (database transaction / RPC `security definer`). |
| BR-11 | Stok menipis jika `stock <= min_stock`. |
| BR-12 | Resep (BOM) menghasilkan **harga jual saran** dari HPP + profit (% atau nominal). |
| BR-13 | Produksi selesai: bahan baku berkurang, barang jadi bertambah; HPP diterapkan satu kali (toggle `apply_cost_price`). |
| BR-14 | HPP produk juga bisa dihitung dari order produksi (bukan hanya pembelian). Urutan: harga beli rata-rata untuk produk beli; cost produksi untuk barang jadi. |
| BR-15 | **Nomor telepon pelanggan bersifat unik** (index parsial; boleh kosong) — nama boleh sama antar orang, dibedakan lewat telepon/kota/alamat & tampilan dropdown. |
| BR-16 | **Pelunasan piutang boleh sebagian**; saldo tidak boleh negatif; hanya peran **owner & cashier** yang mencatat. |
| BR-17 | Transaksi digital: **keuntungan = biaya admin − biaya modal**; total ditagih ke pelanggan = nominal + biaya admin. |
| BR-18 | Transaksi digital jenis `reduces_balance` memotong **saldo modal** per jenis sebesar biaya modal; **diblokir bila saldo tidak cukup**; jenis cashout tidak memotong saldo. |
| BR-19 | **Top-up saldo modal** dan **kelola jenis digital** hanya Owner (RPC security definer); pencatatan transaksi oleh Owner & Kasir. |

---

## 7. Kebutuhan Non-Fungsional

| ID | Kebutuhan |
|---|---|
| NFR-01 | **Kecepatan**: checkout selesai dalam hitungan detik; optimasi build (Next.js Turbopack). |
| NFR-02 | **Sekuritas**: kontrol akses per peran; keamanan baris data (Row Level Security); operasi tulis kritis lewat RPC `security definer`; kunci service-role hanya dipakai server. |
| NFR-03 | **Responsif**: tampil rapi di HP (top bar mobile + drawer) dan layar desktop (sidebar). |
| NFR-04 | **Validasi**: validasi input di form & server action; angka uang divalidasi ≥ 0; qty ≥ 1. |
| NFR-05 | **Ketersediaan**: hosting Vercel + database Supabase (managed, backup otomatis). |
| NFR-06 | **Maintainability**: arsitektur server actions + RLS + RPC; fleet migrate `supabase/migrations/*.sql`. |
| NFR-07 | **Bahasa Indonesia** sebagai bahasa UI. |
| NFR-08 | **Cetak**: struk via browser print (compatible printer thermal). |

---

## 8. Asumsi & Batasan

- **Asumsi**: pemilik mengisi data produk & harga secara benar; pembelian & penjualan dicatat lengkap oleh staf.
- **Batasan (saat ini)**:
  - Pajak (`tax_rate`) tersimpan dalam Pengaturan namun **belum diterapkan** dalam kalkulasi transaksi.
  - Kembalian & piutang **tidak** tercatat otomatis ke jurnal akuntansi.
  - Retur barang (penjualan/pembelian) belum tersedia.
  - Satu lokasi/toko; tidak ada multi-cabang & transfer antargudang.
  - Riwayat harga per supplier baru mulai aktif sejak fitur dibuat (data sebelum itu tidak tampil kecuali sudah ada di `purchase_items`).

---

## 9. Di Luar Lingkup (Out of Scope saat ini)

- Retur & koreksi pasca transaksi (void/edit invoice).
- Integrasi mesin kasir fisik / printer thermal via driver khusus.
- Pembayaran online terintegrasi (payment gateway, QRIS statis/dinamis).
- Multi-cabang & manajemen gudang.
- Modul akuntansi penuh (jurnal, neraca, arus kas).
- Faktur pajak (e-invoice/e-faktur).
- Aplikasi mobile native / Progressive Web App offline.

---

## 10. Indikator Keberhasilan (KPI)

1. **Waktu checkout** rata-rata (target < 1 menit/transaksi).
2. **Akurasi stok**: selisih stok sistem vs fisik mendekati 0.
3. **Akurasi margin/untung**: tidak ada perbedaan signifikan antara laporan sistem & kalkulasi manual (didukung BR-08).
4. **Penurunan stockout** berkat peringatan stok menipis.
5. **Piutang & hutang tertagih/terbayar tercatat** (rekonsiliasi bulanan tanpa selisih).
6. **Keputusan pembelian**: minimal 1 keputusan/bulan dari data Riwayat Harga (mis. pindah ke supplier termurah).

---

## 11. Rencana Pengembangan (Backlog Arah Kedepan)

Prioritas yang disarankan:

| Prio | Fitur | Manfaat |
|---|---|---|
| P1 | **Menerapkan PPN / pajak** pada transaksi | Akurasi harga & kepatuhan pajak |
| P1 | **Retur / void transaksi** (kembalikan stok) | Koreksi operasional |
| P1 | **Laporan laba-rugi** (omzet − HPP) per periode & per produk | Ukur untung sebenarnya |
| P2 | **Harga pelanggan khusus** (price list per pelanggan/tier) | Fleksibilitas penjualan |
| P2 | **Cetak label barcode/harga** | Efisiensi kasir |
| P2 | **Perkiraan restock otomatis** (reorder point dari riwayat penjualan) | Hindari stok habis |
| P2 | **Riwayat & tren harga per produk disertai grafik** | Analisis pembelian |
| P3 | **Pembagian pembayaran sebagian (partial payment)** pelanggan | Pengelolaan piutang lebih halus |
| P3 | **Ekspor laporan (Excel/PDF)** | Pelaporan eksternal |
| P3 | **Notifikasi WhatsApp/email** (stok menipis, hutang jatuh tempo) | Proaktif pemantauan |
| P3 | **Multi-cabang / transfer stok** | Skala usaha |
| P3 | **Integrasi payment gateway & e-faktur** | Otomasi keuangan |
| P3 | **PWA offline mode & aplikasi mobile** | Akses di lokasi tanpa sinyal |

---

## 12. Lampiran — Referensi Teknis (Singkat)

- **Frontend**: Next.js (App Router), Server Actions, Tailwind CSS, supabase-js.
- **Backend**: Supabase (PostgreSQL), RLS untuk keamanan baris, RPC `security definer` untuk tulis atomik: `process_checkout`, `process_purchase`, `record_supplier_payment`, `record_customer_payment`, `process_production`, `cancel_production`, `apply_production_cost`.
- **Cara kerja RLS**: setiap tabel diberi kebijakan `using (true)` untuk baca bagi user terautentikasi; tulis kritis hanya lewat RPC yang memeriksa `current_user_role()`.
- **Migrasi DB**: file `supabase/schema.sql` (full) + `supabase/migrations/*.sql` (alami). Selalu jalankan di Supabase SQL Editor untuk database hidup.
- **Deployment**: Vercel (auto-deploy dari branch `main`) + Supabase project; domain `warungnuhahade.shop`.
- **Konvensi**: uang = integer rupiah; timestamp UTC di-format lokal `id-ID`; UI Berbahasa Indonesia.

---

## 13. Riwayat Enhancement

| Tanggal | Versi | Ringkasan Perubahan | Referensi |
|---|---|---|---|
| 2026-09-10 | v1.1 | **Harga modal rata-rata tertimbang** saat pembelian (BR-08) + halaman **Riwayat Harga** per supplier (M-09). | `supabase/migrations/process_purchase_wac.sql`; `web/src/app/(app)/price-history/` |
| 2026-09-10 | v1.1 | **Pelunasan piutang pelanggan** dicatat (`record_customer_payment`, halaman `/customers/[id]/pay`, tombol Bayar di daftar & detail) — FR-49/FR-50, BR-16. | `supabase/migrations/customer_debt_payment.sql` |
| 2026-09-10 | v1.1 | **Tambah pelanggan cepat dari POS** + **pembeda nama pelanggan** (nomor telepon unik, tampilan dropdown) — FR-51/FR-52, BR-15. | `supabase/migrations/customer_debt_payment.sql`; POSClient, actions/customers.ts |
| 2026-09-10 | v1.1 | Logo toko di halaman login/register, sidebar (desktop & mobile), dan favicon tab browser. | `web/public/logo-transparan2.webp`; `web/src/app/(app)/components/Sidebar.tsx` |
| 2026-09-10 | v1.1 | **Modul Penjualan Digital (M-13)**: jenis extensible + saldo modal per jenis (top-up Owner) + pencatatan transaksi (admin & modal) — FR-53..FR-57, BR-17..BR-19. | `supabase/migrations/digital_sales.sql`; `web/src/app/(app)/digital/`; `web/src/app/actions/digital.ts` |