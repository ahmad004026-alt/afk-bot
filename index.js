const { createClient } = require('bedrock-protocol');
const http = require('http');

/**
 * إعدادات البوت - مأخوذة من بيانات سيرفرك (أترنوس)
 */
const CONFIG = {
  host: 'Ahmd0040-3V00.aternos.me',
  port: 57710,
  username: 'Ahmed_AFK',
  version: '1.26.10', // التعريف البرمجي لـ 1.26.10.4
  offline: true,       // سيرفرات أترنوس مكركة (Bedrock)
  reconnectDelay: 15000, // 15 ثانية بين كل محاولة إعادة اتصال
};

let client = null;
let reconnectTimer = null;
let isConnecting = false;
let connected = false;
let reconnectCount = 0;

// تسجيل الوقت والرسائل بشكل جميل في الكونسول
function log(msg) {
  const time = new Date().toLocaleTimeString('ar-SA');
  console.log(`[${time}] ${msg}`);
}

// معالجة الأخطاء غير المتوقعة لمنع توقف السكريبت
process.on('uncaughtException', (err) => {
  log(`⚠️ خطأ في الكود: ${err.message}`);
  cleanup();
  scheduleReconnect();
});

function connect() {
  if (isConnecting || client) return;
  
  isConnecting = true;
  connected = false;
  log(`🚀 جاري محاولة الدخول للسيرفر بالإصدار ${CONFIG.version}...`);

  try {
    client = createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      offline: CONFIG.offline,
      version: CONFIG.version,
      useNativeRaknet: false, // مهم جداً للتشغيل في ريبلت
      skipPing: true,         // تخطي الفحص لأن أترنوس أحياناً لا يستجيب
      connectTimeout: 45000   // رفع مهلة الاتصال لـ 45 ثانية لضمان الاستقرار
    });

    client.on('spawn', () => {
      connected = true;
      isConnecting = false;
      reconnectCount = 0;
      log('✅ أبشرك! البوت دخل السيرفر بنجاح وهو الآن واقف AFK.');
    });

    client.on('error', (err) => {
      log(`❌ فشل الاتصال: ${err.message}`);
      cleanup();
      scheduleReconnect();
    });

    client.on('disconnect', (packet) => {
      log(`⚠️ تم طرد البوت أو فصله: ${packet.message || 'انقطع الاتصال'}`);
      cleanup();
      scheduleReconnect();
    });

    client.on('close', () => {
      log('🔌 تم إغلاق الاتصال.');
      cleanup();
      scheduleReconnect();
    });

    // مهلة أمان إذا علق الاتصال
    setTimeout(() => {
      if (isConnecting && !connected) {
        log('⌛ انتهت مهلة الانتظار، سأحاول مجدداً...');
        cleanup();
        scheduleReconnect();
      }
    }, 50000);

  } catch (e) {
    log(`🚫 خطأ في بدء العميل: ${e.message}`);
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
  log(`🔄 سأحاول الدخول مجدداً (المحاولة ${reconnectCount}) بعد 15 ثانية...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, CONFIG.reconnectDelay);
}

// سيرفر ويب بسيط لإبقاء البوت حياً (Keep Alive)
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  const status = connected ? 'متصل ✅' : 'غير متصل ❌';
  res.end(`بوت AFK ماينكرافت\nالحالة: ${status}\nاسم البوت: ${CONFIG.username}\nالمحاولات: ${reconnectCount}`);
}).listen(8080, () => {
  log('🌐 السيرفر الوهمي يعمل على بورت 8080 (استخدمه في UptimeRobot)');
  connect();
});
