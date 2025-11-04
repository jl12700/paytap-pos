import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import PopularDishesSummaryModal from './PopularDishesSummaryModal';

const PopularDishes = () => {
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    fetchPopularDishes();
  }, []);

  const fetchPopularDishes = async () => {
    setLoading(true);
    try {
      // Fetch all orders (for all time popularity)
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);

      // Count item popularity by total quantity ordered
      const itemCounts = {};
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            const itemId = item.id;
            const itemName = item.name;
            const quantity = item.qty || 1;
            
            if (itemId) {
              if (!itemCounts[itemId]) {
                itemCounts[itemId] = {
                  id: itemId,
                  name: itemName,
                  count: 0
                };
              }
              itemCounts[itemId].count += quantity; // Count total quantity ordered
            }
          });
        }
      });

      // Fetch menu items to get images
      const menuItemsRef = collection(db, 'menuItems');
      const menuItemsSnapshot = await getDocs(menuItemsRef);
      const menuItemsMap = {};
      menuItemsSnapshot.forEach((doc) => {
        menuItemsMap[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      // Combine popularity data with menu item details
      const dishes = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count) // Sort by popularity
        .slice(0, 10); // Show top 10

      setPopularDishes(dishes);
    } catch (error) {
      console.error('Error fetching popular dishes:', error);
      setPopularDishes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6 pr-6">
        <div className="bg-[#1a1a1a] w-full rounded-lg">
          <div className="flex justify-between items-center px-6 py-4">
            <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
              Popular Dishes
            </h1>
            <button
              onClick={() => setShowSummaryModal(true)}
              className="text-[#025cca] text-sm font-semibold hover:underline"
            >
              Summary
            </button>
          </div>

          <div className="overflow-y-scroll h-[680px] scrollbar-hide">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading popular dishes...</p>
              </div>
            ) : popularDishes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No popular dishes found.</p>
              </div>
            ) : (
              popularDishes.map((dish, index) => {
                return (
                  <div
                    key={dish.id}
                    className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6"
                  >
                    <h1 className="text-[#f5f5f5] font-bold text-xl mr-4">
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </h1>
                    <div className="w-[50px] h-[50px] rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {dish.name?.substring(0, 2).toUpperCase() || '??'}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-[#f5f5f5] font-semibold tracking-wide">{dish.name}</h1>
                      <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                        <span className="text-[#ababab]">Quantity: </span>
                        {dish.count}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      <PopularDishesSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
      />
    </>
  );
};

export default PopularDishes;