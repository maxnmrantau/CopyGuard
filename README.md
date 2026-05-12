# CopyGuard Desktop

Aplikasi desktop Electron untuk membandingkan isi dua folder dan mendeteksi:

- file sumber yang hilang di folder tujuan
- file ekstra di folder tujuan
- perbandingan berdasarkan nama, nama + ekstensi, atau path relatif
- pembuatan folder khusus otomatis di folder tujuan untuk menyalin file yang terdeteksi belum tercopy

## Jalankan lokal

```powershell
npm install
npm start
```

## Build EXE portable

```powershell
npm run build:win
```

Output akan muncul di folder `dist/`.

Konfigurasi build memakai:

- target `portable` Windows x64
- `asar: true`
- `compression: maximum`

Electron tetap membawa runtime Chromium, jadi ukuran final tidak akan sekecil aplikasi native murni, tetapi konfigurasi ini menjaga build tetap seramping mungkin untuk jalur Electron.
