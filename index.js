const { createClient } = require('bedrock-protocol');
const http = require('http');

const CONFIG = {
  host: 'Ahmd0040-3V00.aternos.me',
  port: 57710,
  username: 'Ahmed_AFK',
  version: '1.26.10',
  reconnectDelay: 15000,
};

let client = null;
let reconnectTimer = null;
let isConnecting = false;
let connected = false;
let reconnectCount = 0;

process.on('uncaughtException', (err) => {
  console.log(`خطأ: ${err.message}`);
  cleanup();
  scheduleReconnect();
});

process.on('unhandledRejection', () => {
  cleanup();
  scheduleReconnect();
});

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function connect() {
  if (isConnecting || reconnectTimer) return;
  isConnecting = true;
  connected = false;
  log('محاولة الاتصال...');
  try {
    client = createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      offline: true,
      version: CONFIG.version,
      useNativeRaknet: false,
    });
    client.once('spawn', () => {
      connected = true;
      isConnecting = false;
      reconnectCount = 0;
      log('البوت دخل السيرفر!');
    });
    client.once('disconnect', (r) => {
      log(`طُرد: ${r?.message || ''}`);
      cleanup();
      scheduleReconnect();
    });
    client.once('error', () => {
      cleanup();
      scheduleReconnect();
    });
    client.once('close', () => {
      cleanup();
      scheduleReconnect();
    });
  } catch (e) {
    log(`فشل: ${e.message}`);
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
  log(`إعادة المحاولة ${reconnectCount} بعد 15 ثانية...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, CONFIG.reconnectDelay);
}

http.createServer((req, res) => {
  res.writeHead(200);
  res.end(`AFK Bot - ${connected ? 'متصل' : 'غير متصل'} - محاولات: ${reconnectCount}`);
}).listen(8080, () => {
  log('البوت يعمل على بورت 8080');
  connect();
});
