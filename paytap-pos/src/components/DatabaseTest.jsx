import React, { useState } from 'react';
import { addMenuItem, getMenuItems } from '../firebase/menuService';

const DatabaseTest = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const testDatabaseConnection = async () => {
    setIsTesting(true);
    setTestStatus('Testing database connection...');
    
    try {
      // Test 1: Try to add a test menu item
      setTestStatus('Adding test menu item...');
      const testItemId = await addMenuItem({
        name: 'Test Item',
        price: 99.99,
        description: 'This is a test item for database connection',
        isAvailable: true
      });
      
      setTestStatus('Test menu item added successfully!');
      
      // Test 2: Try to read menu items
      setTestStatus('Reading menu items from database...');
      const menuItems = await getMenuItems();
      
      setTestStatus(`✅ Database connection successful! Found ${menuItems.length} menu items.`);
      
      // Clean up: Remove test item
      setTimeout(async () => {
        try {
          // Note: We would need to implement deleteMenuItem in menuService
          setTestStatus('✅ Database test completed successfully!');
        } catch (error) {
          console.log('Cleanup error (not critical):', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Database test error:', error);
      setTestStatus(`❌ Database connection failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          🔧 Test Database
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Database Connection Test</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              This will test if your Firebase database is properly connected and working.
            </p>
            
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Before testing:</strong>
              <br />1. Make sure you've set up Firestore Database
              <br />2. Make sure your .env file has correct Firebase config
              <br />3. Make sure you've restarted your dev server after adding .env
              <br />4. This will add a test menu item to your database
            </p>
            </div>
          </div>

          {testStatus && (
            <div className={`p-3 rounded-lg mb-4 ${
              testStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
              testStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {testStatus}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={testDatabaseConnection}
              disabled={isTesting}
              className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                isTesting 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest;
