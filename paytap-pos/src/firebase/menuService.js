import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';

// Collection reference for menu items only
const menuItemsRef = collection(db, 'menuItems');

// Simplified menu item operations (no categories)

// Menu item operations
export const getMenuItems = async () => {
  try {
    const q = query(menuItemsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

export const addMenuItem = async (itemData) => {
  try {
    const docRef = await addDoc(menuItemsRef, {
      name: itemData.name,
      price: parseFloat(itemData.price),
      description: itemData.description || '',
      isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (itemId, updateData) => {
  try {
    const itemDoc = doc(db, 'menuItems', itemId);
    await updateDoc(itemDoc, {
      name: updateData.name,
      price: parseFloat(updateData.price),
      description: updateData.description || '',
      isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

export const deleteMenuItem = async (itemId) => {
  try {
    const itemDoc = doc(db, 'menuItems', itemId);
    await deleteDoc(itemDoc);
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

// Bulk operations for initial data migration
export const addMultipleMenuItems = async (items) => {
  try {
    const promises = items.map(item => addMenuItem(item));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error adding multiple menu items:', error);
    throw error;
  }
};
