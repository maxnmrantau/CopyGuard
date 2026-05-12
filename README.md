# CopyGuard

CopyGuard adalah aplikasi desktop Windows berbasis Electron untuk memverifikasi hasil proses copy folder. Aplikasi ini membantu memastikan file dari folder sumber benar-benar hadir di folder tujuan, sekaligus memisahkan file yang belum tercopy agar mudah ditangani ulang.

CopyGuard cocok dipakai saat:

- menyalin banyak file secara manual lewat File Explorer
- memindahkan arsip foto, audio, video, atau dokumen kerja
- mengecek hasil backup lokal
- membandingkan folder sumber dan folder hasil copy
- mengumpulkan file yang tertinggal agar tidak bercampur dengan file lain

## Fitur Utama

- Membandingkan dua folder:
  - `Folder Sumber`
  - `Folder Tujuan`
- Tiga mode pengecekan:
  - `Nama Saja`
  - `Nama + Ekstensi`
  - `Path Relatif`
- Menghitung:
  - total file sumber
  - jumlah file cocok
  - jumlah file hilang
  - jumlah file ekstra
- Menampilkan log hasil pemeriksaan secara rinci.
- Filter log:
  - semua hasil
  - hanya file hilang
  - hasil yang cocok
- Tombol `Hapus Log` untuk mereset hasil tampilan.
- Membuat folder otomatis untuk file yang belum tercopy:
  - format folder: `FILE_BELUM_TERCOPY_YYYY-MM-DD`
- Menyalin file yang hilang ke folder otomatis tersebut tanpa menghapus file asli dari folder sumber.
- Tetap menjaga struktur subfolder saat file yang hilang dikumpulkan ulang.
- Build Windows portable tanpa installer tambahan.

## Cara Kerja Singkat

1. User memilih folder sumber.
2. User memilih folder tujuan.
3. CopyGuard membaca semua file pada kedua folder secara rekursif.
4. User memilih mode pembandingan.
5. Aplikasi mencari:
   - file sumber yang tidak ada di tujuan
   - file tujuan yang tidak ada di sumber
6. Jika ada file hilang:
   - CopyGuard membuat folder baru di dalam folder tujuan
   - file yang hilang disalin otomatis ke sana
7. Hasil lengkap ditampilkan di panel log.

## Mode Pengecekan

### 1. Nama Saja

Mode ini hanya membandingkan nama dasar file tanpa ekstensi.

Contoh:

- `foto_001.jpg`
- `foto_001.png`

Akan dianggap sama karena nama dasarnya sama-sama `foto_001`.

Mode ini cocok jika file pernah dikonversi ke format berbeda.

### 2. Nama + Ekstensi

Mode ini membandingkan nama file secara penuh, termasuk ekstensi.

Contoh:

- `foto_001.jpg`
- `foto_001.png`

Akan dianggap berbeda.

Mode ini cocok untuk verifikasi copy normal.

### 3. Path Relatif

Mode ini membandingkan lokasi file relatif terhadap folder yang dipilih.

Contoh:

- `album-a/foto.jpg`
- `album-b/foto.jpg`

Akan dianggap berbeda walaupun nama file sama.

Mode ini cocok jika struktur folder harus dipastikan ikut cocok.

## Perilaku Folder File Belum Tercopy

Jika CopyGuard menemukan file yang hilang dari folder tujuan, aplikasi akan membuat folder seperti:

```text
FILE_BELUM_TERCOPY_2026-05-12
```

Folder ini dibuat di dalam folder tujuan.

Contoh:

```text
Folder Tujuan/
`-- FILE_BELUM_TERCOPY_2026-05-12/
    |-- audio/notifikasi.mp3
    `-- docs/laporan.pdf
```

Catatan penting:

- File dari sumber **disalin**, bukan dipindahkan.
- File asli pada folder sumber tetap aman.
- Struktur subfolder tetap dipertahankan.
- Jika file gagal disalin, alasan kegagalan akan muncul di log.

## Cara Menggunakan Aplikasi

1. Jalankan CopyGuard.
2. Klik bagian `Folder Sumber`, lalu pilih folder asli.
3. Klik bagian `Folder Tujuan`, lalu pilih folder hasil copy.
4. Pilih mode pengecekan yang sesuai.
5. Klik tombol `Mulai Cek`.
6. Lihat ringkasan statistik.
7. Baca detail di panel `Log Output`.
8. Jika ingin membersihkan tampilan hasil, klik `Hapus Log`.

