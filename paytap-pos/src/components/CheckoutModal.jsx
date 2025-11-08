// src/components/CheckoutModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaWallet, FaArrowLeft, FaCheckCircle, FaSync, FaTimes } from 'react-icons/fa';
import { supabase } from '../supabase/supabaseClient';

const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  orderNumber, 
  receipt, 
  paymentMethod, 
  totalAmount, 
  onPaymentSuccess
}) => {
  const [cashAmount, setCashAmount] = useState('');
  const [cashError, setCashError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [isWaitingForRFID, setIsWaitingForRFID] = useState(false);
  const [rfidError, setRfidError] = useState('');
  const [cardInfo, setCardInfo] = useState(null);
  
  const hasStartedPayTapFlow = useRef(false);
  const lastScannedCardRef = useRef(null);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  // Start GCash flow when modal opens
  useEffect(() => {
    const isGCash = paymentMethod === 'gcash';
    
    if (isGCash && isOpen && !hasStartedPayTapFlow.current) {
      hasStartedPayTapFlow.current = true;
      setIsWaitingForRFID(true);
      
      // Listen for RFID scan event (from Vite WebSocket)
      window.addEventListener('rfid-card-scanned', handleRFIDScanned);
    }

    return () => {
      window.removeEventListener('rfid-card-scanned', handleRFIDScanned);
    };
  }, [paymentMethod, isOpen]);

  const resetModalState = () => {
    setCashAmount('');
    setCashError('');
    setIsProcessing(false);
    setIsPaymentSuccessful(false);
    setIsWaitingForRFID(false);
    setRfidError('');
    setCardInfo(null);
    hasStartedPayTapFlow.current = false;
    lastScannedCardRef.current = null;
  };

  // Handle RFID card scan
  const handleRFIDScanned = async (event) => {
    const rfidUid = event.detail?.uid || event.detail;
    
    if (!rfidUid) {
      console.error('No RFID UID provided');
      return;
    }

    // Prevent duplicate processing
    if (rfidUid === lastScannedCardRef.current) {
      console.log('Card already processed, ignoring duplicate scan');
      return;
    }

    if (isProcessing || isPaymentSuccessful) {
      console.log('Payment already in progress');
      return;
    }

    lastScannedCardRef.current = rfidUid;
    await processPayTapPayment(rfidUid);
  };

  // Process PayTap payment with RFID (Direct Supabase)
  const processPayTapPayment = async (rfidUid) => {
    setIsWaitingForRFID(false);
    setIsProcessing(true);
    setRfidError('');

    try {
      console.log('🔍 Processing payment for RFID:', rfidUid);

      // Normalize RFID UID (uppercase, trim whitespace)
      const normalizedUid = rfidUid.trim().toUpperCase();

      // Step 1: Search for card in Supabase
      const { data: card, error: searchError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', normalizedUid)
        .single();

      if (searchError) {
        console.error('❌ Card search error:', searchError);
        throw new Error('Card not found in database');
      }

      if (!card) {
        throw new Error('Card not found in database');
      }

      console.log('✅ Card found:', card);

      // Step 2: Validate card status
      if (card.status !== 'active') {
        throw new Error('Card is inactive. Please contact admin.');
      }

      // Step 3: Check balance
      if (card.balance < totalAmount) {
        throw new Error(
          `Insufficient balance! Current: ₱${card.balance.toFixed(2)}, Required: ₱${totalAmount.toFixed(2)}`
        );
      }

      // Step 4: Calculate new balance
      const oldBalance = parseFloat(card.balance);
      const newBalance = oldBalance - totalAmount;

      console.log('💰 Balance calculation:', {
        old: oldBalance,
        deduct: totalAmount,
        new: newBalance
      });

      // Step 5: Update balance in Supabase (with error details)
      const { data: updatedCard, error: updateError } = await supabase
        .from('rfid_cards')
        .update({
          balance: newBalance
          // Note: Don't update 'updated_at' if it's auto-managed by Supabase
        })
        .eq('rfid_uid', normalizedUid)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Balance update error:', updateError);
        console.error('   Error details:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Provide more specific error messages
        if (updateError.code === '42501') {
          throw new Error('Database permission error. Please check RLS policies.');
        } else if (updateError.code === '23505') {
          throw new Error('Duplicate entry error');
        } else {
          throw new Error(`Failed to update balance: ${updateError.message}`);
        }
      }

      if (!updatedCard) {
        throw new Error('Balance update returned no data');
      }

      console.log('✅ Balance updated successfully:', updatedCard);

      // Step 6: Log transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          rfid_uid: normalizedUid,
          firebase_uid: card.firebase_uid,
          amount: totalAmount,
          type: 'debit',
          old_balance: oldBalance,
          new_balance: newBalance,
          reason: `Order #${orderNumber} - ${receipt.length} items`
        }]);

      if (transactionError) {
        console.warn('⚠️ Transaction logging failed:', transactionError);
        // Don't throw error - payment succeeded even if logging failed
      } else {
        console.log('✅ Transaction logged successfully');
      }

      // Step 7: Update UI with success
      setCardInfo({
        rfid_uid: normalizedUid,
        name: card.name,
        balance: newBalance,
        previous_balance: oldBalance,
        firebase_uid: card.firebase_uid
      });

      // Show processing animation
      setTimeout(() => {
        setIsProcessing(false);
        setIsPaymentSuccessful(true);

        // Send success response to ESP32 via WebSocket
        if (window.viteWebSocket) {
          window.viteWebSocket.send(JSON.stringify({
            type: 'payment_success',
            rfid_uid: normalizedUid,
            amount: totalAmount,
            new_balance: newBalance
          }));
        }

        // Auto-close after success
        setTimeout(() => {
          onPaymentSuccess(totalAmount, card.firebase_uid, card.name);
          onClose();
        }, 2500);
      }, 1500);

    } catch (error) {
      console.error('❌ Payment error:', error);
      setIsProcessing(false);
      setRfidError(error.message || 'Payment failed. Please try again.');

      // Send failure response to ESP32
      if (window.viteWebSocket) {
        window.viteWebSocket.send(JSON.stringify({
          type: 'payment_failed',
          rfid_uid: rfidUid,
          reason: error.message
        }));
      }
      
      // Reset waiting state after error
      setTimeout(() => {
        setIsWaitingForRFID(true);
        setRfidError('');
        lastScannedCardRef.current = null;
      }, 3000);
    }
  };

  // Simulate RFID tap for testing (DEV ONLY)
  const simulateRFIDTap = () => {
    // ⚠️ UPDATE WITH REAL UID FROM YOUR DATABASE
    const testRfidUid = 'A1B2C3D4';
    
    const event = new CustomEvent('rfid-card-scanned', {
      detail: { uid: testRfidUid }
    });
    
    window.dispatchEvent(event);
  };

  // Handle cash payment
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

    setIsProcessing(true);
    
    setTimeout(() => {
      setIsPaymentSuccessful(true);
      setTimeout(() => {
        onPaymentSuccess(totalAmount, null, null);
        onClose();
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  const isPayTap = paymentMethod === 'gcash' || paymentMethod === 'paytap';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1f1f1f] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-[#2a2a2a]">
        {/* Header */}
        <div className="bg-[#2a2a2a] p-6 relative border-b border-[#3a3a3a]">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <FaArrowLeft className="text-lg" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#f5f5f5]">Checkout</h2>
            <p className="text-gray-400 text-sm mt-1">Complete your transaction</p>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Order Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Number</label>
            <div className="bg-[#2a2a2a] rounded-lg p-3 border border-[#3a3a3a]">
              <p className="text-white font-semibold tracking-wide">{orderNumber}</p>
            </div>
          </div>

          {/* Receipt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Summary</label>
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
              <div className="space-y-2">
                {receipt.map((item, index) => (
                  <div key={index} className="flex justify-between text-white">
                    <span className="text-[#f5f5f5]">
                      {item.name} <span className="text-gray-400">× {item.qty}</span>
                    </span>
                    <span className="font-semibold">₱{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-yellow-400 font-bold text-xl">₱{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
            <div className="bg-[#2a2a2a] rounded-lg p-3 flex items-center gap-3 border border-[#3a3a3a]">
              {isPayTap ? (
                <>
                  <FaQrcode className="text-blue-400 text-xl" />
                  <span className="text-white font-semibold">PayTap</span>
                </>
              ) : (
                <>
                  <FaWallet className="text-green-400 text-xl" />
                  <span className="text-white font-semibold">Cash</span>
                </>
              )}
            </div>
          </div>

          {/* PayTap Flow */}
          {isPayTap && (
            <div className="mb-6">
              {/* Waiting for RFID */}
              {isWaitingForRFID && !isProcessing && !isPaymentSuccessful && !rfidError && (
                <div className="bg-blue-500/10 rounded-lg p-6 text-center border border-blue-500/30">
                  <FaSync className="animate-spin text-blue-400 text-4xl mx-auto mb-4" />
                  <p className="text-blue-400 font-semibold text-lg mb-2">
                    Waiting for card tap
                  </p>
                  <p className="text-gray-300 text-sm mb-1">
                    Please tap your RFID card on the scanner
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    Amount to deduct: ₱{totalAmount.toFixed(2)}
                  </p>
                  
                  {/* Test button (DEV ONLY) */}
                  {import.meta.env.DEV && (
                    <button
                      onClick={simulateRFIDTap}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                    >
                      🧪 Test RFID Tap
                    </button>
                  )}
                </div>
              )}

              {/* Processing Payment */}
              {isProcessing && !isPaymentSuccessful && (
                <div className="bg-blue-500/10 rounded-lg p-6 text-center border border-blue-500/30">
                  <FaSync className="animate-spin text-blue-400 text-4xl mx-auto mb-4" />
                  <p className="text-blue-400 font-semibold text-lg mb-2">
                    Processing payment...
                  </p>
                  <p className="text-gray-300 text-sm">
                    ₱{totalAmount.toFixed(2)} being deducted
                  </p>
                  {cardInfo && (
                    <p className="text-gray-500 text-xs mt-2">
                      Card: {cardInfo.name}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Successful */}
              {isPaymentSuccessful && (
                <div className="bg-green-500/10 rounded-lg p-6 text-center border border-green-500/30">
                  <FaCheckCircle className="text-green-400 text-4xl mx-auto mb-4" />
                  <p className="text-green-400 font-semibold text-lg mb-2">
                    Payment Successful!
                  </p>
                  <p className="text-gray-300 text-sm mb-3">
                    Transaction completed
                  </p>
                  {cardInfo && (
                    <div className="bg-[#2a2a2a] rounded-lg p-3 text-sm border border-[#3a3a3a]">
                      <div className="flex justify-between text-gray-400 mb-1">
                        <span>Card Owner:</span>
                        <span className="text-white">{cardInfo.name}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 mb-1">
                        <span>Previous Balance:</span>
                        <span>₱{cardInfo.previous_balance?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 mb-1">
                        <span>Amount Deducted:</span>
                        <span className="text-red-400">-₱{totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
                        <span className="text-white">New Balance:</span>
                        <span className="text-green-400">₱{cardInfo.balance?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Error */}
              {rfidError && !isWaitingForRFID && (
                <div className="bg-red-500/10 rounded-lg p-6 text-center border border-red-500/30">
                  <FaTimes className="text-red-400 text-4xl mx-auto mb-4" />
                  <p className="text-red-400 font-semibold text-lg mb-2">
                    Payment Failed
                  </p>
                  <p className="text-gray-300 text-sm">
                    {rfidError}
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
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₱</span>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={handleCashAmountChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full p-3 pl-8 bg-[#2a2a2a] border rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors ${
                    cashError ? 'border-red-500' : 'border-[#3a3a3a]'
                  }`}
                  disabled={isProcessing || isPaymentSuccessful}
                />
              </div>
              {cashError && (
                <p className="text-red-400 text-sm mt-2">{cashError}</p>
              )}
              {cashAmount && !cashError && parseFloat(cashAmount) > totalAmount && (
                <p className="text-green-400 text-sm mt-2 font-semibold">
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
                <div className="bg-green-500/10 rounded-lg p-6 text-center mt-4 border border-green-500/30">
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