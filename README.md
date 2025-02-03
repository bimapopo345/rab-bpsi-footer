# RAB BLDSP - Aplikasi Desktop Manajemen RAB

Aplikasi desktop untuk mengelola dan mencetak Rencana Anggaran Biaya (RAB), dikembangkan khusus untuk Balai Besar Pengujian Standar Instrumen Sumberdaya Lahan Pertanian menggunakan teknologi Electron.

![RAB BLDSP Logo](Logo%20Kementerian%20Pertanian%20Republik%20Indonesia.png)

## 🌟 Fitur Utama

- **Multi-User System**

  - Login dan manajemen user
  - Sistem hak akses berbasis role
  - Fitur reset password dengan hint

- **Manajemen Data Proyek**

  - Pencatatan detail proyek
  - Penyimpanan histori proyek
  - Export data proyek

- **Kalkulasi RAB**

  - Kalkulator material dan upah
  - Analisa Harga Satuan (AHS)
  - Perhitungan otomatis total biaya

- **Cetak Laporan**
  - Export ke Excel dengan format terstruktur
  - Cetak AHS, material, dan upah
  - Template laporan standar

## 💻 Teknologi

- **Framework**: Electron.js
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **Export**: ExcelJS
- **Interface**: Custom CSS components

## 📂 Struktur Aplikasi

```
rab-bldsp/
├── src/                     # Kode sumber
│   ├── components/         # Komponen UI yang dapat digunakan kembali
│   ├── database/          # Konfigurasi dan inisialisasi database
│   ├── handlers/          # Handler untuk berbagai fitur
│   │   ├── print/        # Handler untuk cetak dokumen
│   │   └── ...          # Handler lainnya
│   ├── styles/           # File CSS
│   └── utils/            # Fungsi utilitas
├── *.html                # File-file antarmuka
├── *_renderer.js         # File JavaScript untuk setiap antarmuka
├── main.js              # File utama Electron
└── package.json         # Konfigurasi proyek dan dependensi
```

## 📱 Halaman Aplikasi

1. **Login (login.html)**

   - Autentikasi pengguna
   - Fitur daftar akun baru
   - Reset password

2. **Dashboard (index.html)**

   - Menu utama aplikasi
   - Informasi proyek aktif
   - Akses ke semua fitur

3. **Material & Upah (material_upah.html)**

   - Manajemen data material
   - Manajemen data upah
   - Pencarian dan filter

4. **Analisa Harga Satuan (daftar_ahs.html, rincian_ahs.html)**

   - Daftar AHS
   - Detail per AHS
   - Pengelolaan koefisien

5. **Kalkulator (kalkulator_material.html, kalkulator_upah.html)**

   - Perhitungan biaya material
   - Perhitungan biaya upah
   - Rekap total biaya

6. **Data Proyek (data_proyek.html)**

   - Informasi proyek
   - Pengaturan proyek
   - Histori proyek

7. **Cetak (cetak_ahs.html)**
   - Export ke Excel
   - Pilihan template cetak
   - Preview dokumen

## ⚙️ Instalasi & Penggunaan

1. **Prasyarat**

   ```bash
   Node.js >= v20.18.2
   npm >= v6
   ```

2. **Instalasi**

   ```bash
   # Clone repositori
   git clone https://github.com/bimapopo345/rab-bldsp.git
   cd rab-bldsp

   # Install dependensi
   npm install

   # Inisialisasi database
   node src/database/init.js
   ```

3. **Development**

   ```bash
   # Menjalankan aplikasi dalam mode development
   npm start
   ```

4. **Build Aplikasi**
   ```bash
   # Build aplikasi untuk Windows
   npx electron-packager . rab-bldsp --platform=win32 --arch=x64 --out=dist --overwrite
   ```

## 🔒 Keamanan

- Database SQLite terenkripsi
- Hash password untuk keamanan
- Validasi input untuk mencegah SQL injection
- Backup otomatis database

## 🛠️ Pengembangan

- Dibuat dengan Electron untuk performa optimal
- Menggunakan SQLite untuk penyimpanan data lokal
- Interface responsif dan user-friendly
- Modular dan mudah dimaintain

## 📄 Lisensi

Hak Cipta © 2024 Balai Besar Pengujian Standar Instrumen Sumberdaya Lahan Pertanian. All rights reserved.

## 📞 Kontak & Support

- **Website**: [https://sdlp.bsip.pertanian.go.id/](https://sdlp.bsip.pertanian.go.id/)
- **Facebook**: [BBSDLP](https://www.facebook.com/BBSDLP/?locale=id_ID)
- **Instagram**: [@bsip_sdlp](https://www.instagram.com/bsip_sdlp/)
- **YouTube**: [@bbsdlp5005](https://www.youtube.com/@bbsdlp5005/)

---

Dikembangkan oleh Bima Prawang Saputra

WhatsApp: [wa.me/6282275637656](https://wa.me/6282275637656)
