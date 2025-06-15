const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
    const res = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const data = res.data?.data;

    if (!data || Object.keys(data).length === 0) {
      console.log('לא התקבלו תוצאות - עצירה');
      process.exit(0);
    }

    const dataStr = JSON.stringify(data);
    appendToLog(data); // שמור לוג

    if (dataStr === lastData) return;

    lastData = dataStr;

    if (dataStr.includes('אשדוד')) {
      console.log('התראה לאשדוד - נשלחת בקשה');
      await axios.get('https://yeda-phone.com/bsh/admin/learning/sclass/177186/send_zintok/');
    } else {
      console.log('אין התראה על אשדוד');
    }

  } catch (err) {
    console.error('שגיאה בקריאה:', err.message);
  }
};

setInterval(checkAlerts, 1000);
