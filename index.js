const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ALERTS_URL = process.env.OREF_API_URL || 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const CITY_TO_WATCH = process.env.TARGET_CITY || 'אשדוד';
const TRIGGER_URL = process.env.TRIGGER_URL;

let lastData = null;
const logFilePath = path.join(__dirname, 'alerts_log.json');

const appendToLog = (entry) => {
  const timestamp = new Date().toISOString();
  const record = { timestamp, entry };

  let log = [];
  if (fs.existsSync(logFilePath)) {
    try {
      const fileData = fs.readFileSync(logFilePath);
      log = JSON.parse(fileData);
    } catch (e) {
      console.error('שגיאה בקריאת קובץ הלוג:', e.message);
    }
  }

  log.push(record);
  fs.writeFileSync(logFilePath, JSON.stringify(log, null, 2));
};

const checkAlerts = async () => {
  try {
    const res = await axios.get(ALERTS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const data = res.data?.data;

    if (!data || Object.keys(data).length === 0) {
      console.log('לא התקבלו תוצאות - עצירה');
      process.exit(0);
    }

    const dataStr = JSON.stringify(data);
    appendToLog(data);

    if (dataStr === lastData) return;
    lastData = dataStr;

    if (dataStr.includes(CITY_TO_WATCH)) {
      console.log(`🚨 התראה ל-${CITY_TO_WATCH} - נשלחת בקשה`);
      if (TRIGGER_URL) {
        await axios.get(TRIGGER_URL);
      } else {
        console.warn('⚠️ TRIGGER_URL לא הוגדר');
      }
    } else {
      console.log(`✅ אין התראה על ${CITY_TO_WATCH}`);
    }

  } catch (err) {
    console.error('שגיאה בקריאה:', err.message);
  }
};

setInterval(checkAlerts, 1000);
