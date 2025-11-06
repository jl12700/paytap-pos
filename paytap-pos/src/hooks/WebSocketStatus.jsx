// src/components/WebSocketStatus.jsx
import React from 'react';
import { FaWifi, FaCheckCircle, FaTimesCircle, FaSync } from 'react-icons/fa';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketStatus = () => {
  const { isConnected, esp32Status, connectionError, reconnect } = useWebSocket();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-lg p-3 min-w-[280px]">
        {/* Server Connection */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FaWifi className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-xs font-medium text-gray-300">WebSocket Server</span>
          </div>
          <div className="flex items-center gap-1">
            {isConnected ? (
              <>
                <FaCheckCircle className="text-green-400 text-xs" />
                <span className="text-xs font-semibold text-green-400">Connected</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-400 text-xs" />
                <span className="text-xs font-semibold text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* ESP32 Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              esp32Status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
            }`} />
            <span className="text-xs font-medium text-gray-300">ESP32 Scanner</span>
          </div>
          <span className={`text-xs font-semibold ${
            esp32Status === 'connected' ? 'text-green-400' : 'text-gray-500'
          }`}>
            {esp32Status === 'connected' ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Error Message */}
        {connectionError && (
          <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
            <p className="text-xs text-red-400 mb-2">{connectionError}</p>
            <button
              onClick={reconnect}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
            >
              <FaSync className="text-xs" />
              Reconnect
            </button>
          </div>
        )}

        {/* Ready Status */}
        {isConnected && esp32Status === 'connected' && (
          <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Ready to scan cards</span>
            </div>
          </div>
        )}

        {/* Waiting for ESP32 */}
        {isConnected && esp32Status === 'disconnected' && (
          <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <FaSync className="animate-spin text-blue-400 text-xs" />
              <span className="text-xs text-blue-400">Waiting for ESP32...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketStatus;