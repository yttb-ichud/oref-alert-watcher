const axios = require('axios');
const fs = require('fs');

const ALERTS_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const ZINTOK_URL = 'https://yeda-phone.com/bsh/admin/learning/sclass/177186/send_zintok/';
const LOG_FILE = 'alerts_log.json';
let lastAlertData = '';

async function checkAlerts() {
  try {
    const response = await axios.get(ALERTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'he-IL,he;q=0.9',
        'Referer': 'https://www.oref.org.il/',
        'Origin': 'https://www.oref.org.il',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = response.data;
    if (!data || Object.keys(data).length === 0) {
      console.log("No alert data received.");
      return;
    }

    const dataStr = JSON.stringify(data);

    // Always log the alerts if any received
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} | ${dataStr}\n`);

    if (dataStr === lastAlertData) {
      return;
    }

    lastAlertData = dataStr;

    const alertAreas = Object.values(data.data || {}).join(',');
    if (alertAreas.includes('אשדוד')) {
      console.log('🔔 אזעקה באשדוד! שולח זינטוק...');
      await axios.post(ZINTOK_URL);
    }

  } catch (error) {
    console.error('שגיאה בבקשת נתוני אזעקות:', error.message);
  }
}

// Run every second
setInterval(checkAlerts, 1000);
