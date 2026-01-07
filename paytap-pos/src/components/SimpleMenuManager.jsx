import React, { useState, useEffect } from 'react';
import { addMenuItem, getMenuItems, updateMenuItem, deleteMenuItem } from '../firebase/menuService';
import { verifyOwnerCredentials, hasOwnerCredentials } from '../firebase/ownerAuthService';
import { FaEdit, FaTrash, FaTimes, FaSave, FaLock } from 'react-icons/fa';

const SimpleMenuManager = ({ isOpen, onClose }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Form state
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    description: '',
    isAvailable: true
  });

  const loadMenuItems = async () => {
    setLoading(true);
    try {
      const itemsData = await getMenuItems();
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error loading menu items:', error);
      alert('Error loading menu items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Check if credentials are set and show auth modal
      checkCredentials();
    } else {
      // Reset authentication state when modal closes
      setIsAuthenticated(false);
      setShowAuthModal(false);
      setAuthForm({ username: '', password: '' });
      setAuthError('');
    }
  }, [isOpen]);

  const checkCredentials = async () => {
    try {
      const hasCredentials = await hasOwnerCredentials();
      if (!hasCredentials) {
        setIsFirstTime(true);
      }
      setShowAuthModal(true);
    } catch (error) {
      console.error('Error checking credentials:', error);
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const isValid = await verifyOwnerCredentials(authForm.username, authForm.password);
      if (isValid) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthForm({ username: '', password: '' });
        // Load menu items after successful authentication
        await loadMenuItems();
      } else {
        setAuthError('Invalid username or password');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCancelAuth = () => {
    setShowAuthModal(false);
    setAuthForm({ username: '', password: '' });
    setAuthError('');
    setIsAuthenticated(false);
    setIsFirstTime(false);
    onClose(); // Close the menu manager if auth is cancelled
  };

  const handleClose = () => {
    // Reset authentication state when closing
    setIsAuthenticated(false);
    setShowAuthModal(false);
    setAuthForm({ username: '', password: '' });
    setAuthError('');
    setIsFirstTime(false);
    setEditingItem(null);
    setItemForm({ name: '', price: '', description: '', isAvailable: true });
    onClose();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) {
      alert('Please fill in name and price');
      return;
    }

    setLoading(true);
    try {
      await addMenuItem(itemForm);
      setItemForm({ name: '', price: '', description: '', isAvailable: true });
      await loadMenuItems();
      alert('Menu item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description || '',
      isAvailable: item.isAvailable
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMenuItem(editingItem.id, itemForm);
      setEditingItem(null);
      setItemForm({ name: '', price: '', description: '', isAvailable: true });
      await loadMenuItems();
      alert('Menu item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    setLoading(true);
    try {
      await deleteMenuItem(itemId);
      await loadMenuItems();
      alert('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show authentication modal if not authenticated
  if (showAuthModal && !isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCancelAuth}>
        <div className="bg-[#1a1a1a] rounded-lg w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <FaLock className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold text-[#f5f5f5]">Owner Verification</h2>
            </div>
            <button
              onClick={handleCancelAuth}
              className="text-gray-500 hover:text-gray-300 transition"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="p-6">
            {isFirstTime ? (
              <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>First Time Setup:</strong> Please set your owner username and password to secure menu management access.
                </p>
              </div>
            ) : (
              <p className="text-gray-300 mb-6 text-center">
                Please enter your owner credentials to access menu management
              </p>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                  className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full p-3 bg-[#2a2a2a] border border-gray-600 rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">{authError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-semibold disabled:opacity-50 transition"
                >
                  {authLoading ? 'Verifying...' : (isFirstTime ? 'Set Credentials' : 'Verify')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAuth}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show menu manager content only if authenticated
  if (!isAuthenticated) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FaLock className="text-green-500" size={20} />
            <h2 className="text-2xl font-bold text-[#f5f5f5]">Menu Items Manager</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-300 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Add Item Form */}
          <div className="bg-[#2a2a2a] p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[#f5f5f5]">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  className="w-full p-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Bicol Express"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                  className="w-full p-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100.00"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  className="w-full p-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={itemForm.isAvailable}
                  onChange={(e) => setItemForm({...itemForm, isAvailable: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-300">
                  Available for ordering
                </label>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 transition"
                >
                  <FaSave />
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setItemForm({ name: '', price: '', description: '', isAvailable: true });
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-4">
              Menu Items ({menuItems.length})
            </h3>
            {menuItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#2a2a2a] border border-gray-600 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-[#f5f5f5]">{item.name}</h4>
                    {!item.isAvailable && (
                      <span className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded">Unavailable</span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-400">₱{item.price}</p>
                  {item.description && (
                    <p className="text-sm text-gray-400">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="text-blue-400 hover:text-blue-300 p-2 transition"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 p-2 transition"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            {menuItems.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No menu items yet. Add your first item above!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMenuManager;
