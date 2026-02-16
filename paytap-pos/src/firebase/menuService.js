import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser } from './authService';

// ✅ Get menu items for LOGGED-IN vendor (for POS dashboard)
export const getMenuItems = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please log in.');
    }

    console.log('📋 Fetching menu items for vendor:', currentUser.uid);

    // Reference to THIS vendor's menuItems subcollection
    const menuItemsRef = collection(db, 'vendors', currentUser.uid, 'menuItems');
    const q = query(menuItemsRef, orderBy('name', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Found ${items.length} menu items for this vendor`);
    return items;
  } catch (error) {
    console.error('❌ Error getting menu items:', error);
    throw error;
  }
};

// ✅ Add menu item to LOGGED-IN vendor's collection
export const addMenuItem = async (itemData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please log in.');
    }

    const menuItemsRef = collection(db, 'vendors', currentUser.uid, 'menuItems');
    
    const docRef = await addDoc(menuItemsRef, {
      name: itemData.name,
      price: parseFloat(itemData.price),
      description: itemData.description || '',
      isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Menu item added:', docRef.id, 'for vendor:', currentUser.uid);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding menu item:', error);
    throw error;
  }
};

// ✅ Update menu item in LOGGED-IN vendor's collection
export const updateMenuItem = async (itemId, updateData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please log in.');
    }

    const itemDoc = doc(db, 'vendors', currentUser.uid, 'menuItems', itemId);
    
    await updateDoc(itemDoc, {
      name: updateData.name,
      price: parseFloat(updateData.price),
      description: updateData.description || '',
      isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : true,
      updatedAt: new Date()
    });
    
    console.log('✅ Menu item updated:', itemId);
  } catch (error) {
    console.error('❌ Error updating menu item:', error);
    throw error;
  }
};

// ✅ Delete menu item from LOGGED-IN vendor's collection
export const deleteMenuItem = async (itemId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please log in.');
    }

    const itemDoc = doc(db, 'vendors', currentUser.uid, 'menuItems', itemId);
    await deleteDoc(itemDoc);
    
    console.log('✅ Menu item deleted:', itemId);
  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    throw error;
  }
};

// ✅ Bulk add menu items
export const addMultipleMenuItems = async (items) => {
  try {
    const promises = items.map(item => addMenuItem(item));
    return await Promise.all(promises);
  } catch (error) {
    console.error('❌ Error adding multiple menu items:', error);
    throw error;
  }
};

// ✅ Create/update vendor profile (call this on first login or signup)
export const createVendorProfile = async (vendorData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please log in.');
    }

    const vendorDoc = doc(db, 'vendors', currentUser.uid);
    
    await setDoc(vendorDoc, {
      email: currentUser.email,
      businessName: vendorData.businessName || '',
      description: vendorData.description || '',
      location: vendorData.location || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true }); // merge: true allows updating existing data
    
    console.log('✅ Vendor profile created/updated for:', currentUser.uid);
    return currentUser.uid;
  } catch (error) {
    console.error('❌ Error creating vendor profile:', error);
    throw error;
  }
};

// ✅ Get current vendor's profile
export const getVendorProfile = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please log in.');
    }

    const vendorDoc = doc(db, 'vendors', currentUser.uid);
    const vendorSnap = await getDoc(vendorDoc);
    
    if (!vendorSnap.exists()) {
      // Create default profile if it doesn't exist
      await createVendorProfile({
        businessName: currentUser.email?.split('@')[0] || 'My Business',
        description: '',
        location: ''
      });
      
      // Fetch again
      const newSnap = await getDoc(vendorDoc);
      return {
        id: newSnap.id,
        ...newSnap.data()
      };
    }
    
    return {
      id: vendorSnap.id,
      ...vendorSnap.data()
    };
  } catch (error) {
    console.error('❌ Error getting vendor profile:', error);
    throw error;
  }
};