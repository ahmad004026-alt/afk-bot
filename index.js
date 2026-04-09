const { createClient } = require('bedrock-protocol');
const http = require('http');

/**
 * إعدادات السيرفر المأخوذة من الصورة بدقة تامة
 */
const CONFIG = {
  host: 'Ahmd0040-3V00.aternos.me',
  port: 57710,
  username: 'Ahmed_AFK',
  version: '1.26.10', // تم تعديله بدقة لـ 1.26.10 كما في الصورة
  offline: true,       // سيرفرات أترنوس مكركة (Offline Mode)
  reconnectDelay: 10000,
};

let client = null;
let reconnectTimer = null;
let isConnecting = false;
let connected = false;
let reconnectCount = 0;

process.on('uncaughtException', (err) => {
  log(`[خطأ]: ${err.message}`);
  cleanup();
  scheduleReconnect();
});

process.on('unhandledRejection', (reason) => {
  log(`[خطأ غير معالج]: ${reason}`);
  cleanup();
  scheduleReconnect();
});

function log(msg) {
  const time = new Date().toLocaleTimeString('ar-SA');
  console.log(`[${time}] ${msg}`);
}

function connect() {
  if (isConnecting || client) return;
  
  isConnecting = true;
  connected = false;
  log(`محاولة الاتصال بالإصدار ${CONFIG.version}...`);

  try {
    client = createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      offline: CONFIG.offline,
      version: CONFIG.version,
      useNativeRaknet: false, // لضمان التوافق في ريبلت
      skipPing: true          // تخطي الفحص لأن أترنوس أحياناً لا يستجيب له
    });

    client.on('spawn', () => {
      connected = true;
      isConnecting = false;
      reconnectCount = 0;
      log('✅ تم دخول السيرفر بنجاح! البوت الآن واقف.');
    });

    client.on('error', (err) => {
      log(`❌ خطأ: ${err.message}`);
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

    // مهلة أمان للاتصال
    setTimeout(() => {
      if (isConnecting && !connected) {
        log('⌛ انتهت المهلة، سأحاول مجدداً...');
        cleanup();
        scheduleReconnect();
      }
    }, 20000);

  } catch (e) {
    log(`🚫 فشل البدء: ${e.message}`);
    isConnecting = false;
    scheduleReconnect();
  }
}

function cleanup() {
  isConnecting = false;
  connected = false;
  if (client) {
    try {
      client.removeAllListeners();
      client.close();
    } catch (_) {}
    client = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectCount++;
  log(`🔄 محاولة إعادة اتصال رقم ${reconnectCount} بعد 10 ثوانٍ...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, CONFIG.reconnectDelay);
}

// لإبقاء ريبلت يعمل (Keep Alive)
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`بوت AFK\nالحالة: ${connected ? 'متصل ✅' : 'غير متصل ❌'}\nالإصدار: ${CONFIG.version}`);
}).listen(8080, () => {
  log('🌐 السيرفر الوهمي يعمل على بورت 8080');
  connect();
});
