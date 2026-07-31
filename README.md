# N.E.X.A Universal Terminal Console (`nexa-assistant-console`)

Terminal interface resmi untuk **N.E.X.A AI Assistant v2.8** — terhubung ke N.E.X.A Core Server dari terminal laptop manapun di dunia.

---

## 🚀 Cara Menjalankan CLI

### 1. Perintah Resmi NPM Registry (Universal dari Komputer Manapun):
```bash
npx nexa-assistant-console
```
*(Atau via alias `npx nexa-cli`)*

### 2. Perintah Developer Source (Langsung dari GitHub):
```bash
npx github:Knightrelaxed/nexa-cli
```

---

## ⚙️ Setup Konfigurasi Pertama Kali

Saat pertama kali dijalankan, CLI akan meminta dua parameter yang disimpan lokal di `~/.nexa-config.json`:
1. **NEXA Server URL:** `https://nexa-asistant-nexa-core-server.hf.space` (atau `http://127.0.0.1:3000` untuk mode dev lokal).
2. **Secret Key (NEXA_CLI_SECRET):** `cLiNeXa17`

```
┌──────────────────────────────────────────────────────────┐
│  N.E.X.A CORE  │  UNIVERSAL TERMINAL INTERFACE v2.8      │
│  ──────────────────────────────────────────────────────  │
│  STATUS : ONLINE          USER : FAQIH HIDAYATULLOH      │
│  STREAM : REALTIME PUSH   AUTH : AES-CLI-SEC (OK)        │
│  SERVER : http://127.0.0.1:3000                          │
└──────────────────────────────────────────────────────────┘
 Ketik "exit" atau "keluar" untuk menutup terminal.

❖ TUAN FAQIH ──❯ 
```

---

## 📦 Prosedur Pembaruan Versi Package NPM (Developer Release Guide)

Setiap kali terjadi perubahan kode di repo ini dan ingin di-publish ke NPM:

1. **Commit & Push ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: perbaikan/fitur baru"
   git push origin main
   ```

2. **BUMP Nomor Versi di `package.json`**:
   ```bash
   npm version patch   # 2.8.0 -> 2.8.1 (Fix)
   # atau
   npm version minor   # 2.8.0 -> 2.9.0 (Fitur Baru)
   ```

3. **Publish ke NPM Registry**:
   ```bash
   npm publish --access public
   ```

---

## 🛡️ Keamanan

- Config tersimpan lokal di `~/.nexa-config.json` (hanya di laptop Tuan Faqih).
- Seluruh otak N.E.X.A (AI Router, Supabase, API Keys) tetap aman di server cloud.
- Komunikasi menggunakan HTTPS + Bearer Token Authentication.

