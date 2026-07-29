#!/usr/bin/env node
// ============================================================
// N.E.X.A Universal Executive Cyberpunk CLI Client v2.5
// High-Tech Futuristic HUD Interface for Tuan Faqih Hidayatulloh
//
// Zero external dependencies — 100% standard Node.js & ANSI codes.
// ============================================================
'use strict';

const readline = require('readline');
const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

// ── Config ─────────────────────────────────────────────────────
const CONFIG_PATH = path.join(os.homedir(), '.nexa-config.json');
const SESSION_ID  = `cli-${Date.now()}`;
const TIMEOUT_MS  = 60000;

// ANSI Design System (Proper single-sequence codes)
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  bCyan: '\x1b[1;36m',
  magenta: '\x1b[35m',
  bMagenta: '\x1b[1;35m',
  green: '\x1b[32m',
  bGreen: '\x1b[1;32m',
  yellow: '\x1b[33m',
  bYellow: '\x1b[1;33m',
  white: '\x1b[97m',
  bWhite: '\x1b[1;97m',
  grey: '\x1b[90m'
};

const PROMPT_STR = `${C.bCyan}❖ TUAN FAQIH${C.grey} ──❯${C.reset} `;

// Comprehensive ANSI strip regex for exact padding
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

// ── Pixel-Perfect Dynamic Box Drawer ───────────────────────────
function drawBox(lines, borderColor = C.cyan) {
  const visibleLengths = lines.map(l => stripAnsi(l).length);
  const maxLen = Math.max(...visibleLengths, 54);

  const top = `${borderColor}┌${'─'.repeat(maxLen + 4)}┐${C.reset}`;
  const bottom = `${borderColor}└${'─'.repeat(maxLen + 4)}┘${C.reset}`;
  
  const content = lines.map(line => {
    const visLen = stripAnsi(line).length;
    const padRight = ' '.repeat(Math.max(0, maxLen - visLen));
    return `${borderColor}│${C.reset}  ${line}${padRight}  ${borderColor}│${C.reset}`;
  }).join('\n');

  return `\n${top}\n${content}\n${bottom}`;
}

function renderBanner(serverUrl = 'http://127.0.0.1:3000') {
  const boxContent = [
    `${C.bWhite}N.E.X.A CORE${C.reset}  ${C.grey}│${C.reset}  ${C.bCyan}UNIVERSAL TERMINAL INTERFACE v2.8${C.reset}`,
    `${C.grey}──────────────────────────────────────────────────────${C.reset}`,
    `${C.cyan}STATUS :${C.reset} ${C.bGreen}ONLINE${C.reset}          ${C.cyan}USER :${C.reset} ${C.bWhite}FAQIH HIDAYATULLOH${C.reset}`,
    `${C.cyan}STREAM :${C.reset} ${C.bMagenta}REALTIME PUSH${C.reset}   ${C.cyan}AUTH :${C.reset} ${C.bGreen}AES-CLI-SEC (OK)${C.reset}`,
    `${C.cyan}SERVER :${C.reset} ${C.white}${serverUrl}${C.reset}`
  ];

  const boxStr = drawBox(boxContent, C.cyan);
  const footerStr = ` ${C.grey}Ketik ${C.bWhite}"exit"${C.grey} atau ${C.bWhite}"keluar"${C.grey} untuk menutup terminal.${C.reset}\n`;

  return boxStr + '\n' + footerStr;
}

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

// ── UI Framing Helpers (Minimalist Left Accent Bar) ─────────────
function formatReplyBox(reply, elapsed, intent) {
  const cleanReply = String(reply).replace(/<br\s*\/?>/gi, '\n').trim();
  const border = `${C.cyan}│${C.reset}`;
  const lines = cleanReply.split('\n');
  const framedLines = lines.map(line => line.trim() ? `${border}  ${C.white}${line}${C.reset}` : `${border}`).join('\n');

  return `
${C.bWhite}🤖 N.E.X.A${C.reset}  ${C.grey}•${C.reset}  ${C.cyan}${elapsed}ms${C.reset}  ${C.grey}•${C.reset}  ${C.bGreen}${intent}${C.reset}

${framedLines}
`;
}

function formatPushBox(message) {
  const cleanMessage = String(message).replace(/<br\s*\/?>/gi, '\n').trim();
  const border = `${C.bMagenta}│${C.reset}`;
  const lines = cleanMessage.split('\n');
  const framedLines = lines.map(line => line.trim() ? `${border}  ${C.white}${line}${C.reset}` : `${border}`).join('\n');

  return `
${C.bMagenta}🔔 N.E.X.A PROACTIVE PUSH BROADCAST${C.reset}

${framedLines}
`;
}

// Spinner Animation Helper
function createSpinner() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let timer = null;

  return {
    start() {
      process.stdout.write('\x1b[?25l'); // Hide cursor
      timer = setInterval(() => {
        process.stdout.write(`\r${C.cyan}${frames[i]}${C.reset} ${C.bYellow}N.E.X.A sedang berpikir...${C.reset}\x1b[K`);
        i = (i + 1) % frames.length;
      }, 80);
    },
    stop() {
      if (timer) clearInterval(timer);
      process.stdout.write('\r\x1b[2K'); // Clear spinner line
      process.stdout.write('\x1b[?25h'); // Show cursor
    }
  };
}

