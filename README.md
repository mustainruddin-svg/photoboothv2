# Ar-Rahmah Photobooth

Aplikasi photobooth untuk acara-acara Yayasan Ar-Rahmah Sulawesi (wisuda, milad, dan acara sekolah lainnya). Kamera langsung + frame bertema Islami/emas-biru + unggah otomatis ke Google Drive lewat Google Apps Script, lengkap dengan QR code untuk diunduh tamu.

## Menjalankan secara lokal

**Prasyarat:** Node.js (versi 18+)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Struktur

- `src/components/Photobooth.tsx` — layar kamera utama: countdown, shutter, toggle mirror, pemilihan frame.
- `src/components/FrameTemplates.ts` — 5 desain frame (4 SVG generatif + 1 custom PNG).
- `src/components/PostCaptureModal.tsx` — proses unggah ke Google Drive + tampilan QR code.
- `src/components/SettingsView.tsx` — pengaturan teks banner, URL sinkronisasi, kamera, mode tampilan.
- `src/components/Exporter.tsx` — generator kode `Code.gs` (backend Apps Script) dan `index.html` standalone untuk deployment offline/tablet event.

## Menyambungkan ke Google Drive

1. Buka tab **Ekspor** di aplikasi, salin kode `Code.gs`.
2. Buat proyek baru di [script.google.com](https://script.google.com), tempel kode tersebut.
3. Deploy sebagai **Web App** — *Execute as*: **Me**, *Who has access*: **Anyone**.
4. Salin URL Web App yang dihasilkan, tempel di tab **Pengaturan** aplikasi ini (atau di panel konfigurasi pada `index.html` standalone).

> **Penting:** URL Web App ini bersifat publik (siapa pun yang memilikinya bisa mengunggah berkas ke Drive tujuan). Jangan bagikan di luar tim operator acara. Backend `Code.gs` sudah membatasi ukuran file (maks 8 MB) dan hanya menerima `image/jpeg`, `image/png`, `image/webp` — namun tautan tetap sebaiknya diperlakukan sebagai rahasia operasional, bukan dibagikan secara publik.

## Mode Simulasi

Jika kolom URL Google Apps Script dikosongkan, aplikasi otomatis berjalan dalam **Mode Simulasi** — proses unggah ditiru tanpa benar-benar mengirim data, cocok untuk latihan/demo sebelum acara.

## Deploy ke GitHub

```bash
git init
git add .
git commit -m "Ar-Rahmah Photobooth"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

File `.env.local` (kalau Anda buat untuk pengembangan lokal) otomatis diabaikan oleh `.gitignore` — URL Google Apps Script Anda **tidak akan ikut ter-commit**.

### Opsi A — Vercel (disarankan, sesuai stack yang biasa dipakai)

1. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub ini. Vercel otomatis mendeteksi Vite, tidak perlu konfigurasi tambahan.
2. Supaya situs **langsung tersambung** ke Google Drive yang sama seperti sebelumnya tanpa perlu isi manual: di **Project Settings → Environment Variables**, tambahkan:
   - Key: `VITE_GAS_URL`
   - Value: URL Web App Google Apps Script Anda yang lama (yang sebelumnya dipakai)
3. Deploy. Setiap kali ada `git push` ke `main`, Vercel otomatis build ulang.

### Opsi B — GitHub Pages

1. Tambahkan `base: "/<nama-repo>/"` di `vite.config.ts` (di dalam `defineConfig`) supaya path aset benar di GitHub Pages.
2. Buat GitHub Actions workflow (`.github/workflows/deploy.yml`) yang menjalankan `npm ci && npm run build`, lalu publish folder `dist/` ke branch `gh-pages`.
3. Untuk auto-connect ke Drive: simpan URL lama sebagai **Repository Secret** (`Settings → Secrets and variables → Actions`) dengan nama `VITE_GAS_URL`, lalu teruskan sebagai environment variable ke step build di workflow.

### Menyambungkan ke Google Drive yang sebelumnya

Backend `Code.gs` yang sudah ada (dan URL Web App-nya) **tidak berubah** oleh redesain ini — folder Drive tujuan tetap sama. Ada dua cara menyambungkannya:

- **Cara cepat:** buka tab **Pengaturan** di aplikasi yang sudah dideploy, tempel URL Web App lama Anda di kolom "URL Sinkronisasi Google Drive". Tersimpan otomatis di browser tersebut.
- **Cara otomatis (disarankan untuk deployment produksi):** set `VITE_GAS_URL` sebagai environment variable di Vercel/GitHub Actions (lihat di atas) — situs akan otomatis terhubung ke Drive yang sama begitu dibuka, tanpa operator perlu mengisi apa pun.

Jika Anda juga ingin proteksi baru (batas ukuran file, validasi tipe file) berlaku di deployment yang sudah ada: buka proyek Apps Script lama Anda di [script.google.com](https://script.google.com), ganti isi `Code.gs` dengan versi terbaru dari tab **Ekspor** aplikasi ini, lalu **Deploy → Manage Deployments → Edit (ikon pensil) → New Version → Deploy**. Cara ini mempertahankan URL Web App yang sama, jadi tidak perlu ubah apa pun di frontend.


## Palet & identitas visual

Sky blue, krem/putih, dan emas — mengikuti identitas resmi Yayasan Ar-Rahmah Sulawesi. Warna hijau/teal sengaja tidak digunakan di seluruh antarmuka maupun desain frame.