## Instalasi untuk Pengguna

CopyGuard disiapkan sebagai aplikasi portable Windows.

Jika file `.exe` sudah tersedia:

1. Download file portable:

```text
CopyGuard-1.0.0-portable.exe
```

2. Jalankan langsung.
3. Tidak perlu install Node.js.
4. Tidak perlu install Electron.
5. Tidak perlu proses setup tambahan.

## Kompatibilitas

Build portable saat ini ditujukan untuk:

- Windows 10 64-bit
- Windows 11 64-bit

Hal yang perlu diperhatikan:

- Aplikasi memerlukan izin baca pada folder sumber.
- Aplikasi memerlukan izin tulis pada folder tujuan.
- Jika Windows SmartScreen menampilkan peringatan, itu biasanya karena executable belum ditandatangani dengan sertifikat publik.

## Menjalankan dari Source Code

### Prasyarat

- Node.js modern
- npm

Versi yang dipakai saat pengembangan:

- Node.js `24.x`
- npm `11.x`

### Instal Dependency

```powershell
npm install
```

### Jalankan Mode Development

```powershell
npm start
```

## Build Portable EXE

Untuk membangun executable portable Windows:

```powershell
npm run build:win
```

Output build akan muncul di:

```text
dist/
```

Artefak utama:

```text
dist/CopyGuard-1.0.0-portable.exe
```

## Konfigurasi Build

Build menggunakan:

- Electron
- electron-builder
- target Windows `portable`
- arsitektur `x64`
- `asar: true`
- `compression: maximum`

Karena Electron ikut menyertakan runtime Chromium, ukuran executable portable akan lebih besar dibanding aplikasi native murni. Namun konfigurasi build sudah diarahkan agar tetap cukup ringkas untuk distribusi standalone.

## Struktur Project

```text
.
|-- assets/
|   |-- copyguard.ico
|   `-- copyguard.png
|-- src/
|   |-- main.js
|   |-- preload.js
|   `-- renderer/
|       |-- index.html
|       |-- renderer.js
|       `-- styles.css
|-- package.json
|-- package-lock.json
|-- LICENSE
`-- README.md
```

## Penjelasan Teknis Singkat

### `src/main.js`

Berisi proses utama Electron:

- membuat window aplikasi
- membuka dialog pemilihan folder
- membaca file secara rekursif
- membuat folder `FILE_BELUM_TERCOPY_YYYY-MM-DD`
- menyalin file hilang ke folder pemisah

### `src/preload.js`

Menjadi jembatan aman antara renderer dan main process melalui `contextBridge`.

### `src/renderer/*`

Berisi UI dan logika tampilan:

- state folder sumber dan tujuan
- mode pembandingan
- statistik hasil
- panel log
- filter log
- tombol hapus log

## Keamanan dan Batasan

- CopyGuard tidak menghapus file asli dari folder sumber.
- CopyGuard hanya menyalin ulang file yang terdeteksi belum ada di tujuan.
- Pemeriksaan saat ini berfokus pada keberadaan file berdasarkan key pembanding, bukan hash isi file.
- Artinya, aplikasi memverifikasi kecocokan identitas nama/path file, bukan membuktikan isi file bit-per-bit identik.

## Lisensi

Project ini menggunakan lisensi `MIT`, sesuai field `license` pada `package.json` dan isi file `LICENSE`.

Secara ringkas, lisensi MIT mengizinkan:

- penggunaan pribadi
- penggunaan komersial
- modifikasi
- distribusi ulang
- penyertaan dalam project lain

Dengan syarat utama:

- pemberitahuan hak cipta dan lisensi tetap disertakan pada salinan atau bagian substansial dari software

Teks lengkap lisensi tersedia pada file `LICENSE` di root repository.

## Ringkasan

CopyGuard adalah alat desktop sederhana untuk menjawab satu pertanyaan penting:

```text
Apakah hasil copy folder saya benar-benar lengkap?
```

Selain memberi jawabannya, CopyGuard juga membantu merapikan file yang belum tercopy agar bisa segera ditindaklanjuti.
