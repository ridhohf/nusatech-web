# Product Requirements Document (PRD)
**Project Name:** PT Nusatech Solusi Handal - Sistem Manajemen Perbaikan & Inventori
**Date:** 27 Juni 2026

## 1. Pendahuluan
Dokumen ini menguraikan spesifikasi dan kebutuhan sistem untuk aplikasi web PT Nusatech Solusi Handal. Sistem ini dirancang untuk mendigitalkan proses penerimaan barang, inspeksi, manajemen inventori, eksekusi perbaikan, hingga pelaporan kepada klien.

## 2. Peran Pengguna (User Roles)
Sistem ini memiliki dua peran utama:
1. **Internal (Admin / Teknisi / Tim Gudang):** Memiliki akses penuh untuk mencatat barang masuk, inspeksi, mengelola inventori, memperbarui status perbaikan, dan membuat akun.
2. **Client (Pelanggan):** Memiliki akses terbatas hanya untuk memonitor status perbaikan peralatan milik mereka.

## 3. Alur Sistem & Fitur Utama

### 3.1. Autentikasi & Manajemen Akun
- **Login System:** Pengguna dapat masuk menggunakan kredensial mereka dan diarahkan ke halaman yang sesuai berdasarkan peran (Internal atau Client).
- **Pembuatan Akun:** Tim Internal dapat membuat akun baru baik untuk pengguna Internal lainnya maupun untuk Client.

### 3.2. Dashboard Internal
- **Pusat Navigasi:** Tim Internal dapat mengakses modul "Barang Masuk", "Monitoring & Report", dan "Pembuatan Akun".
- **Monitoring & Report:** Halaman khusus untuk melihat status keseluruhan pekerjaan dan catatan perbaikan.

### 3.3. Penerimaan Barang & Inspeksi (Incoming Inspection)
- **Pencatatan Barang Masuk:** Internal dapat mendata barang yang baru masuk dari klien.
- **Form Incoming Inspection:** Mencatat detail bongkar barang, Penanggung Jawab (PIC), dan hasil inspeksi awal.
- **Kategorisasi Perbaikan:** Menentukan tindakan yang diperlukan, yaitu:
  - Ganti (Replace)
  - Fabrikasi (Fabrication)
  - Repair (Perbaikan)

### 3.4. Manajemen Inventori (Inventory)
- **Tabel Inventori:** Menyimpan data material yang mencakup:
  - Jenis Barang (Raw material, sparepart, consumable, aksesoris)
  - Spesifikasi Barang
  - Kode Barang
  - Quantity (Jumlah)
  - Unit of Issue (Satuan)
  - Harga
  - Suplier
- **Pengecekan Inventori (Cek Inven):** Sistem memvalidasi ketersediaan barang untuk perbaikan.
- **Pengadaan & Suplier:** Jika stok tidak tersedia (NO), sistem akan mencatat kebutuhan restock atau barang baru ke suplier. Terdapat halaman "Resume" untuk memonitor status dan progres pengadaan setiap material.

### 3.5. Eksekusi Perbaikan (Execution)
- **Book (Ready to work):** Status bahwa material sudah lengkap dan pekerjaan siap dieksekusi.
- **Eksekusi Perbaikan:** Teknisi mencatat status pekerjaan dan memantau progres penggunaan setiap material.
- **Pemasangan (Assembly):** Mencatat status pemasangan dari komponen yang diperbaiki.
- **Performance Test:** Pengecekan akhir kualitas.
  - Jika **YES** (Lulus), pekerjaan dinyatakan selesai (**Finish**).
  - Jika **NO** (Gagal), alur akan kembali ke tahap Eksekusi Perbaikan.

### 3.6. Portal Klien (Client Page)
- **Monitoring:** Klien dapat melihat secara *real-time* informasi status pekerjaan (dari tahap eksekusi perbaikan) hingga selesai.

## 4. Rekomendasi Teknologi (Tech Stack)
Berdasarkan kebutuhan sistem manajemen yang dinamis dan terstruktur ini, berikut adalah rekomendasi teknologi yang disarankan:

1. **Frontend (Antarmuka Pengguna):**
   - **Framework:** **Next.js (React)**. Next.js sangat cocok untuk membangun dashboard interaktif dan *Client Page* dengan navigasi yang cepat.
   - **Styling:** **Vanilla CSS** dengan struktur *Design System* modern. Menghasilkan desain yang *premium*, interaktif, dan eksklusif dengan performa tinggi.

2. **Backend (Server & API):**
   - **Framework:** **Next.js API Routes** (Node.js). Memungkinkan kita membangun frontend dan backend dalam satu *codebase* (Fullstack), mempermudah dan mempercepat *development*.

3. **Database:**
   - **Database Engine:** **PostgreSQL**. Sangat ideal untuk sistem yang memiliki relasi data kompleks (seperti relasi antara perbaikan, inventori, dan suplier).
   - **ORM:** **Prisma**. Memudahkan interaksi aplikasi dengan database secara aman (*type-safe*).

4. **Autentikasi (Security):**
   - **NextAuth.js:** Solusi autentikasi terintegrasi untuk mengelola sesi login *Client* dan *Internal* dengan aman.
