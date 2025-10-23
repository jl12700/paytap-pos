import React, { useState } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { useMenuData } from "../../hooks/useMenuData";

const MenuContainer = () => {
  const { menuItems, loading, error } = useMenuData();
  // Change: Use object to track counts for each item individually
  const [itemCounts, setItemCounts] = useState({});
  const [itemId, setItemId] = useState();
  const dispatch = useDispatch();

  const increment = (id) => {
    setItemCounts(prev => {
      const currentCount = prev[id] || 0;
      if (currentCount >= 4) return prev;
      return {
        ...prev,
        [id]: currentCount + 1
      };
    });
  };

  const decrement = (id) => {
    setItemCounts(prev => {
      const currentCount = prev[id] || 0;
      if (currentCount <= 0) return prev;
      return {
        ...prev,
        [id]: currentCount - 1
      };
    });
  };

  // Helper function to get count for specific item
  const getItemCount = (id) => {
    return itemCounts[id] || 0;
  };

  const handleAddToCart = (item) => {
    const itemCount = getItemCount(item.id);
    if(itemCount === 0) return;

    const {name, price} = item;
    const newObj = { id: new Date(), name, pricePerQuantity: price, quantity: itemCount, price: price * itemCount };

    dispatch(addItems(newObj));
    // Reset only this specific item's count after adding to cart
    setItemCounts(prev => ({
      ...prev,
      [item.id]: 0
    }));
  }


  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading menu...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-xl">Error loading menu: {error.message}</div>
      </div>
    );
  }

  // No data state
  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">No menu items available. Add some items using the + button.</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-10 py-4">
        <h2 className="text-[#f5f5f5] text-2xl font-bold mb-4">Menu Items</h2>
      </div>

      <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
        {menuItems.map((item) => {
          return (
            <div
              key={item.id}
              className="flex flex-col items-start justify-between p-4 rounded-lg h-[150px] cursor-pointer hover:bg-[#2a2a2a] bg-[#1a1a1a]"
            >
              <div className="flex items-start justify-between w-full">
                <h1 className="text-[#f5f5f5] text-lg font-semibold">
                  {item.name}
                </h1>
                <button onClick={() => handleAddToCart(item)} className="bg-[#2e4a40] text-[#02ca3a] p-2 rounded-lg"><FaShoppingCart size={20} /></button>
              </div>
              <div className="flex items-center justify-between w-full">
                <p className="text-[#f5f5f5] text-xl font-bold">
                  ₱ {item.price}
                </p>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg gap-6 w-[50%]">
                  <button
                    onClick={() => decrement(item.id)}
                    className="text-yellow-500 text-2xl"
                  >
                    &minus;
                  </button>
                  <span className="text-white">
                    {getItemCount(item.id)}
                  </span>
                  <button
                    onClick={() => increment(item.id)}
                    className="text-yellow-500 text-2xl"
                  >
                    &#43;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MenuContainer;