// server.js - Production-Ready Express + WebSocket Server
// Compatible with Render.com deployment

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
require('dotenv').config();

// ==================== ENVIRONMENT VALIDATION ====================
const requiredEnvVars = ['NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Missing optional env vars:', missingEnvVars.join(', '));
}

// ==================== CONFIGURATION ====================
const app = express();
const PORT = process.env.PORT || 10000; // Render uses 10000 by default
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://paytap-pos.web.app'; // Your Firebase URL 

console.log('=================================');
console.log('  PayTap WebSocket Server');
console.log(`  Environment: ${NODE_ENV}`);
console.log(`  Port: ${PORT}`);
console.log('=================================');

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: [
    FRONTEND_URL,
    'https://paytap-pos.firebaseapp.com',
    'http://localhost:5173', // Development
    'http://localhost:5174',
    'https://paytap-pos.web.app/',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Trust proxy for Render
app.set('trust proxy', 1);

// ==================== HTTP SERVER ====================
const server = http.createServer(app);

// ==================== WEBSOCKET SERVER ====================
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  // Render-specific settings
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: 100 * 1024 // 100KB max message size
});

// Store connected clients with metadata
const clients = new Map();

// ==================== HEALTH CHECK ROUTES ====================
// Critical for Render deployment monitoring
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PayTap WebSocket Server',
    version: '1.0.0',
    connections: wss.clients.size,
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    connections: wss.clients.size,
    memory: process.memoryUsage(),
    environment: NODE_ENV
  };
  
  res.status(200).json(health);
});

app.get('/api/status', (req, res) => {
  const clientList = [];
  clients.forEach((data, ws) => {
    clientList.push({
      type: data.type,
      device_id: data.device_id,
      connected_at: data.connected_at,
      duration: Math.floor((Date.now() - new Date(data.connected_at).getTime()) / 1000)
    });
  });
  
  res.json({
    server: 'running',
    environment: NODE_ENV,
    total_connections: wss.clients.size,
    clients: clientList,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  });
});

