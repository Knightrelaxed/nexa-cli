# N.E.X.A Universal CLI

Terminal interface untuk **N.E.X.A AI Assistant** — terhubung ke server N.E.X.A dari laptop manapun.

## Cara Pakai

### Dari laptop manapun (cukup punya Node.js):
```bash
npx github:Knightrelaxed/nexa-cli
```

### Pertama kali dijalankan:
```
╔══════════════════════════════════════════════════╗
║   🤖  N.E.X.A — Universal Terminal CLI            ║
╚══════════════════════════════════════════════════╝

⚙️  Konfigurasi belum ditemukan. Setup sekali ini saja.

🔐 NEXA Server URL   → https://nexa-asistant-nexa-core-server.hf.space
🔐 Secret Key        → ••••••••••••••••

✅ Tersimpan di ~/.nexa-config.json
```

### Selanjutnya langsung terhubung:
```
╔══════════════════════════════════════════════════╗
║   🤖  N.E.X.A — Universal Terminal CLI            ║
╚══════════════════════════════════════════════════╝

✅ Terhubung ke: nexa-asistant-nexa-core-server.hf.space

👤 Tuan Faqih: halo nexa
🤖 N.E.X.A (881ms · GREETING): Selamat siang, Tuan Faqih! ...

👤 Tuan Faqih: _
```

## Reset Konfigurasi

```bash
# Hapus config lama, setup ulang
del %USERPROFILE%\.nexa-config.json       # Windows
rm ~/.nexa-config.json                    # Linux/Mac
```

## Keamanan

- Config disimpan lokal di `~/.nexa-config.json` (hanya di laptop Tuan)
- Seluruh otak N.E.X.A (AI Router, Supabase, API Keys) tetap aman di server cloud
- Komunikasi menggunakan HTTPS + Bearer Token authentication
