import React, { useState } from 'react';
import { addCategory, addMenuItem } from '../firebase/menuService';

const CustomMenuMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');

  const customMenuItems = [
    { name: "Bicol Express", price: 100.00 },
    { name: "Buttered Chicken", price: 100.00 },
    { name: "Chicken Alaking", price: 100.00 },
    { name: "Chicken Barbeque", price: 100.00 },
    { name: "Chicken Garlic Parmesan", price: 100.00 },
    { name: "Chicken Teriyaki", price: 100.00 },
    { name: "Fish Fillet", price: 100.00 },
    { name: "Honey Glazed Chicken", price: 100.00 },
    { name: "Pork Teriyaki", price: 100.00 },
    { name: "Spicy Korean Chicken", price: 100.00 }
  ];

  const handleCustomMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus('Starting custom menu migration...');
    
    try {
      // First, create a "Main Dishes" category
      setMigrationStatus('Creating Main Dishes category...');
      const categoryId = await addCategory({
        name: "Main Dishes",
        icon: "🍽️",
        bgColor: "#e74c3c",
        order: 1,
        isActive: true
      });

      setMigrationStatus('Adding menu items...');
      
      // Add each menu item
      for (let i = 0; i < customMenuItems.length; i++) {
        const item = customMenuItems[i];
        setMigrationStatus(`Adding ${item.name}... (${i + 1}/${customMenuItems.length})`);
        
        await addMenuItem({
          name: item.name,
          price: item.price,
          category: "Main Dishes",
          categoryId: categoryId,
          isAvailable: true,
          description: `Delicious ${item.name.toLowerCase()} dish`,
          tags: ["main", "popular"]
        });
      }

      setMigrationStatus('✅ Custom menu migration completed successfully!');
    } catch (error) {
      setMigrationStatus(`❌ Migration failed: ${error.message}`);
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg m-4 border border-blue-200">
      <h3 className="text-lg font-semibold mb-2 text-blue-800">Custom Menu Migration</h3>
      <p className="text-sm text-blue-600 mb-4">
        This will add your specific menu items to Firebase. Make sure you have set up your Firestore database first.
      </p>
      
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Menu items to be added:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {customMenuItems.map((item, index) => (
            <div key={index} className="flex justify-between bg-white p-2 rounded border">
              <span>{item.name}</span>
              <span className="font-medium">₱{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCustomMigration}
        disabled={isMigrating}
        className={`px-4 py-2 rounded font-medium ${
          isMigrating 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isMigrating ? 'Migrating...' : 'Add Custom Menu Items'}
      </button>
      
      {migrationStatus && (
        <p className={`mt-2 text-sm ${
          migrationStatus.includes('✅') ? 'text-green-600' : 
          migrationStatus.includes('❌') ? 'text-red-600' : 
          'text-blue-600'
        }`}>
          {migrationStatus}
        </p>
      )}
    </div>
  );
};

export default CustomMenuMigration;
