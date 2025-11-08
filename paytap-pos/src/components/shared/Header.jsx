import React, { useState, useEffect } from "react";
import { FaSearch, FaUserCircle, FaBell, FaWifi, FaCheckCircle, FaTimesCircle, FaSync } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import EditProfileModal from "../EditProfileModal";
import { getCurrentUser, onAuthStateChange } from "../../firebase/authService";
import { initializeVendor } from "../../firebase/pointsService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useWebSocket } from "../../hooks/useWebSocket";

const Header = () => {
  const [pointBalance, setPointBalance] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { isConnected, esp32Status, connectionError, reconnect } = useWebSocket();

  // Reset reconnecting state when connection is established
  useEffect(() => {
    if (isConnected && isReconnecting) {
      setIsReconnecting(false);
    }
  }, [isConnected, isReconnecting]);

  useEffect(() => {
    // Get current user
    const currentUser = getCurrentUser();
    setUser(currentUser);

    let unsubscribePoints = null;

    // Listen to auth state changes
    const unsubscribeAuth = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      
      // Unsubscribe from previous points listener
      if (unsubscribePoints) {
        unsubscribePoints();
        unsubscribePoints = null;
      }

      // Set up real-time points listener when user changes
      if (authUser) {
        await initializeVendor(authUser.uid);
        setupPointsListener(authUser.uid);
      } else {
        setPointBalance(0);
        setBusinessName('');
        setLoadingPoints(false);
      }
    });

    // Initial setup if user is already logged in
    if (currentUser) {
      initializeVendor(currentUser.uid).then(() => {
        setupPointsListener(currentUser.uid);
      });
    } else {
      setLoadingPoints(false);
    }

    function setupPointsListener(userId) {
      setLoadingPoints(true);
      const vendorDocRef = doc(db, 'vendors', userId);
      
      unsubscribePoints = onSnapshot(
        vendorDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setPointBalance(data.points || 0);
            setBusinessName(data.businessName || '');
          } else {
            setPointBalance(0);
            setBusinessName('');
          }
          setLoadingPoints(false);
        },
        (error) => {
          console.error('Error listening to vendor data:', error);
          setPointBalance(0);
          setBusinessName('');
          setLoadingPoints(false);
        }
      );
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribePoints) {
        unsubscribePoints();
      }
    };
  }, []);

  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'John Veneracion'; // Fallback
  };

  return (
    <>
      <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} className="h-8 w-8" alt="restro logo" />
          <h1 className="text-lg font-semibold text-[#f5f5f5]">Canteen</h1>
        </div>

        {/* Search and Points - Centered */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[20px] px-5 py-2 w-[400px]">
            <FaSearch className="text-[#f5f5f5]" />
            <input
              type="text"
              placeholder="Search"
              className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full"
            />
          </div>

          {/* Point Balance */}
          <div className="bg-[#2a2a2a] px-4 py-2 rounded-[20px] flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 text-xs">Points</p>
            {loadingPoints ? (
              <p className="text-yellow-400 font-bold text-lg">...</p>
            ) : (
              <p className="text-yellow-400 font-bold text-lg">{pointBalance.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* WebSocket Status and Profile - Right Side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* WebSocket Status */}
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 flex flex-col gap-1.5">
            {/* WebSocket Server Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <FaWifi className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-xs font-medium text-gray-300">WebSocket Server</span>
              </div>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <FaCheckCircle className="text-green-400 text-xs" />
                    <span className="text-xs text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-400 text-xs" />
                    <span className="text-xs text-red-400">Disconnected</span>
                  </>
                )}
              </div>
              {(connectionError || !isConnected) && (
                <button
                  onClick={() => {
                    setIsReconnecting(true);
                    reconnect();
                    // Fallback: reset loading state after 5 seconds if connection doesn't establish
                    setTimeout(() => setIsReconnecting(false), 5000);
                  }}
                  disabled={isReconnecting}
                  className="ml-1 p-1 hover:bg-[#2a2a2a] rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reconnect WebSocket Server"
                >
                  <FaSync className={`text-blue-400 text-xs ${isReconnecting ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            
            {/* ESP32 Status */}
            <div className="flex items-center gap-2 border-t border-[#2a2a2a] pt-1.5">
              <div className={`w-2 h-2 rounded-full ${
                esp32Status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
              }`} />
              <span className="text-xs font-medium text-gray-300">ESP32 Scanner</span>
              <span className={`text-xs font-semibold ${
                esp32Status === 'connected' ? 'text-green-400' : 'text-gray-500'
              }`}>
                {esp32Status === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Logged User Details */}
          <div className="flex items-center gap-4">
            <div className="bg-[#1f1f1f] rounded-[15x] p-3 cursor-pointer">
              <FaBell className="text-[#f5f5f5] text-2xl" />
            </div>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowEditProfile(true)}
            >
              <FaUserCircle className="text-[#f5f5f5] text-4xl" />
              <div className="flex flex-col items-start">
                <h1 className="text-md text-[#f5f5f5] font-semibold">{getUserDisplayName()}</h1>
                {businessName && (
                  <p className="text-xs text-gray-400">{businessName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={showEditProfile} 
        onClose={() => setShowEditProfile(false)} 
      />
    </>
  );
};

export default Header;
