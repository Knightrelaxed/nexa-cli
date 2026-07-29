#!/usr/bin/env node
// ============================================================
// N.E.X.A Universal CLI Client
// Menghubungkan terminal laptop manapun ke server N.E.X.A di HF.
//
// Cara pakai:
//   npx github:Knightrelaxed/nexa-cli
//
// Cara kerja:
//   1. Baca config dari ~/.nexa-config.json
//   2. Jika belum ada → tanya URL server & secret sekali saja
//   3. Loop obrolan: ketik pesan → HTTPS POST /webhook/cli → tampilkan balasan
//
// Zero external dependencies — hanya menggunakan Node.js built-in modules.
// ============================================================
'use strict';

const readline = require('readline');
const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

// ── Konstanta ─────────────────────────────────────────────────
const CONFIG_PATH  = path.join(os.homedir(), '.nexa-config.json');
const SESSION_ID   = `cli-${Date.now()}`;    // Unik per sesi obrolan
const TIMEOUT_MS   = 60000;                   // 60 detik timeout (model AI bisa lambat)
const BANNER = `
\x1b[36m╔══════════════════════════════════════════════════╗\x1b[0m
\x1b[36m║\x1b[0m   \x1b[1m\x1b[97m🤖  N.E.X.A — Universal Terminal CLI\x1b[0m            \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   \x1b[90mKetik "exit" atau "keluar" untuk berhenti\x1b[0m       \x1b[36m║\x1b[0m
\x1b[36m╚══════════════════════════════════════════════════╝\x1b[0m
`;

// ── Baca atau Buat Konfigurasi ─────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      const cfg = JSON.parse(raw);
      if (cfg.serverUrl && cfg.secret) return cfg;
    }
  } catch (_) {}
  return null;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

