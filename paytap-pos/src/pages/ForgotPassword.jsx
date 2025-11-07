import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordReset } from '../firebase/authService';
import logo from '../assets/images/logo.png';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await sendPasswordReset(email);
      
      if (result.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(result.error || 'Failed to send password reset email. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center px-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logo} 
            alt="PayTap Logo" 
            className="w-32 h-32 mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-2">Enter your email to receive reset instructions</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <div className="flex items-start gap-3">
              <FaEnvelope className="text-green-400 text-xl mt-0.5" />
              <div>
                <p className="text-green-400 font-semibold mb-1">Email Sent!</p>
                <p className="text-green-300 text-sm">
                  Password reset instructions have been sent to your email address. 
                  Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                autoComplete="email"
                className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white focus:outline-none focus:ring-2 transition ${
                  error && !success
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Enter your email address"
                disabled={loading}
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
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-gray-300 text-sm text-center">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </div>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition"
          >
            <FaArrowLeft />
            Back to Sign In
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

