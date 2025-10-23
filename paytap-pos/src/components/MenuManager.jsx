import React, { useState, useEffect } from 'react';
import { addMenuItem, addCategory, getCategories, getMenuItems, updateMenuItem, deleteMenuItem, updateCategory, deleteCategory } from '../firebase/menuService';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSave } from 'react-icons/fa';

const MenuManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'categories'
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    isAvailable: true
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '🍽️',
    bgColor: '#e74c3c',
    order: 1
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
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === itemForm.categoryId);
      await addMenuItem({
        ...itemForm,
        price: parseFloat(itemForm.price),
        category: selectedCategory?.name || '',
        tags: []
      });
      
      setItemForm({ name: '', price: '', categoryId: '', description: '', isAvailable: true });
      await loadData();
      alert('Menu item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      alert('Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      await addCategory(categoryForm);
      setCategoryForm({ name: '', icon: '🍽️', bgColor: '#e74c3c', order: 1 });
      await loadData();
      alert('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price.toString(),
      categoryId: item.categoryId,
      description: item.description || '',
      isAvailable: item.isAvailable
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === itemForm.categoryId);
      await updateMenuItem(editingItem.id, {
        ...itemForm,
        price: parseFloat(itemForm.price),
        category: selectedCategory?.name || ''
      });
      
      setEditingItem(null);
      setItemForm({ name: '', price: '', categoryId: '', description: '', isAvailable: true });
      await loadData();
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
      await loadData();
      alert('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all menu items in this category.')) return;
    
    setLoading(true);
    try {
      await deleteCategory(categoryId);
      await loadData();
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-200 hover:scale-105"
        title="Manage Menu"
      >
        <FaPlus size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Menu Manager</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'items' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu Items ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'categories' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'items' && (
            <div>
              {/* Add Item Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bicol Express"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({...itemForm, categoryId: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaSave />
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setItemForm({ name: '', price: '', categoryId: '', description: '', isAvailable: true });
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {menuItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">₱{item.price}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-500 hover:text-blue-700 p-2"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {menuItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No menu items yet. Add your first item above!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              {/* Add Category Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Main Dishes"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="🍽️"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={categoryForm.bgColor}
                      onChange={(e) => setCategoryForm({...categoryForm, bgColor: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input
                      type="number"
                      value={categoryForm.order}
                      onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaPlus />
                      Add Category
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">{category.name}</h4>
                        <p className="text-xs text-gray-500">Order: {category.order}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No categories yet. Add your first category above!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
