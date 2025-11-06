// src/utils/serialReader.js
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

export const connectToESP32 = () => {
  const port = new SerialPort('COM3', { baudRate: 115200 }); // Change COM3 to your port
  const parser = port.pipe(new Readline({ delimiter: '\n' }));

  parser.on('data', (data) => {
    if (data.startsWith('RFID_SCAN:')) {
      const uid = data.replace('RFID_SCAN:', '').trim();
      
      // Dispatch event to CheckoutModal
      const event = new CustomEvent('rfid-card-scanned', {
        detail: { uid }
      });
      window.dispatchEvent(event);
      
      console.log('✅ RFID card scanned:', uid);
    }
  });

  console.log('✅ Serial reader connected');
};