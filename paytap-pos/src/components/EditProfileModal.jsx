import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaSignOutAlt, FaSave } from 'react-icons/fa';
import { signOutUser, getCurrentUser, updateUserProfile } from '../firebase/authService';
import { getBusinessName, updateBusinessName } from '../firebase/pointsService';
import { useNavigate } from 'react-router-dom';

const EditProfileModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showNameConfirm, setShowNameConfirm] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [originalBusinessName, setOriginalBusinessName] = useState('');
  const [showBusinessNameConfirm, setShowBusinessNameConfirm] = useState(false);
  const [updatingBusinessName, setUpdatingBusinessName] = useState(false);
  const [loadingBusinessName, setLoadingBusinessName] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setShowLogoutConfirm(false); // Reset confirmation state when modal opens
      setShowNameConfirm(false); // Reset name confirmation state
      setShowBusinessNameConfirm(false); // Reset business name confirmation state
      // Set initial display name value
      if (currentUser?.displayName) {
        setDisplayName(currentUser.displayName);
      } else if (currentUser?.email) {
        setDisplayName(currentUser.email.split('@')[0]);
      } else {
        setDisplayName('');
      }
      // Load business name
      loadBusinessName();
    }
  }, [isOpen, user]);

  const loadBusinessName = async () => {
    try {
      setLoadingBusinessName(true);
      const currentUser = getCurrentUser();
      if (currentUser) {
        const businessNameValue = await getBusinessName(currentUser.uid);
        setBusinessName(businessNameValue || '');
        setOriginalBusinessName(businessNameValue || '');
      } else {
        setBusinessName('');
        setOriginalBusinessName('');
      }
    } catch (error) {
      console.error('Error loading business name:', error);
      setBusinessName('');
      setOriginalBusinessName('');
    } finally {
      setLoadingBusinessName(false);
    }
  };

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
      setShowLogoutConfirm(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSaveDisplayName = () => {
    if (!displayName || displayName.trim() === '') {
      alert('Display name cannot be empty');
      return;
    }
    setShowNameConfirm(true);
  };

  const handleConfirmNameChange = async () => {
    setUpdatingName(true);
    try {
      const result = await updateUserProfile(displayName);
      if (result.success) {
        // Refresh user data
        const updatedUser = getCurrentUser();
        setUser(updatedUser);
        setShowNameConfirm(false);
        alert('Display name updated successfully!');
        // Trigger a page refresh to update Header display name
        window.location.reload();
      } else {
        alert('Error updating display name: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      alert('An error occurred while updating display name.');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleCancelNameChange = () => {
    setShowNameConfirm(false);
    // Reset to original display name
    if (user?.displayName) {
      setDisplayName(user.displayName);
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
  };

  const handleSaveBusinessName = () => {
    // Allow empty business name (optional field)
    setShowBusinessNameConfirm(true);
  };

  const handleConfirmBusinessNameChange = async () => {
    setUpdatingBusinessName(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please log in to update business name');
        return;
      }

      await updateBusinessName(currentUser.uid, businessName.trim());
      setOriginalBusinessName(businessName.trim());
      setShowBusinessNameConfirm(false);
      alert('Business name updated successfully!');
    } catch (error) {
      console.error('Error updating business name:', error);
      alert('An error occurred while updating business name.');
    } finally {
      setUpdatingBusinessName(false);
    }
  };

  const handleCancelBusinessNameChange = () => {
    setShowBusinessNameConfirm(false);
    // Reset to original business name
    setBusinessName(originalBusinessName);
  };

  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Vendor Name'; // Fallback
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
              <div className='flex gap-2'>
              <input
                type='text'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className='flex-1 bg-[#2a2a2a] text-[#f5f5f5] px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter display name'
                  disabled={showNameConfirm || updatingName}
                />
                <button
                  onClick={handleSaveDisplayName}
                  disabled={showNameConfirm || updatingName || !displayName || displayName.trim() === '' || displayName === getUserDisplayName()}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <FaSave />
                  Save
                </button>
              </div>
              {showNameConfirm && (
                <div className='mt-3 p-3 bg-[#2a2a2a] border border-blue-500 rounded-lg'>
                  <p className='text-gray-300 text-sm mb-3'>
                    Are you sure you want to change your display name to <span className='font-semibold text-white'>"{displayName}"</span>?
                  </p>
                  <div className='flex gap-2'>
                    <button
                      onClick={handleConfirmNameChange}
                      disabled={updatingName}
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {updatingName ? 'Updating...' : 'Confirm'}
                    </button>
                    <button
                      onClick={handleCancelNameChange}
                      disabled={updatingName}
                      className='flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Business Name
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className='flex-1 bg-[#2a2a2a] text-[#f5f5f5] px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter business name'
                  disabled={showBusinessNameConfirm || updatingBusinessName || loadingBusinessName}
                />
                <button
                  onClick={handleSaveBusinessName}
                  disabled={showBusinessNameConfirm || updatingBusinessName || loadingBusinessName || businessName === originalBusinessName}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <FaSave />
                  Save
                </button>
              </div>
              {loadingBusinessName && (
                <p className='text-xs text-gray-400 mt-1'>Loading...</p>
              )}
              {showBusinessNameConfirm && (
                <div className='mt-3 p-3 bg-[#2a2a2a] border border-blue-500 rounded-lg'>
                  <p className='text-gray-300 text-sm mb-3'>
                    {businessName.trim() === '' ? (
                      'Are you sure you want to clear your business name?'
                    ) : (
                      <>Are you sure you want to change your business name to <span className='font-semibold text-white'>"{businessName}"</span>?</>
                    )}
                  </p>
                  <div className='flex gap-2'>
                    <button
                      onClick={handleConfirmBusinessNameChange}
                      disabled={updatingBusinessName}
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {updatingBusinessName ? 'Updating...' : 'Confirm'}
                    </button>
                    <button
                      onClick={handleCancelBusinessNameChange}
                      disabled={updatingBusinessName}
                      className='flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
            {!showLogoutConfirm ? (
            <button
                onClick={handleLogoutClick}
              disabled={loading}
              className='w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FaSignOutAlt />
                Logout
              </button>
            ) : (
              <div className='space-y-3'>
                <p className='text-gray-300 text-sm text-center mb-2'>
                  Are you sure you want to logout?
                </p>
                <div className='flex gap-3'>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className='flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {loading ? 'Logging out...' : 'Yes'}
                  </button>
                  <button
                    onClick={handleCancelLogout}
                    disabled={loading}
                    className='flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    No
            </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

