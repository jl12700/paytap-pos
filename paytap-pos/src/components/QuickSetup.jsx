import React, { useState } from 'react';
import { addCategory, addMenuItem } from '../firebase/menuService';

const QuickSetup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStatus, setSetupStatus] = useState('');

  const quickSetupData = {
    categories: [
      { name: "Main Dishes", icon: "🍽️", bgColor: "#e74c3c", order: 1 },
      { name: "Appetizers", icon: "🥗", bgColor: "#27ae60", order: 2 },
      { name: "Beverages", icon: "🥤", bgColor: "#3498db", order: 3 },
      { name: "Desserts", icon: "🍰", bgColor: "#9b59b6", order: 4 }
    ],
    sampleItems: [
      { name: "Bicol Express", price: 100.00, category: "Main Dishes" },
      { name: "Buttered Chicken", price: 100.00, category: "Main Dishes" },
      { name: "Chicken Alaking", price: 100.00, category: "Main Dishes" },
      { name: "Chicken Barbeque", price: 100.00, category: "Main Dishes" },
      { name: "Chicken Garlic Parmesan", price: 100.00, category: "Main Dishes" },
      { name: "Chicken Teriyaki", price: 100.00, category: "Main Dishes" },
      { name: "Fish Fillet", price: 100.00, category: "Main Dishes" },
      { name: "Honey Glazed Chicken", price: 100.00, category: "Main Dishes" },
      { name: "Pork Teriyaki", price: 100.00, category: "Main Dishes" },
      { name: "Spicy Korean Chicken", price: 100.00, category: "Main Dishes" },
      { name: "Caesar Salad", price: 80.00, category: "Appetizers" },
      { name: "Chicken Wings", price: 120.00, category: "Appetizers" },
      { name: "Coca Cola", price: 25.00, category: "Beverages" },
      { name: "Orange Juice", price: 30.00, category: "Beverages" },
      { name: "Ice Cream", price: 50.00, category: "Desserts" },
      { name: "Chocolate Cake", price: 80.00, category: "Desserts" }
    ]
  };

  const handleQuickSetup = async () => {
    setIsSettingUp(true);
    setSetupStatus('Starting quick setup...');
    
    try {
      // Add categories first
      setSetupStatus('Creating categories...');
      const categoryMap = {};
      
      for (const category of quickSetupData.categories) {
        const categoryId = await addCategory(category);
        categoryMap[category.name] = categoryId;
        setSetupStatus(`Created category: ${category.name}`);
      }

      // Add sample menu items
      setSetupStatus('Adding sample menu items...');
      let addedCount = 0;
      
      for (const item of quickSetupData.sampleItems) {
        const categoryId = categoryMap[item.category];
        if (categoryId) {
          await addMenuItem({
            name: item.name,
            price: item.price,
            category: item.category,
            categoryId: categoryId,
            isAvailable: true,
            description: `Delicious ${item.name.toLowerCase()}`,
            tags: []
          });
          addedCount++;
          setSetupStatus(`Added ${addedCount}/${quickSetupData.sampleItems.length} items...`);
        }
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
              This will create sample categories and menu items to get you started quickly. 
              You can always modify or add more items later using the menu manager.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Categories ({quickSetupData.categories.length})</h3>
                <ul className="text-sm text-blue-600 space-y-1">
                  {quickSetupData.categories.map((cat, index) => (
                    <li key={index}>{cat.icon} {cat.name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Sample Items ({quickSetupData.sampleItems.length})</h3>
                <ul className="text-sm text-green-600 space-y-1 max-h-32 overflow-y-auto">
                  {quickSetupData.sampleItems.map((item, index) => (
                    <li key={index}>{item.name} - ₱{item.price}</li>
                  ))}
                </ul>
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

export default QuickSetup;
