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

## Palet & identitas visual

Sky blue, krem/putih, dan emas — mengikuti identitas resmi Yayasan Ar-Rahmah Sulawesi. Warna hijau/teal sengaja tidak digunakan di seluruh antarmuka maupun desain frame.
