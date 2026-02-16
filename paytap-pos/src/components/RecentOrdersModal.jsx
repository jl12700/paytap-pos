import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReceiptModal from './ReceiptModal';
import { auth } from '../firebase/config';

const RecentOrdersModal = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAllOrders();
    }
  }, [isOpen]);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      // ✅ Get current vendor
      const currentVendor = auth.currentUser;
      
      if (!currentVendor) {
        console.error('No vendor logged in');
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log('📍 Fetching all orders for vendor:', currentVendor.uid);

      const ordersRef = collection(db, 'orders');
      
      // ✅ Query with vendor filter only (all dates)
      const q = query(
        ordersRef,
        where('vendorId', '==', currentVendor.uid),  // ✅ FILTER BY VENDOR
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('📦 Total orders for this vendor:', ordersList.length);
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching all vendor orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = (order.customerName || '').toLowerCase();
    const orderId = (order.orderId || '').toLowerCase();
    return customerName.includes(query) || orderId.includes(query);
  });

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-[#2a2a2a]">
          {/* Header */}
          <div className="bg-[#2a2a2a] p-6 flex items-center justify-between border-b border-[#3a3a3a]">
            <h2 className="text-2xl font-bold text-[#f5f5f5]">All Orders</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 pb-4 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-lg px-4 py-3 border border-[#3a3a3a]">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or order number"
                className="bg-transparent outline-none text-[#f5f5f5] flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-4">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  {searchQuery ? 'No orders found matching your search.' : 'No orders found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#2a2a2a] rounded-lg p-4 hover:bg-[#2f2f2f] transition-colors border border-[#3a3a3a]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg flex-shrink-0">
                        {getInitials(order.customerName)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#f5f5f5] text-lg font-semibold truncate">
                          {order.customerName || 'Unknown'}
                        </h3>
                        <p className="text-[#ababab] text-sm">
                          {order.items?.length || 0} Items • ₱{order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-[#ababab] text-xs mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg px-3 py-1 text-sm">
                            {order.orderId || 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleViewReceipt(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
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