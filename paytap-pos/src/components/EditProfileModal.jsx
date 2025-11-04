import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { signOutUser, getCurrentUser } from '../firebase/authService';
import { useNavigate } from 'react-router-dom';

const EditProfileModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const result = await signOutUser();
      if (result.success) {
        navigate('/auth');
      } else {
        alert('Error logging out: ' + result.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred while logging out.');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'John Veneracion'; // Fallback
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={onClose}>
      <div className='bg-[#1a1a1a] shadow-lg w-full max-w-md mx-4 rounded-lg' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='flex justify-between items-center px-6 py-4 border-b border-gray-700'>
          <h2 className='text-xl text-[#f5f5f5] font-semibold'>Edit Profile</h2>
          <button 
            className='text-gray-500 text-2xl hover:text-gray-300 transition' 
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* User Info */}
          <div className='flex items-center gap-4 mb-6'>
            <FaUserCircle className='text-[#f5f5f5] text-5xl' />
            <div className='flex flex-col'>
              <h3 className='text-lg text-[#f5f5f5] font-semibold'>{getUserDisplayName()}</h3>
              <p className='text-sm text-gray-400'>{getUserEmail()}</p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className='space-y-4 mb-6'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Display Name
              </label>
              <input
                type='text'
                defaultValue={getUserDisplayName()}
                className='w-full bg-[#2a2a2a] text-[#f5f5f5] px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter display name'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Email
              </label>
              <input
                type='email'
                value={getUserEmail()}
                disabled
                className='w-full bg-[#2a2a2a] text-gray-500 px-4 py-2 rounded-lg border border-gray-600 cursor-not-allowed'
              />
              <p className='text-xs text-gray-400 mt-1'>Email cannot be changed</p>
            </div>
          </div>

          {/* Logout Button */}
          <div className='border-t border-gray-700 pt-4'>
            <button
              onClick={handleLogout}
              disabled={loading}
              className='w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FaSignOutAlt />
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

