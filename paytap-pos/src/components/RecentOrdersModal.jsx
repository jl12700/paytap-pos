import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReceiptModal from './ReceiptModal';

const RecentOrdersModal = ({ isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('day'); // 'day', 'week', 'month'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, selectedPeriod]);

  const fetchOrders = async () => {
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
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
      }

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(now);

      const ordersRef = collection(db, 'orders');
      
      let querySnapshot;
      try {
        const q = query(
          ordersRef,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        console.warn('Query with filters failed, fetching all orders:', error);
        const allOrders = await getDocs(ordersRef);
        querySnapshot = allOrders;
      }

      const ordersList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt;
        
        if (createdAt) {
          const orderDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          if (orderDate >= startDate && orderDate <= now) {
            ordersList.push({
              id: doc.id,
              ...data
            });
          }
        } else {
          // Include orders without createdAt
          ordersList.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by createdAt descending
      ordersList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-[#1f1f1f] rounded-2xl shadow-lg w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
          >
            <FaTimes />
          </button>

          <div className="mt-4">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Orders</h2>

            {/* Period Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Period</label>
              <div className="grid grid-cols-3 gap-2">
                {['day', 'week', 'month'].map((period) => (
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

            {/* Orders List */}
            {loading ? (
              <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
                <div className="animate-pulse text-gray-400">Loading orders...</div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-gray-400">No orders found for this period.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#2a2a2a] rounded-lg p-4 flex items-center justify-between hover:bg-[#333] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <h3 className="text-white font-semibold text-lg">{order.customerName || 'Unknown'}</h3>
                          <p className="text-gray-400 text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm">Order Number</span>
                          <span className="text-yellow-400 font-semibold">{order.orderId || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm">Total</span>
                          <span className="text-white font-semibold">₱{order.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewReceipt(order)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold ml-4"
                    >
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </>
  );
};

export default RecentOrdersModal;

