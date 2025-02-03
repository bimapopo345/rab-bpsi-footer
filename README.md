# Project RAB

Aplikasi web untuk mengelola dan mencetak dokumen RAB (Rencana Anggaran Biaya), dibangun menggunakan HTML, CSS, dan JavaScript dengan Electron.

## Struktur Proyek

```markdown
project-rab/
├── src/ # File sumber
│ ├── components/ # Komponen HTML
│ ├── database/ # Inisialisasi database
│ ├── handlers/ # Handler permintaan
│ ├── styles/ # Gaya CSS
│ ├── utils/ # Fungsi utilitas
│ └── main.js # File JavaScript utama
├── index.html # File HTML utama
├── login.html # Halaman login
├── material_upah.html # Halaman material dan upah
├── daftar_ahs.html # Halaman daftar AHS
├── package.json # Dependensi proyek
├── package-lock.json # Lockfile untuk dependensi
└── README.md # Dokumentasi proyek
```

## Daftar Isi

- [Tentang](#tentang)
- [Fitur](#fitur)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Dokumentasi API](#dokumentasi-api)
- [Deployment](#deployment)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)
- [Kontak](#kontak)

## Tentang

Project RAB adalah aplikasi web yang dirancang untuk mengelola dan mencetak dokumen RAB (Rencana Anggaran Biaya). Aplikasi ini memungkinkan pengguna untuk memasukkan data material dan upah, menghasilkan laporan RAB yang terperinci, dan mencetaknya dalam format yang terstruktur. Dengan menggunakan Electron, aplikasi ini dapat berjalan di berbagai platform sebagai aplikasi desktop.

## Fitur

- Autentikasi dan otorisasi pengguna
- Memasukkan dan mengelola data material dan upah
- Menghasilkan laporan RAB yang terperinci
- Mencetak dokumen RAB dalam format yang terstruktur
- Antarmuka pengguna yang intuitif dan mudah digunakan
- Dukungan untuk berbagai platform melalui Electron

## Teknologi yang Digunakan

### Frontend

- **HTML**: Bahasa markup untuk membuat halaman web
- **CSS**: Bahasa stylesheet untuk mendesain halaman web
- **JavaScript**: Bahasa pemrograman untuk pengembangan web

### Backend

- **Node.js**: Runtime JavaScript untuk membangun backend
- **SQLite**: Database ringan untuk menyimpan data

### Alat Lainnya

- **Express.js**: Framework web Node.js untuk membangun API
- **ExcelJS**: Library untuk membuat file Excel
- **Electron**: Framework untuk membangun aplikasi desktop lintas platform dengan JavaScript, HTML, dan CSS

## Prasyarat

- Node.js (versi 14 atau lebih tinggi) > v20.18.2
- npm (versi 6 atau lebih tinggi)

## Instalasi

```bash
# Clone repositori
git clone https://github.com/bimapopo345/rab-bldsp.git
cd project-rab

# Instal dependensi
npm install

# Inisialisasi database
node src/database/init.js

# Mulai server pengembangan
npm start

#instalasi Kodingan Menjadi Program .Exe
npx electron-packager . project-rab --platform=win32 --arch=x64 --out=dist --overwrite
```

## Penggunaan

1. Buka browser web dan navigasikan ke `http://localhost:3000`
2. Daftarkan akun pengguna baru atau masuk ke akun yang sudah ada
3. Masukkan data material dan upah
4. Hasilkan dan cetak laporan RAB

## Dokumentasi API

Dokumentasi API tersedia di `http://localhost:3000/api/docs`

## Deployment

Aplikasi ini dapat dideploy ke lingkungan produksi menggunakan platform cloud seperti Heroku atau Vercel.

### Deployment Backend

1. Buat aplikasi Heroku baru dan instal add-on SQLite
2. Atur variabel lingkungan untuk string koneksi database dan pengaturan lainnya
3. Deploy kode backend ke Heroku menggunakan Git

### Deployment Frontend

1. Buat aplikasi Vercel baru dan tautkan ke repositori frontend
2. Atur variabel lingkungan untuk endpoint API dan pengaturan lainnya
3. Deploy kode frontend ke Vercel

## Kontribusi

Kontribusi sangat diterima! Silakan kirim pull request dengan perubahan Anda dan deskripsi singkat tentang pembaruan.

## Lisensi

Aplikasi Project RAB dilisensikan di bawah Lisensi MIT.

## Kontak

Untuk pertanyaan, masalah, atau umpan balik, silakan hubungi tim pengembangan di [bimapopo345@gmail.com](mailto:bimapopo345@gmail.com)
