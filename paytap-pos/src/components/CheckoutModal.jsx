import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaWallet, FaArrowLeft, FaCheckCircle, FaSync } from 'react-icons/fa';

const CheckoutModal = ({ isOpen, onClose, orderNumber, receipt, paymentMethod, totalAmount, onPaymentSuccess }) => {
  const [cashAmount, setCashAmount] = useState('');
  const [cashError, setCashError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [isWaitingForRFID, setIsWaitingForRFID] = useState(false);
  const hasStartedGCashFlow = useRef(false);

  useEffect(() => {
    if (paymentMethod === 'gcash' && isOpen && !hasStartedGCashFlow.current) {
      hasStartedGCashFlow.current = true;
      setIsWaitingForRFID(true);
      // Simulate RFID tap after 3 seconds
      const timer = setTimeout(() => {
        setIsWaitingForRFID(false);
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
          setIsPaymentSuccessful(true);
          setTimeout(() => {
            onPaymentSuccess(totalAmount);
            onClose();
          }, 2000);
        }, 1500);
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal closes
      setCashAmount('');
      setCashError('');
      setIsProcessing(false);
      setIsPaymentSuccessful(false);
      setIsWaitingForRFID(false);
      hasStartedGCashFlow.current = false;
    }
  }, [isOpen]);

  const handleCashAmountChange = (e) => {
    const value = e.target.value;
    setCashAmount(value);
    setCashError('');

    if (value && parseFloat(value) < totalAmount) {
      setCashError('Amount received must be equal to or greater than the total amount');
    } else if (value && parseFloat(value) < 0) {
      setCashError('Amount cannot be negative');
    }
  };

  const handleCashConfirm = () => {
    const amount = parseFloat(cashAmount);
    
    if (!cashAmount || isNaN(amount)) {
      setCashError('Please enter a valid amount');
      return;
    }

    if (amount < totalAmount) {
      setCashError('Amount received must be equal to or greater than the total amount');
      return;
    }

    if (amount < 0) {
      setCashError('Amount cannot be negative');
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsPaymentSuccessful(true);
      setTimeout(() => {
        onPaymentSuccess(totalAmount);
        onClose();
      }, 2000);
    }, 1500);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1f1f1f] rounded-2xl shadow-lg w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh] relative p-6">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-4 text-gray-400 hover:text-white text-xl flex items-center gap-2"
        >
          <FaArrowLeft className="inline" />
          <span className="text-sm">Back</span>
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Checkout</h2>

          {/* Order Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Number</label>
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <p className="text-white font-semibold">{orderNumber}</p>
            </div>
          </div>

          {/* Receipt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Receipt</label>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="space-y-2">
                {receipt.map((item, index) => (
                  <div key={index} className="flex justify-between text-white">
                    <span>{item.name} × {item.qty}</span>
                    <span>₱{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-bold text-lg">₱{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
            <div className="bg-[#2a2a2a] rounded-lg p-3 flex items-center gap-3">
              {paymentMethod === 'gcash' ? (
                <>
                  <FaQrcode className="text-blue-400 text-xl" />
                  <span className="text-white font-semibold">GCash</span>
                </>
              ) : (
                <>
                  <FaWallet className="text-green-400 text-xl" />
                  <span className="text-white font-semibold">Cash</span>
                </>
              )}
            </div>
          </div>

          {/* GCash Flow */}
          {paymentMethod === 'gcash' && (
            <div className="mb-6">
              {isWaitingForRFID && !isProcessing && !isPaymentSuccessful && (
                <div className="bg-blue-500/20 rounded-lg p-6 text-center">
                  <FaSync className="animate-spin text-blue-400 text-4xl mx-auto mb-4" />
                  <p className="text-blue-400 font-semibold text-lg mb-2">
                    Waiting for PayTap transaction
                  </p>
                  <p className="text-gray-300 text-sm">
                    Please tap your RFID card
                  </p>
                </div>
              )}

              {isProcessing && !isPaymentSuccessful && (
                <div className="bg-blue-500/20 rounded-lg p-6 text-center">
                  <FaSync className="animate-spin text-blue-400 text-4xl mx-auto mb-4" />
                  <p className="text-blue-400 font-semibold text-lg">
                    Processing payment...
                  </p>
                </div>
              )}

              {isPaymentSuccessful && (
                <div className="bg-green-500/20 rounded-lg p-6 text-center">
                  <FaCheckCircle className="text-green-400 text-4xl mx-auto mb-4" />
                  <p className="text-green-400 font-semibold text-lg">
                    Payment Successful!
                  </p>
                  <p className="text-gray-300 text-sm mt-2">
                    Points updated successfully
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cash Flow */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount Received (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₱</span>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={handleCashAmountChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full p-3 pl-8 bg-[#2a2a2a] border rounded-lg text-white ${
                    cashError ? 'border-red-500' : 'border-gray-600'
                  }`}
                  disabled={isProcessing || isPaymentSuccessful}
                />
              </div>
              {cashError && (
                <p className="text-red-400 text-sm mt-2">{cashError}</p>
              )}
              {cashAmount && !cashError && parseFloat(cashAmount) > totalAmount && (
                <p className="text-green-400 text-sm mt-2">
                  Change: ₱{(parseFloat(cashAmount) - totalAmount).toFixed(2)}
                </p>
              )}

              {!isPaymentSuccessful && (
                <button
                  onClick={handleCashConfirm}
                  disabled={!!cashError || !cashAmount || isProcessing}
                  className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
                    cashError || !cashAmount || isProcessing
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              )}

              {isPaymentSuccessful && (
                <div className="bg-green-500/20 rounded-lg p-6 text-center mt-4">
                  <FaCheckCircle className="text-green-400 text-4xl mx-auto mb-4" />
                  <p className="text-green-400 font-semibold text-lg">
                    Payment Successful!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

