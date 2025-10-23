import React, { useState } from 'react';
import { addMenuItem, addCategory, getCategories, getMenuItems } from '../firebase/menuService';

const AdminPanel = () => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '',
    bgColor: '#b73e3e',
    order: 1
  });

  // Menu item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    category: '',
    categoryId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, itemsData] = await Promise.all([
        getCategories(),
        getMenuItems()
      ]);
      setCategories(categoriesData);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addCategory(categoryForm);
      setCategoryForm({ name: '', icon: '', bgColor: '#b73e3e', order: 1 });
      setShowAddCategory(false);
      await loadData();
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMenuItem({
        ...itemForm,
        price: parseFloat(itemForm.price),
        isAvailable: true
      });
      setItemForm({ name: '', price: '', category: '', categoryId: '' });
      setShowAddItem(false);
      await loadData();
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Categories ({categories.length})</h2>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Category
          </button>
          <div className="mt-4 space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{category.icon} {category.name}</span>
                <span className="text-sm text-gray-500">Order: {category.order}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Menu Items ({menuItems.length})</h2>
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Menu Item
          </button>
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {menuItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{item.name}</span>
                <span className="text-sm text-gray-500">₱{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Add Category</h3>
            <form onSubmit={handleAddCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Icon</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="🍲"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <input
                  type="color"
                  value={categoryForm.bgColor}
                  onChange={(e) => setCategoryForm({...categoryForm, bgColor: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Order</label>
                <input
                  type="number"
                  value={categoryForm.order}
                  onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Add Menu Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => {
                    const selectedCategory = categories.find(cat => cat.id === e.target.value);
                    setItemForm({
                      ...itemForm, 
                      categoryId: e.target.value,
                      category: selectedCategory?.name || ''
                    });
                  }}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