// ── HTTP Request Helper (tanpa external dependency) ────────────
function postJson(serverUrl, secret, body) {
  return new Promise((resolve, reject) => {
    const payload   = JSON.stringify(body);
    const url       = new URL('/webhook/cli', serverUrl);
    const isHttps   = url.protocol === 'https:';
    const transport = isHttps ? https : http;
    const port      = url.port || (isHttps ? 443 : 80);

    const options = {
      hostname : url.hostname,
      port     : port,
      path     : url.pathname,
      method   : 'POST',
      headers  : {
        'Content-Type'  : 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization' : `Bearer ${secret}`
      },
      timeout  : TIMEOUT_MS
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, body: { ok: false, error: data } });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout — server N.E.X.A tidak merespons dalam 60 detik.'));
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

// ── Setup Konfigurasi Pertama Kali ─────────────────────────────
async function setupConfig(rl) {
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n\x1b[33m⚙️  Konfigurasi belum ditemukan. Setup sekali ini saja.\x1b[0m\n');

  let serverUrl = (await question('\x1b[36m🔐 NEXA Server URL\x1b[0m  (contoh: https://nexa-asistant-nexa-core-server.hf.space)\n   → ')).trim();
  if (!serverUrl.startsWith('http')) serverUrl = 'https://' + serverUrl;
  // Hapus trailing slash
  serverUrl = serverUrl.replace(/\/$/, '');

  const secret = (await question('\x1b[36m🔐 Secret Key\x1b[0m        (NEXA_GODMODE_SECRET Anda)\n   → ')).trim();

  if (!serverUrl || !secret) {
    console.error('\n\x1b[31m❌ URL dan Secret tidak boleh kosong.\x1b[0m');
    process.exit(1);
  }

  // Verifikasi koneksi sebelum menyimpan
  process.stdout.write('\n\x1b[33m🔄 Memverifikasi koneksi ke server N.E.X.A...\x1b[0m ');
  try {
    const result = await postJson(serverUrl, secret, { message: '__ping__', session_id: 'setup-test' });
    if (result.status === 401 || result.status === 403) {
      console.log('\x1b[31mGAGAL\x1b[0m');
      console.error('\x1b[31m❌ Secret Key salah. Silakan coba lagi.\x1b[0m');
      process.exit(1);
    }
    console.log('\x1b[32mOK\x1b[0m');
  } catch (err) {
    console.log('\x1b[31mGAGAL\x1b[0m');
    console.error(`\x1b[31m❌ Tidak dapat terhubung ke server: ${err.message}\x1b[0m`);
    console.error('\x1b[90mPastikan Server URL benar dan HF Space sedang online.\x1b[0m');
    process.exit(1);
  }

  const cfg = { serverUrl, secret };
  saveConfig(cfg);
  console.log(`\n\x1b[32m✅ Konfigurasi tersimpan di ${CONFIG_PATH}\x1b[0m`);
  console.log('\x1b[90m   (Tidak perlu input ulang di laptop ini)\x1b[0m\n');
  return cfg;
}

// ── Main Entry Point ───────────────────────────────────────────
async function main() {
  console.log(BANNER);

  const rl = readline.createInterface({
    input : process.stdin,
    output: process.stdout
  });

  // Graceful exit saat Ctrl+C
  rl.on('close', () => {
    console.log('\n\x1b[36m👋 N.E.X.A: Sampai jumpa, Tuan Faqih! Semangat terus!\x1b[0m\n');
    process.exit(0);
  });

  // Load atau setup konfigurasi
  let cfg = loadConfig();
  if (!cfg) {
    cfg = await setupConfig(rl);
  } else {
    console.log(`\x1b[32m✅ Terhubung ke:\x1b[0m \x1b[90m${cfg.serverUrl}\x1b[0m\n`);
  }

  // ── Loop Obrolan ─────────────────────────────────────────────
  const ask = () => {
    rl.question('\x1b[97m👤 Tuan Faqih:\x1b[0m ', async (userInput) => {
      const input = userInput.trim();

      // Perintah keluar
      if (!input) { ask(); return; }
      if (['exit', 'keluar', 'q', 'quit'].includes(input.toLowerCase())) {
        rl.close();
        return;
      }

      const startTime = Date.now();
      process.stdout.write('\x1b[33m⏳ N.E.X.A sedang berpikir...\x1b[0m\r');

      try {
        const result = await postJson(cfg.serverUrl, cfg.secret, {
          message   : input,
          session_id: SESSION_ID
        });

        const elapsed = Date.now() - startTime;

        // Bersihkan baris "sedang berpikir..."
        process.stdout.write('\x1b[2K\r');

        if (result.status === 401 || result.status === 403) {
          console.log('\x1b[31m❌ Autentikasi gagal. Periksa Secret Key Anda.\x1b[0m');
          console.log('\x1b[90m   Hapus ~/.nexa-config.json lalu jalankan ulang untuk setup ulang.\x1b[0m\n');
        } else if (!result.body?.ok) {
          const errMsg = result.body?.error || `HTTP ${result.status}`;
          console.log(`\x1b[31m❌ Error dari server: ${errMsg}\x1b[0m\n`);
        } else {
          const reply  = result.body.reply  || '(tidak ada balasan)';
          const intent = result.body.intent || 'UNKNOWN';
          console.log(`\n\x1b[36m🤖 N.E.X.A\x1b[0m \x1b[90m(${elapsed}ms · ${intent})\x1b[0m:`);
          console.log(`\x1b[97m${reply}\x1b[0m\n`);
        }

      } catch (err) {
        process.stdout.write('\x1b[2K\r');
        if (err.message.includes('timeout')) {
          console.log('\x1b[31m⏱️  Timeout — server N.E.X.A tidak merespons dalam 60 detik.\x1b[0m');
          console.log('\x1b[90m   HF Space mungkin sedang sleep atau down.\x1b[0m\n');
        } else {
          console.log(`\x1b[31m❌ Koneksi gagal: ${err.message}\x1b[0m\n`);
        }
      }

      ask();
    });
  };

  ask();
}

main().catch(err => {
  console.error('\x1b[31m❌ Fatal error:', err.message, '\x1b[0m');
  process.exit(1);
});
