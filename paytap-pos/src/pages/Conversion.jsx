import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaQrcode, FaWallet, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { addConversion, getConversions } from '../firebase/conversionService';
import { getVendorPoints } from '../firebase/vendors'; // ✅ Import to get real points
import { auth } from '../firebase/config'; // ✅ Import Firebase auth
import { onAuthStateChanged } from 'firebase/auth'; // ✅ Import auth listener
import { getCurrentUser } from '../firebase/authService';
import { initializeVendor, getBusinessName } from '../firebase/pointsService';

const Conversion = ({ show, onClose }) => {
  if (!show) return null;

  const [currentUser, setCurrentUser] = useState(null); // ✅ Track current user
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'gcash',
    cardNumber: '',
    amount: ''
  });

  const [transactionCode, setTransactionCode] = useState('');
  const [showConversionPopup, setShowConversionPopup] = useState(false);
  const [conversionData, setConversionData] = useState({
    vendorName: '', // ✅ Will be filled with user email
    vendorId: '', // ✅ Will be filled with user ID
    pointBalance: 0, // ✅ Will be filled with actual points
    chosenPaymentMethod: 'gcash',
    conversionAmount: ''
  });

  const [recentConversions, setRecentConversions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(true); // ✅ Loading state for points
  const [gcashError, setGcashError] = useState(''); // ✅ GCash validation error
  const [amountError, setAmountError] = useState(''); // ✅ Amount validation error

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: FaQrcode, color: 'bg-blue-500' },
    { id: 'cash', name: 'Cash', icon: FaWallet, color: 'bg-green-500' }
  ];

  // ✅ Listen for authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ User logged in:', user.uid, user.email);
        setCurrentUser(user);
        
        // Get user's actual points
        try {
          setLoadingPoints(true);
          const vendorData = await getVendorPoints(user.uid);
          console.log('📊 Vendor points:', vendorData.points);
          
          setConversionData(prev => ({
            ...prev,
            vendorName: user.email || 'Unknown Vendor',
            vendorId: user.uid,
            pointBalance: vendorData.points || 0
          }));
        } catch (error) {
          console.error('❌ Error loading vendor points:', error);
          setConversionData(prev => ({
            ...prev,
            vendorName: user.email || 'Unknown Vendor',
            vendorId: user.uid,
            pointBalance: 0
          }));
        } finally {
          setLoadingPoints(false);
        }
      } else {
        console.warn('⚠️ No user logged in');
        setCurrentUser(null);
        setConversionData(prev => ({
          ...prev,
          vendorName: '',
          vendorId: '',
          pointBalance: 0
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Validate GCash number format
  const validateGCashNumber = (number) => {
    // Remove any non-digit characters
    const digitsOnly = number.replace(/\D/g, '');
    
    // Check if it's exactly 11 digits
    if (digitsOnly.length > 11) {
      return { isValid: false, error: 'GCash number must be exactly 11 digits' };
    }
    
    // Check if it starts with 09
    if (digitsOnly.length > 0 && !digitsOnly.startsWith('09')) {
      return { isValid: false, error: 'GCash number must start with 09' };
    }
    
    // Check if it's exactly 11 digits when complete
    if (digitsOnly.length === 11) {
      if (!/^09\d{9}$/.test(digitsOnly)) {
        return { isValid: false, error: 'Invalid GCash number format' };
      }
      return { isValid: true, error: '' };
    }
    
    return { isValid: digitsOnly.length === 0, error: '' };
  };

  // ✅ Validate amount
  const validateAmount = (amount, availablePoints) => {
    if (!amount || amount === '') {
      return { isValid: false, error: '' };
    }
    
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }
    
    if (numAmount < 1) {
      return { isValid: false, error: 'Amount must be at least 1 point' };
    }
    
    if (numAmount > availablePoints) {
      return { isValid: false, error: `Amount cannot exceed available points (${availablePoints})` };
    }
    
    if (numAmount % 1 !== 0) {
      return { isValid: false, error: 'Amount must be a whole number' };
    }
    
    return { isValid: true, error: '' };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for GCash number
    if (name === 'cardNumber' && formData.paymentMethod === 'gcash') {
      // Only allow digits and limit to 11 characters
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      const validation = validateGCashNumber(digitsOnly);
      
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      setGcashError(validation.error);
    } else if (name === 'amount') {
      // Only allow positive numbers
      const numericValue = value.replace(/[^0-9.]/g, '');
      const validation = validateAmount(numericValue, conversionData.pointBalance);
      
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      setAmountError(validation.error);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Fetch user points when modal opens and set date to today
  useEffect(() => {
    if (show) {
      // Always set date to today when modal opens
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
      setGcashError(''); // Clear GCash error when modal opens
      setAmountError(''); // Clear amount error when modal opens
      loadUserPoints();
      loadRecentConversions();
    }
  }, [show]);

  // Re-validate amount when point balance changes
  useEffect(() => {
    if (formData.amount) {
      const validation = validateAmount(formData.amount, conversionData.pointBalance);
      setAmountError(validation.error);
    }
  }, [conversionData.pointBalance]);

  // Clear GCash error when payment method changes
  useEffect(() => {
    if (formData.paymentMethod !== 'gcash') {
      setGcashError('');
    }
  }, [formData.paymentMethod]);

  const loadUserPoints = async () => {
    try {
      setLoadingPoints(true);
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Initialize vendor if doesn't exist
        await initializeVendor(currentUser.uid, currentUser.email);
        
        // Get vendor points
        const vendorData = await getVendorPoints(currentUser.uid);
        
        setConversionData(prev => ({
          ...prev,
          vendorName: currentUser.email || 'Unknown Vendor',
          pointBalance: vendorData.points || 0
        }));
      } else {
        setConversionData(prev => ({
          ...prev,
          vendorName: 'Unknown Vendor',
          pointBalance: 0
        }));
      }
    } catch (error) {
      console.error('Error loading user points:', error);
      setConversionData(prev => ({
        ...prev,
        pointBalance: 0
      }));
    } finally {
      setLoadingPoints(false);
    }
  };

  const loadRecentConversions = async () => {
    try {
      const conversions = await getConversions();
      setRecentConversions(conversions.slice(0, 5));
    } catch (error) {
      console.error('Error loading conversions:', error);
    }
  };

  const handleConversionSubmit = async (e) => {
    e.preventDefault();

    // ✅ Check if user is logged in
    if (!currentUser) {
      alert('Please log in to submit a conversion request');
      return;
    }

    if (!conversionData.vendorName || !conversionData.conversionAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(conversionData.conversionAmount);
    
    // Validate amount
    if (isNaN(amount)) {
      alert('Please enter a valid number');
      return;
    }
    
    if (amount < 1) {
      alert('Amount must be at least 1 point');
      return;
    }
    
    if (amount % 1 !== 0) {
      alert('Amount must be a whole number');
      return;
    }

    // ✅ Check if user has enough points
    if (amount > conversionData.pointBalance) {
      alert(`Insufficient points! You have ${conversionData.pointBalance} points but trying to convert ${amount} points.`);
      return;
    }
    
    // Check for validation errors
    const validation = validateAmount(conversionData.conversionAmount, conversionData.pointBalance);
    if (!validation.isValid) {
      alert(validation.error || 'Please enter a valid amount');
      return;
    }

    if (formData.paymentMethod === 'gcash') {
      if (!formData.cardNumber) {
        alert('GCash number is required');
        return;
      }
      
      // Validate GCash number format
      const validation = validateGCashNumber(formData.cardNumber);
      if (!validation.isValid) {
        alert(validation.error || 'Please enter a valid GCash number (11 digits starting with 09)');
        return;
      }
    }

    setLoading(true);
    try {
      const generatedTransactionCode = `TXN-${Date.now()}`;
      setTransactionCode(generatedTransactionCode);

      // Get business name from vendor document
      let vendorBusinessName = '';
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          vendorBusinessName = await getBusinessName(currentUser.uid) || '';
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
        // Continue with conversion creation even if business name fetch fails
      }

      // ✅ Include vendorId in the conversion record
      const conversionRecord = {
        vendorId: conversionData.vendorId, // ✅ ADD THIS - Firebase Auth user ID
        vendorName: conversionData.vendorName, // User's email
        businessName: vendorBusinessName, // ✅ Business name from vendor document
        pointBalance: conversionData.pointBalance,
        paymentMethod: conversionData.chosenPaymentMethod,
        conversionAmount: parseInt(conversionData.conversionAmount),
        cashAmount: parseFloat(conversionData.conversionAmount),
        requestStatus: 'pending',
        transactionCode: generatedTransactionCode,
        cardNumber: formData.cardNumber,
        date: formData.date
      };

      console.log('📤 Submitting conversion:', conversionRecord);
      await addConversion(conversionRecord);

      // Points will be deducted only when the conversion request is approved by admin
      // No points are deducted at submission time when status is 'pending'

      alert(`Conversion request submitted successfully!\nTransaction Code: ${generatedTransactionCode}\n\nNote: Points will be deducted when your request is approved.`);
      setShowConversionPopup(false);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'gcash',
        cardNumber: '',
        amount: ''
      });

      await loadRecentConversions();
    } catch (error) {
      console.error('Error submitting conversion:', error);
      alert('Error submitting conversion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertNow = () => {
    if (!currentUser) {
      alert('Please log in to convert points');
      return;
    }

    if (!formData.amount || formData.amount === '') {
      alert('Please enter an amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    
    // Validate amount
    if (isNaN(amount)) {
      alert('Please enter a valid number');
      return;
    }
    
    if (amount < 1) {
      alert('Amount must be at least 1 point');
      return;
    }
    
    if (amount % 1 !== 0) {
      alert('Amount must be a whole number');
      return;
    }
    
    if (amount > conversionData.pointBalance) {
      alert(`Insufficient points! You have ${conversionData.pointBalance} points.`);
      return;
    }
    
    // Check for validation errors
    const validation = validateAmount(formData.amount, conversionData.pointBalance);
    if (!validation.isValid) {
      alert(validation.error || 'Please enter a valid amount');
      return;
    }

    if (formData.paymentMethod === 'gcash') {
      if (!formData.cardNumber) {
        alert('Please enter GCash number');
        return;
      }
      
      // Validate GCash number format
      const validation = validateGCashNumber(formData.cardNumber);
      if (!validation.isValid) {
        alert(validation.error || 'Please enter a valid GCash number (11 digits starting with 09)');
        return;
      }
    }

    setConversionData(prev => ({
      ...prev,
      chosenPaymentMethod: formData.paymentMethod,
      conversionAmount: formData.amount
    }));
    setShowConversionPopup(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'Approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
      case 'Pending':
        return <FaTimesCircle className="text-yellow-500" />;
      case 'failed':
      case 'Declined':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaTimesCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1f1f1f] rounded-2xl shadow-lg w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh] relative p-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        {/* Title with point balance */}
        <div className="flex justify-between items-center mb-6 pr-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Request Conversion</h1>
            <div className="bg-blue-600/20 px-3 py-1 rounded-lg">
              <span className="text-sm text-yellow-400 font-medium">
                {loadingPoints ? (
                  'Loading...'
                ) : (
                  `Points: ${conversionData.pointBalance}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Show warning if not logged in */}
        {!currentUser && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ Please log in to submit conversion requests
            </p>
          </div>
        )}

        {/* Form */}
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              readOnly
              disabled
              className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white cursor-not-allowed opacity-70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-[#1a1a1a] hover:border-gray-500'
                    }`}
                  >
                    <IconComponent
                      className={`text-2xl mx-auto mb-2 ${
                        formData.paymentMethod === method.id ? 'text-blue-400' : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        formData.paymentMethod === method.id ? 'text-blue-400' : 'text-gray-400'
                      }`}
                    >
                      {method.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {formData.paymentMethod === 'gcash' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">GCash Number *</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="Enter GCash number"
                maxLength={11}
                className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white ${
                  gcashError ? 'border-red-500' : 'border-gray-600'
                }`}
                required
              />
              {gcashError && (
                <p className="text-red-400 text-xs mt-1">{gcashError}</p>
              )}
              {!gcashError && formData.cardNumber && (
                <p className="text-gray-400 text-xs mt-1">
                  Format: 09XXXXXXXXX (11 digits)
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (Points) *</label>
            <div className="relative">
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount (min: 1)"
                className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white ${
                  amountError ? 'border-red-500' : 'border-gray-600'
                }`}
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                pts
              </span>
            </div>
            {amountError && (
              <p className="text-red-400 text-xs mt-1">{amountError}</p>
            )}
            {!amountError && formData.amount && (
              <p className="text-green-400 text-xs mt-1">
                ✓ Valid amount
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Available: {conversionData.pointBalance} points | Minimum: 1 point
            </p>
          </div>

          <button
            type="button"
            onClick={handleConvertNow}
            disabled={!currentUser || loadingPoints}
            className={`w-full font-semibold py-3 rounded-lg ${
              !currentUser || loadingPoints
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loadingPoints ? 'Loading...' : 'Convert Now'}
          </button>
        </form>

        {/* Recent conversions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Conversions</h2>
          {recentConversions.length === 0 ? (
            <p className="text-gray-400 text-sm">No conversion requests yet.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {recentConversions.map((conv) => (
                <li key={conv.id} className="py-3 flex justify-between text-sm text-gray-300">
                  <span>{conv.paymentMethod}</span>
                  <span>{conv.conversionAmount} pts</span>
                  <span>{getStatusIcon(conv.requestStatus)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConversionPopup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Conversion</h3>
              <p className="text-gray-300 mb-2">Vendor: {conversionData.vendorName}</p>
              <p className="text-gray-300 mb-2">Method: {conversionData.chosenPaymentMethod}</p>
              <p className="text-gray-300 mb-2">
                Amount: {conversionData.conversionAmount} points
              </p>
              <p className="text-yellow-400 text-sm mb-2">
                ⚠️ Points will be deducted when request is approved
              </p>
              <p className="text-gray-400 text-xs mb-4">
                Current balance: {conversionData.pointBalance} points | After approval: {conversionData.pointBalance - conversionData.conversionAmount} points
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConversionSubmit}
                  disabled={loading}
                  className={`flex-1 py-2 rounded-lg ${
                    loading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {loading ? 'Submitting...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowConversionPopup(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversion;