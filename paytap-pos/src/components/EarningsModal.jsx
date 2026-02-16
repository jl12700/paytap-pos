import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const EarningsModal = ({ isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('day'); // 'day', 'week', 'month', 'year'
  const [earnings, setEarnings] = useState(0);
  const [paytapPoints, setPaytapPoints] = useState(0);
  const [cashPHP, setCashPHP] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchEarnings();
    }
  }, [isOpen, selectedPeriod]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate;

      switch (selectedPeriod) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
      }

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(now);

      // Query orders within the selected period
      const ordersRef = collection(db, 'orders');
      
      // Try to query with status filter first, fallback to all orders if it fails
      let querySnapshot;
      try {
        const q = query(
          ordersRef,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp),
          where('status', '==', 'Completed')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // If query fails (e.g., missing index), fetch all and filter client-side
        console.warn('Query with filters failed, fetching all orders:', error);
        const allOrders = await getDocs(ordersRef);
        querySnapshot = allOrders;
      }

      let totalEarnings = 0;
      let totalPaytapPoints = 0;
      let totalCashPHP = 0;
      let count = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt;
        const paymentMethod = data.paymentMethod || '';
        
        // Check if order is within date range
        if (createdAt) {
          const orderDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          if (orderDate >= startDate && orderDate <= now) {
            // Check status if we didn't filter by status in query
            if (data.status === 'Completed' || !data.status) {
              if (data.totalAmount) {
                totalEarnings += data.totalAmount;
                // Breakdown by payment method
                if (paymentMethod === 'gcash') {
                  // 1 peso = 1 point
                  totalPaytapPoints += Math.floor(data.totalAmount);
                } else if (paymentMethod === 'cash') {
                  totalCashPHP += data.totalAmount;
                }
                count++;
              }
            }
          }
        } else if (data.status === 'Completed' || !data.status) {
          // If no createdAt, include it (fallback for old orders)
          if (data.totalAmount) {
            totalEarnings += data.totalAmount;
            // Breakdown by payment method
            if (paymentMethod === 'gcash') {
              // 1 peso = 1 point
              totalPaytapPoints += Math.floor(data.totalAmount);
            } else if (paymentMethod === 'cash') {
              totalCashPHP += data.totalAmount;
            }
            count++;
          }
        }
      });

      setEarnings(totalEarnings);
      setPaytapPoints(totalPaytapPoints);
      setCashPHP(totalCashPHP);
      setOrderCount(count);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setEarnings(0);
      setPaytapPoints(0);
      setCashPHP(0);
      setOrderCount(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case 'day':
        return now.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'year':
        return now.getFullYear().toString();
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1f1f1f] rounded-2xl shadow-lg w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh] relative p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
        >
          <FaTimes />
        </button>

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-white mb-6">Total Earnings Summary</h2>

          {/* Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Period</label>
            <div className="grid grid-cols-4 gap-2">
              {['day', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedPeriod === period
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600 bg-[#2a2a2a] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Display */}
          <div className="mb-6">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Period</p>
              <p className="text-white font-semibold">{formatDateRange()}</p>
            </div>
          </div>

          {/* Earnings Display */}
          {loading ? (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
              <div className="animate-pulse text-gray-400">Loading earnings...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
                <p className="text-gray-400 text-sm mb-2">Total Earnings</p>
                <p className="text-4xl font-bold text-green-400">₱{earnings.toFixed(2)}</p>
              </div>

              {/* Breakdown */}
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-3 font-medium">Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Total Paytap:</span>
                    <span className="text-yellow-400 font-semibold text-lg">{paytapPoints.toLocaleString()} Points</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Cash:</span>
                    <span className="text-green-400 font-semibold text-lg">₱{cashPHP.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-white">{orderCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">Average per Order</p>
                    <p className="text-xl font-semibold text-white">
                      {orderCount > 0 ? `₱${(earnings / orderCount).toFixed(2)}` : '₱0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {orderCount === 0 && (
                <div className="bg-[#2a2a2a] rounded-lg p-6 text-center">
                  <p className="text-gray-400">No completed orders found for this period.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsModal;

