import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaQrcode, FaWallet, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { addConversion, getConversions } from '../firebase/conversionService';

const Conversion = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'gcash',
    cardNumber: '',
    amount: ''
  });

  const [transactionCode, setTransactionCode] = useState('');

  const [showConversionPopup, setShowConversionPopup] = useState(false);
  const [conversionData, setConversionData] = useState({
    vendorName: 'POS Vendor', // Autofilled vendor name
    pointBalance: 100,
    chosenPaymentMethod: 'gcash',
    conversionAmount: ''
  });

  const [recentConversions, setRecentConversions] = useState([]);
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: FaQrcode, color: 'bg-blue-500' },
    { id: 'cash', name: 'Cash', icon: FaWallet, color: 'bg-green-500' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load recent conversions on component mount
  useEffect(() => {
    loadRecentConversions();
  }, []);

  const loadRecentConversions = async () => {
    try {
      const conversions = await getConversions();
      setRecentConversions(conversions.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error loading conversions:', error);
    }
  };

  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    if (!conversionData.vendorName || !conversionData.conversionAmount) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate amount
    const amount = parseFloat(conversionData.conversionAmount);
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    // Validate card number for GCash
    if (formData.paymentMethod === 'gcash' && !formData.cardNumber) {
      alert('Card number is required for GCash payments');
      return;
    }
    
    setLoading(true);
    try {
      // Generate transaction code
      const generatedTransactionCode = `TXN-${Date.now()}`;
      setTransactionCode(generatedTransactionCode);

      // Create conversion record
      const conversionRecord = {
        vendorName: conversionData.vendorName,
        pointBalance: conversionData.pointBalance,
        paymentMethod: conversionData.chosenPaymentMethod,
        conversionAmount: parseInt(conversionData.conversionAmount),
        cashAmount: parseFloat(conversionData.conversionAmount), // 1 point = 1 peso
        requestStatus: 'pending',
        transactionCode: generatedTransactionCode,
        cardNumber: formData.cardNumber,
        date: formData.date
      };

      await addConversion(conversionRecord);
      alert(`Conversion request submitted successfully!\nTransaction Code: ${generatedTransactionCode}`);
      setShowConversionPopup(false);
      setConversionData({
        vendorName: 'POS Vendor',
        pointBalance: 100,
        chosenPaymentMethod: 'gcash',
        conversionAmount: ''
      });
      
      // Reload recent conversions
      await loadRecentConversions();
    } catch (error) {
      console.error('Error submitting conversion:', error);
      alert('Error submitting conversion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertNow = () => {
    // Validate amount before opening popup
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // Validate GCash number if GCash is selected
    if (formData.paymentMethod === 'gcash' && !formData.cardNumber) {
      alert('Please enter GCash number for GCash payments');
      return;
    }

    // Set default values for conversion popup
    setConversionData(prev => ({
      ...prev,
      chosenPaymentMethod: formData.paymentMethod,
      conversionAmount: formData.amount // Reflects user input from main form
    }));
    setShowConversionPopup(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaTimesCircle className="text-yellow-500" />;
      case 'failed':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaTimesCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Request Conversion</h1>
              <p className="text-gray-400">Convert your points to cash through various payment methods</p>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Point Balance</p>
              <p className="text-2xl font-bold text-yellow-400">{conversionData.pointBalance.toLocaleString()} points</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
          <form className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Choose Payment Method</label>
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
                      <IconComponent className={`text-2xl mx-auto mb-2 ${
                        formData.paymentMethod === method.id ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.paymentMethod === method.id ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {method.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Number - Only show for GCash */}
            {formData.paymentMethod === 'gcash' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GCash Number *</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="Enter GCash number"
                  className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₱</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full p-3 pl-8 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-gray-400 text-sm mt-1">Amount must be greater than 0</p>
            </div>

            {/* Convert Now Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleConvertNow}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FaWallet className="text-xl" />
                Convert Now
              </button>
            </div>
          </form>
        </div>

        {/* Recent Conversions Table */}
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Conversions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left text-gray-300 py-3">Date</th>
                  <th className="text-left text-gray-300 py-3">Method</th>
                  <th className="text-left text-gray-300 py-3">Amount</th>
                  <th className="text-left text-gray-300 py-3">Transaction Code</th>
                  <th className="text-left text-gray-300 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentConversions.length > 0 ? (
                  recentConversions.map((conversion) => (
                    <tr key={conversion.id} className="border-b border-gray-700">
                      <td className="text-white py-3">
                        {new Date(conversion.date).toLocaleDateString()}
                      </td>
                      <td className="text-white py-3 capitalize">{conversion.paymentMethod}</td>
                      <td className="text-white py-3">₱{conversion.cashAmount?.toFixed(2) || '0.00'}</td>
                      <td className="text-white py-3 font-mono text-xs">{conversion.transactionCode || 'N/A'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(conversion.requestStatus)}
                          <span className={`capitalize ${
                            conversion.requestStatus === 'completed' ? 'text-green-400' :
                            conversion.requestStatus === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {conversion.requestStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-400 py-8">
                      No conversion requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conversion Popup */}
      {showConversionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Request Conversion</h3>
                <button
                  onClick={() => setShowConversionPopup(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleConversionSubmit} className="space-y-4">
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vendor Name</label>
                  <div className="p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg">
                    <p className="text-white">{conversionData.vendorName}</p>
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Details</label>
                  <div className="p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg">
                    <p className="text-white text-sm">
                      {conversionData.chosenPaymentMethod === 'gcash' 
                        ? `GCash Number: ${formData.cardNumber || 'Not provided'}`
                        : 'Cash Payment'
                      }
                    </p>
                    <p className="text-gray-400 text-xs">Account Type: Business</p>
                  </div>
                </div>

                {/* Point Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Point Balance</label>
                  <div className="p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg">
                    <p className="text-white text-lg font-semibold">{conversionData.pointBalance.toLocaleString()} points</p>
                  </div>
                </div>

                {/* Chosen Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chosen Payment Method</label>
                  <div className="p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg">
                    <p className="text-white capitalize">{formData.paymentMethod}</p>
                  </div>
                </div>

                {/* Conversion Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Point Conversion Amount *
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={conversionData.conversionAmount}
                      className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-gray-400 text-sm">
                      Ex. 120 points → ₱{conversionData.conversionAmount || '0.00'}
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
                      loading 
                        ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {loading ? 'Submitting...' : 'Submit Conversion Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversion;
