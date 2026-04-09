const { createClient } = require('bedrock-protocol');
const http = require('http');

const CONFIG = {
  host: 'Ahmd0040-3V00.aternos.me',
  port: 57710,
  username: 'Ahmed_AFK',
  version: '1.26.10', // الإصدار الأساسي
  offline: true,
  reconnectDelay: 10000,
};

let client = null;
let reconnectTimer = null;
let isConnecting = false;
let connected = false;
let reconnectCount = 0;

function log(msg) {
  const time = new Date().toLocaleTimeString('ar-SA');
  console.log(`[<LaTex>${time}] $</LaTex>{msg}`);
}

process.on('uncaughtException', (err) => {
  log(`⚠️ خطأ غير متوقع: <LaTex>${err.message}`);
  cleanup();
  scheduleReconnect();
});

function connect() {
  if (isConnecting || client) return;
  isConnecting = true;
  connected = false;
  log(`🚀 محاولة الدخول بـ $</LaTex>{CONFIG.version || 'أحدث إصدار تلقائي'}...`);

  try {
    client = createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      offline: CONFIG.offline,
      version: CONFIG.version, // سيحاول بهذا الإصدار أولاً
      useNativeRaknet: false,
      skipPing: true,
      connectTimeout: 30000
    });

    client.on('spawn', () => {
      connected = true;
      isConnecting = false;
      reconnectCount = 0;
      log('✅ تم الدخول بنجاح! البوت الآن واقف AFK.');
    });

    client.on('error', (err) => {
      log(`❌ فشل: ${err.message}`);
      
      // إذا كان الخطأ بسبب الإصدار، سنقوم بحذف رقم الإصدار ليقوم البوت بالكشف التلقائي في المرة القادمة
      if (err.message.toLowerCase().includes('version') || err.message.toLowerCase().includes('outdated')) {
        log('🔄 يبدو أن الإصدار مختلف، سأحاول الكشف التلقائي في المحاولة القادمة...');
        CONFIG.version = undefined; 
      }
      
      cleanup();
      scheduleReconnect();
    });

    client.on('disconnect', (packet) => {
      log(`⚠️ تم الفصل: ${packet.message || 'انقطع الاتصال'}`);
      cleanup();
      scheduleReconnect();
    });

    client.on('close', () => {
      cleanup();
      scheduleReconnect();
    });

  } catch (e) {
    log(`🚫 خطأ بدء العميل: ${e.message}`);
    isConnecting = false;
    scheduleReconnect();
  }
}

function cleanup() {
  isConnecting = false;
  connected = false;
  if (client) {
    try { client.removeAllListeners(); client.close(); } catch (_) {}
    client = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectCount++;
  log(`🔄 إعادة محاولة رقم ${reconnectCount} بعد 10 ثوانٍ...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, CONFIG.reconnectDelay);
}

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`بوت AFK\nالحالة: <LaTex>${connected ? 'متصل ✅' : 'غير متصل ❌'}\nالإصدار المستخدم: $</LaTex>{CONFIG.version || 'تلقائي'}`);
}).listen(8080, () => {
  log('🌐 السيرفر الوهمي يعمل على بورت 8080');
  connect();
});
