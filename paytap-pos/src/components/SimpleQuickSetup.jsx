import React, { useState } from 'react';
import { addMenuItem } from '../firebase/menuService';

const SimpleQuickSetup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStatus, setSetupStatus] = useState('');

  const sampleMenuItems = [
    { name: "Bicol Express", price: 100.00, description: "Spicy coconut milk stew with pork" },
    { name: "Buttered Chicken", price: 100.00, description: "Creamy butter chicken curry" },
    { name: "Chicken Alaking", price: 100.00, description: "Traditional Filipino chicken dish" },
    { name: "Chicken Barbeque", price: 100.00, description: "Grilled chicken with special marinade" },
    { name: "Chicken Garlic Parmesan", price: 100.00, description: "Crispy chicken with garlic parmesan" },
    { name: "Chicken Teriyaki", price: 100.00, description: "Japanese-style teriyaki chicken" },
    { name: "Fish Fillet", price: 100.00, description: "Fresh fish fillet with herbs" },
    { name: "Honey Glazed Chicken", price: 100.00, description: "Sweet honey glazed chicken" },
    { name: "Pork Teriyaki", price: 100.00, description: "Tender pork with teriyaki sauce" },
    { name: "Spicy Korean Chicken", price: 100.00, description: "Korean-style spicy chicken" }
  ];

  const handleQuickSetup = async () => {
    setIsSettingUp(true);
    setSetupStatus('Starting quick setup...');
    
    try {
      setSetupStatus('Adding sample menu items...');
      let addedCount = 0;
      
      for (const item of sampleMenuItems) {
        await addMenuItem({
          name: item.name,
          price: item.price,
          description: item.description,
          isAvailable: true
        });
        addedCount++;
        setSetupStatus(`Added ${addedCount}/${sampleMenuItems.length} items...`);
      }

      setSetupStatus('✅ Quick setup completed successfully! You can now manage your menu using the + button.');
      setTimeout(() => {
        setIsOpen(false);
        setSetupStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Quick setup error:', error);
      setSetupStatus(`❌ Setup failed: ${error.message}`);
    } finally {
      setIsSettingUp(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          🚀 Quick Setup
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Quick Setup</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will add sample menu items to get you started quickly. 
              You can always modify or add more items later using the menu manager.
            </p>

            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-green-800 mb-2">Sample Menu Items ({sampleMenuItems.length})</h3>
              <div className="grid grid-cols-2 gap-2 text-sm max-h-32 overflow-y-auto">
                {sampleMenuItems.map((item, index) => (
                  <div key={index} className="flex justify-between bg-white p-2 rounded border">
                    <span>{item.name}</span>
                    <span className="font-medium">₱{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {setupStatus && (
            <div className={`p-4 rounded-lg mb-4 ${
              setupStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
              setupStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {setupStatus}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleQuickSetup}
              disabled={isSettingUp}
              className={`flex-1 py-3 px-6 rounded-lg font-medium ${
                isSettingUp 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isSettingUp ? 'Setting up...' : 'Start Quick Setup'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Skip Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleQuickSetup;