// ==================== WEBSOCKET CONNECTION HANDLER ====================
wss.on('connection', (ws, req) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Store client metadata
  clients.set(ws, {
    ip: clientIP,
    connected_at: new Date().toISOString(),
    type: 'unknown',
    device_id: null,
    lastPing: Date.now()
  });
  
  console.log(`\n✅ New connection from: ${clientIP}`);
  console.log(`   Total connections: ${wss.clients.size}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to PayTap WebSocket Server',
    server_time: new Date().toISOString(),
    environment: NODE_ENV
  }));
  
  // Handle messages from clients
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('\n📨 Received message:');
      console.log(`   Type: ${message.type}`);
      console.log(`   Data:`, message);
      
      // Update client metadata
      const clientData = clients.get(ws);
      if (clientData) {
        clientData.lastPing = Date.now();
        if (message.device_id) {
          clientData.device_id = message.device_id;
        }
      }
      
      // Handle different message types
      switch(message.type) {
        case 'esp32_connected':
          if (clientData) clientData.type = 'esp32';
          console.log(`✓ ESP32 device connected: ${message.device_id}`);
          
          ws.send(JSON.stringify({
            type: 'connection_confirmed',
            message: 'ESP32 connected successfully',
            server_time: new Date().toISOString()
          }));
          
          // Notify web clients
          broadcastToWeb({
            type: 'esp32_status',
            status: 'connected',
            device_id: message.device_id
          });
          break;
          
        case 'web_connected':
          if (clientData) clientData.type = 'web';
          console.log(`✓ Web client connected`);
          
          ws.send(JSON.stringify({
            type: 'connection_confirmed',
            message: 'Web client connected successfully'
          }));
          break;
          
        case 'rfid_scan':
          console.log(`📇 RFID Card Scanned: ${message.rfid_uid}`);
          console.log(`   Device: ${message.device_id}`);
          console.log(`   Network: ${message.network || 'unknown'}`);
          
          // Broadcast to all web clients
          broadcastToWeb({
            type: 'rfid_scan',
            rfid_uid: message.rfid_uid,
            device_id: message.device_id,
            network: message.network,
            timestamp: new Date().toISOString()
          });
          
          // Send confirmation back to ESP32
          ws.send(JSON.stringify({
            type: 'scan_received',
            message: 'Card scan received by server',
            rfid_uid: message.rfid_uid
          }));
          break;
          
        case 'payment_request':
          console.log(`💳 Payment request: ₱${message.amount} for card ${message.rfid_uid}`);
          
          // Simulate payment processing
          setTimeout(() => {
            const success = true; // Replace with actual payment logic
            
            if (success) {
              broadcastToESP32({
                type: 'payment_success',
                rfid_uid: message.rfid_uid,
                amount: message.amount,
                transaction_id: `TXN${Date.now()}`,
                timestamp: new Date().toISOString()
              });
              
              broadcastToWeb({
                type: 'payment_success',
                rfid_uid: message.rfid_uid,
                amount: message.amount,
                transaction_id: `TXN${Date.now()}`,
                timestamp: new Date().toISOString()
              });
              
              console.log('✅ Payment processed successfully');
            } else {
              broadcastToESP32({
                type: 'payment_failed',
                rfid_uid: message.rfid_uid,
                reason: 'Insufficient balance',
                timestamp: new Date().toISOString()
              });
              
              console.log('❌ Payment failed');
            }
          }, 1000);
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
          
        default:
          console.log(`⚠ Unknown message type: ${message.type}`);
          broadcastToAll(message, ws);
      }
      
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        error: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    const clientData = clients.get(ws);
    console.log(`\n❌ Client disconnected`);
    console.log(`   Type: ${clientData?.type || 'unknown'}`);
    console.log(`   IP: ${clientIP}`);
    console.log(`   Total connections: ${wss.clients.size - 1}`);
    
    // Notify others if ESP32 disconnected
    if (clientData?.type === 'esp32') {
      broadcastToWeb({
        type: 'esp32_status',
        status: 'disconnected',
        device_id: clientData.device_id
      });
    }
    
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // Handle pong response
  ws.on('pong', () => {
    const clientData = clients.get(ws);
    if (clientData) {
      clientData.lastPing = Date.now();
    }
  });
});

// ==================== BROADCAST HELPERS ====================
function broadcastToAll(message, sender = null) {
  const messageStr = JSON.stringify(message);
  let count = 0;
  
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(messageStr);
      count++;
    }
  });
  
  console.log(`   📤 Broadcasted to ${count} client(s)`);
  return count;
}

function broadcastToESP32(message) {
  const messageStr = JSON.stringify(message);
  let count = 0;
  
  wss.clients.forEach((client) => {
    const clientData = clients.get(client);
    if (clientData?.type === 'esp32' && client.readyState === 1) {
      client.send(messageStr);
      count++;
    }
  });
  
  console.log(`   📤 Sent to ${count} ESP32 device(s)`);
  return count;
}

function broadcastToWeb(message) {
  const messageStr = JSON.stringify(message);
  let count = 0;
  
  wss.clients.forEach((client) => {
    const clientData = clients.get(client);
    if (clientData?.type === 'web' && client.readyState === 1) {
      client.send(messageStr);
      count++;
    }
  });
  
  console.log(`   📤 Sent to ${count} web client(s)`);
  return count;
}

// ==================== KEEP ALIVE ====================
// Ping all clients every 30 seconds
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.ping();
    }
  });
}, 30000);

// Clean up stale connections (no pong in 2 minutes)
setInterval(() => {
  const now = Date.now();
  clients.forEach((data, ws) => {
    if (now - data.lastPing > 120000) {
      console.log(`⚠️ Terminating stale connection: ${data.type} - ${data.device_id}`);
      ws.terminate();
    }
  });
}, 60000);

// ==================== SERVER STARTUP ====================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
  
  if (NODE_ENV === 'production') {
    console.log(`\n   Production URLs:`);
    console.log(`   HTTP: https://your-app.onrender.com`);
    console.log(`   WebSocket: wss://your-app.onrender.com/ws`);
  }
  
  console.log('\n👂 Waiting for connections...\n');
});

// ==================== GRACEFUL SHUTDOWN ====================
const shutdown = () => {
  console.log('\n\n🛑 Shutting down server...');
  
  wss.clients.forEach((client) => {
    client.close(1000, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ==================== ERROR HANDLERS ====================
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});