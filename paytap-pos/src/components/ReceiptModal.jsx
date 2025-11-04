import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ReceiptModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <h2 className="text-2xl font-bold text-white mb-6">Receipt Summary</h2>

          {/* Order Info */}
          <div className="mb-6 space-y-3">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Order Number</span>
                <span className="text-white font-semibold">{order.orderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Customer Name</span>
                <span className="text-white font-semibold">{order.customerName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Date</span>
                <span className="text-white font-semibold">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Payment Method</span>
                <span className="text-white font-semibold">
                  {order.paymentMethod === 'gcash' || order.paymentMethod === 'GCash' || order.paymentMethod === 'paytap'
                    ? 'PayTap' 
                    : order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Items</h3>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="space-y-2">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-white pb-2 border-b border-gray-700 last:border-0">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400 text-sm ml-2">× {item.qty}</span>
                      </div>
                      <span className="font-semibold">₱{item.subtotal?.toFixed(2) || (item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No items found</p>
                )}
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-lg">Total</span>
              <span className="text-3xl font-bold text-green-400">₱{order.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;