// ── HTTP Request Helper ─────────────────────────────────────────
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

// ── SSE Stream Listener ─────────────────────────────────────────
function connectStream(cfg, rl) {
  const url = new URL('/webhook/cli/stream', cfg.serverUrl);
  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;
  const port = url.port || (isHttps ? 443 : 80);

  const options = {
    hostname: url.hostname,
    port: port,
    path: url.pathname,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${cfg.secret}` }
  };

  const req = transport.request(options, (res) => {
    if (res.statusCode === 401 || res.statusCode === 403) return;
    
    res.setEncoding('utf8');
    let buffer = '';
    
    res.on('data', (chunk) => {
      buffer += chunk;
      let lines = buffer.split('\n\n');
      buffer = lines.pop(); 
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'notification') {
              process.stdout.write('\x1b[2K\r'); 
              console.log(formatPushBox(parsed.message));
              rl.prompt(true);
            }
          } catch (e) { }
        }
      }
    });

    res.on('end', () => setTimeout(() => connectStream(cfg, rl), 5000));
  });

  req.on('error', () => setTimeout(() => connectStream(cfg, rl), 5000));
  req.end();
}

// ── Setup Konfigurasi ──────────────────────────────────────────
async function setupConfig(rl) {
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log(`\n${C.bYellow}⚙️  Konfigurasi belum ditemukan. Setup sekali ini saja.${C.reset}\n`);

  let serverUrl = (await question(`${C.bCyan}🔐 NEXA Server URL${C.reset}  (contoh: http://127.0.0.1:3000)\n   → `)).trim();
  if (!serverUrl.startsWith('http')) serverUrl = 'https://' + serverUrl;
  serverUrl = serverUrl.replace(/\/$/, '');

  const secret = (await question(`${C.bCyan}🔐 Secret Key${C.reset}        (NEXA_CLI_SECRET Anda)\n   → `)).trim();

  if (!serverUrl || !secret) {
    console.error(`\n${C.bYellow}❌ URL dan Secret tidak boleh kosong.${C.reset}`);
    process.exit(1);
  }

  process.stdout.write(`\n${C.yellow}🔄 Memverifikasi koneksi ke server N.E.X.A...${C.reset} `);
  try {
    const result = await postJson(serverUrl, secret, { message: '__ping__', session_id: 'setup-test' });
    if (result.status === 401 || result.status === 403) {
      console.log(`${C.bYellow}GAGAL${C.reset}`);
      console.error(`${C.bYellow}❌ Secret Key salah. Silakan coba lagi.${C.reset}`);
      process.exit(1);
    }
    console.log(`${C.bGreen}OK${C.reset}`);
  } catch (err) {
    console.log(`${C.bYellow}GAGAL${C.reset}`);
    console.error(`${C.bYellow}❌ Tidak dapat terhubung ke server: ${err.message}${C.reset}`);
    process.exit(1);
  }

  const cfg = { serverUrl, secret };
  saveConfig(cfg);
  console.log(`\n${C.bGreen}✅ Konfigurasi tersimpan di ${CONFIG_PATH}${C.reset}\n`);
  return cfg;
}

// ── Main Entry Point ───────────────────────────────────────────
async function main() {
  const rl = readline.createInterface({
    input : process.stdin,
    output: process.stdout
  });
  rl.setPrompt(PROMPT_STR);

  rl.on('close', () => {
    console.log(`\n${C.bCyan}👋 N.E.X.A: Terima kasih Tuan Faqih. Terminal offline.${C.reset}\n`);
    process.exit(0);
  });

  let cfg = loadConfig();
  if (!cfg) {
    cfg = await setupConfig(rl);
  }

  console.log(renderBanner(cfg ? cfg.serverUrl : 'http://127.0.0.1:3000'));
  connectStream(cfg, rl);

  const ask = () => {
    rl.question(PROMPT_STR, async (userInput) => {
      const input = userInput.trim();

      if (!input) { ask(); return; }
      if (['exit', 'keluar', 'q', 'quit'].includes(input.toLowerCase())) {
        rl.close();
        return;
      }

      const spinner = createSpinner();
      const startTime = Date.now();
      spinner.start();

      try {
        const result = await postJson(cfg.serverUrl, cfg.secret, {
          message   : input,
          session_id: SESSION_ID
        });

        const elapsed = Date.now() - startTime;
        spinner.stop();

        if (result.status === 401 || result.status === 403) {
          console.log(`\n\x1b[31m❌ Autentikasi gagal. Periksa Secret Key Anda.\x1b[0m\n`);
        } else if (!result.body?.ok) {
          const errMsg = result.body?.error || `HTTP ${result.status}`;
          console.log(`\n\x1b[31m❌ Error dari server: ${errMsg}\x1b[0m\n`);
        } else {
          const reply  = result.body.reply  || '(tidak ada balasan)';
          const intent = result.body.intent || 'UNKNOWN';
          console.log(formatReplyBox(reply, elapsed, intent));
        }

      } catch (err) {
        spinner.stop();
        if (err.message.includes('timeout')) {
          console.log(`\n\x1b[31m⏱️  Timeout — server N.E.X.A tidak merespons dalam 60 detik.\x1b[0m\n`);
        } else {
          console.log(`\n\x1b[31m❌ Koneksi gagal: ${err.message}\x1b[0m\n`);
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
