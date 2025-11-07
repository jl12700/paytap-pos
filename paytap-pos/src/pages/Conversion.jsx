import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaQrcode, FaWallet, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { addConversion, getConversions } from '../firebase/conversionService';
import { getVendorPoints } from '../firebase/vendors'; // ✅ Import to get real points
import { auth } from '../firebase/config'; // ✅ Import Firebase auth
import { onAuthStateChanged } from 'firebase/auth'; // ✅ Import auth listener

const Conversion = ({ show, onClose }) => {
  if (!show) return null;

  const [currentUser, setCurrentUser] = useState(null); // ✅ Track current user
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'paytap',
    cardNumber: '',
    amount: ''
  });

  const [transactionCode, setTransactionCode] = useState('');
  const [showConversionPopup, setShowConversionPopup] = useState(false);
  const [conversionData, setConversionData] = useState({
    vendorName: '', // ✅ Will be filled with user email
    vendorId: '', // ✅ Will be filled with user ID
    pointBalance: 0, // ✅ Will be filled with actual points
    chosenPaymentMethod: 'paytap',
    conversionAmount: ''
  });

  const [recentConversions, setRecentConversions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(true); // ✅ Loading state for points

  const paymentMethods = [
    { id: 'paytap', name: 'PayTap', icon: FaQrcode, color: 'bg-blue-500' },
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    loadRecentConversions();
  }, []);

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
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    // ✅ Check if user has enough points
    if (amount > conversionData.pointBalance) {
      alert(`Insufficient points! You have ${conversionData.pointBalance} points but trying to convert ${amount} points.`);
      return;
    }

    if (formData.paymentMethod === 'paytap' && !formData.cardNumber) {
      alert('PayTap number is required');
      return;
    }

    setLoading(true);
    try {
      const generatedTransactionCode = `TXN-${Date.now()}`;
      setTransactionCode(generatedTransactionCode);

      // ✅ Include vendorId in the conversion record
      const conversionRecord = {
        vendorId: conversionData.vendorId, // ✅ ADD THIS - Firebase Auth user ID
        vendorName: conversionData.vendorName, // User's email
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

      alert(`Conversion request submitted successfully!\nTransaction Code: ${generatedTransactionCode}`);
      setShowConversionPopup(false);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'paytap',
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

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > conversionData.pointBalance) {
      alert(`Insufficient points! You have ${conversionData.pointBalance} points.`);
      return;
    }

    if (formData.paymentMethod === 'paytap' && !formData.cardNumber) {
      alert('Please enter PayTap number');
      return;
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
              onChange={handleInputChange}
              className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white"
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

          {formData.paymentMethod === 'paytap' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">PayTap Number *</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="Enter PayTap number"
                className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (Points) *</label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0"
                step="1"
                min="1"
                max={conversionData.pointBalance}
                className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                pts
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Available: {conversionData.pointBalance} points
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
              <p className="text-gray-400 text-sm mb-4">
                Remaining after conversion: {conversionData.pointBalance - conversionData.conversionAmount} points
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