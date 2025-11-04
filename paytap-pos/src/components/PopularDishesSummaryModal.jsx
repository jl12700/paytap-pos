import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const PopularDishesSummaryModal = ({ isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('day'); // 'day', 'week', 'month'
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPopularityData();
    }
  }, [isOpen, selectedPeriod]);

  const fetchPopularityData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate;

      switch (selectedPeriod) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
      }

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(now);

      // Fetch orders
      const ordersRef = collection(db, 'orders');
      let querySnapshot;
      try {
        const q = query(
          ordersRef,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp)
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        console.warn('Query with filters failed, fetching all orders:', error);
        querySnapshot = await getDocs(ordersRef);
      }

      // Count item popularity by total quantity ordered (plus revenue)
      const itemCounts = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt;
        
        // Check if order is within date range
        let shouldInclude = false;
        if (createdAt) {
          const orderDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          shouldInclude = orderDate >= startDate && orderDate <= now;
        } else {
          shouldInclude = true; // Include orders without createdAt
        }

        if (shouldInclude && data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            const itemId = item.id;
            const itemName = item.name;
            const quantity = item.qty || 1;
            
            if (itemId) {
              if (!itemCounts[itemId]) {
                itemCounts[itemId] = {
                  id: itemId,
                  name: itemName,
                  count: 0,
                  totalQuantity: 0,
                  totalRevenue: 0
                };
              }
              itemCounts[itemId].count += quantity; // Count total quantity ordered
              itemCounts[itemId].totalQuantity += quantity;
              itemCounts[itemId].totalRevenue += (item.subtotal || (item.price * quantity) || 0);
            }
          });
        }
      });

      // Fetch menu items to get images and other details
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
        .map((item) => ({
          ...item,
          imageUrl: menuItemsMap[item.id]?.imageUrl || '',
          price: menuItemsMap[item.id]?.price || 0,
          description: menuItemsMap[item.id]?.description || ''
        }))
        .sort((a, b) => b.count - a.count); // Sort by number of orders

      setPopularDishes(dishes);
    } catch (error) {
      console.error('Error fetching popularity data:', error);
      setPopularDishes([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case 'day':
        return now.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1f1f1f] rounded-2xl shadow-lg w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
        >
          <FaTimes />
        </button>

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Dishes Summary</h2>

          {/* Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Period</label>
            <div className="grid grid-cols-3 gap-2">
              {['day', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedPeriod === period
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600 bg-[#2a2a2a] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Display */}
          <div className="mb-6">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Period</p>
              <p className="text-white font-semibold">{formatDateRange()}</p>
            </div>
          </div>

          {/* Dishes List */}
          {loading ? (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
              <div className="animate-pulse text-gray-400">Loading popularity data...</div>
            </div>
          ) : popularDishes.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
              <p className="text-gray-400">No orders found for this period.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {popularDishes.map((dish, index) => (
                <div
                  key={dish.id}
                  className="bg-[#2a2a2a] rounded-lg p-4 flex items-center gap-4 hover:bg-[#333] transition-colors"
                >
                  <div className="bg-[#f6b100] text-[#1f1f1f] font-bold text-xl w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </div>
                  {dish.imageUrl ? (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-bold">
                        {dish.name?.substring(0, 2).toUpperCase() || '??'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{dish.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-gray-400">
                        Quantity: <span className="text-white font-semibold">{dish.count}</span>
                      </span>
                      <span className="text-gray-400">
                        Revenue: <span className="text-green-400 font-semibold">₱{dish.totalRevenue.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopularDishesSummaryModal;

