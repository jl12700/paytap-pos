import { useState, useEffect } from 'react';
import { getMenuItems } from '../firebase/menuService';

export const useMenuData = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenuItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const itemsData = await getMenuItems();
      setMenuItems(itemsData);
    } catch (err) {
      setError(err);
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenuItems
  };
};
