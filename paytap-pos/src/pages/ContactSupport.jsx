import React, { useState, useEffect } from 'react';
import { FaQuestionCircle, FaCheckCircle, FaTimesCircle, FaClock, FaHistory } from 'react-icons/fa';
import { addSupportTicket, getSupportTicketsByUser } from '../firebase/supportService';
import { getCurrentUser } from '../firebase/authService';
import BackButton from '../components/shared/BackButton';
import BottomNav from '../components/shared/BottomNav';

const ContactSupport = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    details: ''
  });

  const [loading, setLoading] = useState(false);
  const [allTickets, setAllTickets] = useState([]);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const categories = [
    { id: 'technical', name: 'Technical Issue', icon: '🔧' },
    { id: 'payment', name: 'Payment Issue', icon: '💳' },
    { id: 'account', name: 'Account Issue', icon: '👤' },
    { id: 'feature', name: 'Feature Request', icon: '💡' },
    { id: 'bug', name: 'Bug Report', icon: '🐛' },
    { id: 'other', name: 'Other', icon: '❓' }
  ];

  const statusOptions = [
    { id: 'pending', name: 'Pending', icon: FaClock, color: 'text-yellow-500' },
    { id: 'in-progress', name: 'In Progress', icon: FaClock, color: 'text-blue-500' },
    { id: 'resolved', name: 'Resolved', icon: FaCheckCircle, color: 'text-green-500' },
    { id: 'closed', name: 'Closed', icon: FaTimesCircle, color: 'text-gray-500' }
  ];

  useEffect(() => {
    loadUserTickets();
  }, []);

  const loadUserTickets = async () => {
    try {
      setLoadingTickets(true);
      const currentUser = getCurrentUser();
      if (currentUser) {
        const tickets = await getSupportTicketsByUser(currentUser.uid);
        setAllTickets(tickets);
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.category || !formData.details) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please log in to submit a support ticket');
        return;
      }

      // Prepare ticket data with user information - status always defaults to 'pending'
      const ticketData = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'Unknown',
        vendorName: currentUser.email || 'Unknown Vendor',
        subject: formData.subject,
        category: formData.category,
        status: 'pending', // Always default to pending when submitting
        details: formData.details,
        // Additional metadata for admin
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Configured' : 'Not Configured',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Unknown',
        timestamp: new Date().toISOString(),
        ticketNumber: `TICKET-${Date.now()}`
      };

      await addSupportTicket(ticketData);
      
      setTicketSubmitted(true);
      setTimeout(() => {
        setTicketSubmitted(false);
      }, 3000);

      // Reset form
      setFormData({
        subject: '',
        category: '',
        details: ''
      });

      // Reload tickets
      await loadUserTickets();

      alert(`Support ticket submitted successfully!\nTicket Number: ${ticketData.ticketNumber}`);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      alert('Error submitting support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(s => s.id === status);
    if (!statusOption) return <FaClock className="text-gray-500" />;
    const IconComponent = statusOption.icon;
    return <IconComponent className={statusOption.color} />;
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.id === status);
    if (!statusOption) return null;
    const IconComponent = statusOption.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusOption.color} bg-opacity-20`}>
        <IconComponent className={statusOption.color} />
        {statusOption.name}
      </span>
    );
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-4rem)] pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div className="flex items-center gap-3">
            <FaQuestionCircle className="text-blue-500 text-3xl" />
            <h1 className="text-2xl font-bold text-white">Contact Support</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Submit a Support Request</h2>

            {/* Success Message */}
            {ticketSubmitted && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                <p className="text-green-400 text-sm">Ticket submitted successfully!</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter ticket subject"
                  className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Category *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.category === category.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 bg-[#1a1a1a] hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{category.icon}</span>
                      <span
                        className={`text-sm font-medium block ${
                          formData.category === category.id ? 'text-blue-400' : 'text-gray-400'
                        }`}
                      >
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Details *
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder="Describe your issue or request in detail..."
                  rows="6"
                  className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>

          {/* Right Column - Request History */}
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaHistory className="text-blue-500 text-xl" />
              <h2 className="text-xl font-semibold text-white">Request History</h2>
            </div>

            {loadingTickets ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading tickets...</p>
              </div>
            ) : allTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No support tickets yet.</p>
                <p className="text-gray-500 text-xs mt-2">Submit your first ticket using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {allTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-white">{ticket.subject}</h3>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          Category: {getCategoryName(ticket.category)}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          Ticket: {ticket.ticketNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ticket.createdAt?.toDate?.()?.toLocaleString() || 
                           ticket.timestamp ? new Date(ticket.timestamp).toLocaleString() : 
                           'Recently'}
                        </p>
                      </div>
                    </div>
                    {ticket.details && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-xs text-gray-400 line-clamp-2">{ticket.details}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default ContactSupport;
