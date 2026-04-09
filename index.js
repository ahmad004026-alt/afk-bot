const { createClient } = require('bedrock-protocol');
const http = require('http');

const CONFIG = {
  host: 'Ahmd0040-3V00.aternos.me',
  port: 57710,
  username: 'Ahmed_AFK',
  version: '1.26.0',
  reconnectDelay: 10000,
};

let client = null;
let reconnectTimer = null;
let isConnecting = false;
let connected = false;
let reconnectCount = 0;

process.on('uncaughtException', (err) => {
  log(`خطأ غير متوقع: ${err.message}`);
  cleanup();
  scheduleReconnect();
});

process.on('unhandledRejection', (reason) => {
  log(`خطأ غير معالج: ${reason}`);
  cleanup();
  scheduleReconnect();
});

function log(msg) {
  const time = new Date().toLocaleTimeString('ar-SA', { hour12: false });
  console.log(`[${time}] ${msg}`);
}

function connect() {
  if (isConnecting || reconnectTimer) return;
  isConnecting = true;
  connected = false;
  log(`محاولة الاتصال بـ ${CONFIG.host}:${CONFIG.port}...`);
  try {
    client = createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      offline: true,
      version: CONFIG.version,
      useNativeRaknet: false,
    });
    const timeout = setTimeout(() => {
      if (!connected) {
        log('انتهى وقت الاتصال، إعادة المحاولة...');
        cleanup();
        scheduleReconnect();
      }
    }, 30000);
    client.on('spawn', () => {
      clearTimeout(timeout);
      connected = true;
      isConnecting = false;
      reconnectCount = 0;
      log('البوت دخل السيرفر بنجاح وهو واقف.');
    });
    client.on('text', (packet) => {
      const msg = packet.message || '';
      if (msg) log(`[CHAT] ${msg}`);
    });
    client.on('disconnect', (reason) => {
      clearTimeout(timeout);
      const r = reason?.message || JSON.stringify(reason);
      log(`البوت اتطرد: ${r}`);
      cleanup();
      scheduleReconnect();
    });
    client.on('error', (err) => {
      clearTimeout(timeout);
      log(`خطأ: ${err.message}`);
      cleanup();
      scheduleReconnect();
    });
    client.on('close', () => {
      clearTimeout(timeout);
      log(`الاتصال انقطع.`);
      cleanup();
      scheduleReconnect();
    });
  } catch (err) {
    log(`فشل الإنشاء: ${err.message}`);
    isConnecting = false;
    scheduleReconnect();
  }
}

function cleanup() {
  isConnecting = false;
  connected = false;
  if (client) {
    try { client.removeAllListeners(); } catch (_) {}
    try { client.close(); } catch (_) {}
    client = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectCount++;
  log(`إعادة الاتصال رقم ${reconnectCount} بعد 10 ثواني...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, CONFIG.reconnectDelay);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<html><body style="font-family:Arial;direction:rtl;padding:20px">
    <h2>بوت AFK</h2>
    <p>الحالة: <b>${connected ? 'متصل' : isConnecting ? 'يتصل...' : 'منقطع'}</b></p>
    <p>محاولات إعادة الاتصال: <b>${reconnectCount}</b></p>
    <p>وقت التشغيل: <b>${Math.floor(process.uptime())} ثانية</b></p>
    </body></html>`);
});

server.listen(8080, '0.0.0.0', () => {
  log('السيرفر الداخلي شغال على بورت 8080');
  connect();
});
