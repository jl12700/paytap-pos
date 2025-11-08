import { collection, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const vendorsRef = collection(db, 'vendors');

/**
 * Initialize or get vendor document for a user
 * Creates a new vendor document if it doesn't exist
 */
export const initializeVendor = async (userId, userEmail = null) => {
  try {
    const vendorDocRef = doc(vendorsRef, userId);
    const vendorDoc = await getDoc(vendorDocRef);

    if (!vendorDoc.exists()) {
      // Create new vendor document with initial points
      await setDoc(vendorDocRef, {
        userId: userId,
        email: userEmail || '',
        points: 0, // Initial points balance
        businessName: '', // Business name field
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { points: 0, businessName: '' };
    }

    return vendorDoc.data();
  } catch (error) {
    console.error('Error initializing vendor:', error);
    throw error;
  }
};

/**
 * Get vendor points for a user
 */
export const getVendorPoints = async (userId) => {
  try {
    const vendorDocRef = doc(vendorsRef, userId);
    const vendorDoc = await getDoc(vendorDocRef);

    if (!vendorDoc.exists()) {
      // Initialize if doesn't exist
      return await initializeVendor(userId);
    }

    return vendorDoc.data();
  } catch (error) {
    console.error('Error getting vendor points:', error);
    throw error;
  }
};

/**
 * Add points to vendor account
 * @param {string} userId - Firebase Auth user ID
 * @param {number} pointsToAdd - Points to add (should be positive)
 */
export const addPoints = async (userId, pointsToAdd) => {
  try {
    if (pointsToAdd <= 0) {
      throw new Error('Points to add must be greater than 0');
    }

    const vendorDocRef = doc(vendorsRef, userId);
    
    // Check if document exists, if not create it
    const vendorDoc = await getDoc(vendorDocRef);
    if (!vendorDoc.exists()) {
      await initializeVendor(userId);
    }

    // Use increment to atomically update points
    await updateDoc(vendorDocRef, {
      points: increment(pointsToAdd),
      updatedAt: serverTimestamp()
    });

    // Get updated document
    const updatedDoc = await getDoc(vendorDocRef);
    return updatedDoc.data();
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

/**
 * Subtract points from vendor account
 * @param {string} userId - Firebase Auth user ID
 * @param {number} pointsToSubtract - Points to subtract (should be positive)
 */
export const subtractPoints = async (userId, pointsToSubtract) => {
  try {
    if (pointsToSubtract <= 0) {
      throw new Error('Points to subtract must be greater than 0');
    }

    const vendorDocRef = doc(vendorsRef, userId);
    
    // Check if document exists, if not create it
    const vendorDoc = await getDoc(vendorDocRef);
    if (!vendorDoc.exists()) {
      await initializeVendor(userId);
    }

    // Use increment with negative value to atomically update points
    await updateDoc(vendorDocRef, {
      points: increment(-pointsToSubtract),
      updatedAt: serverTimestamp()
    });

    // Get updated document
    const updatedDoc = await getDoc(vendorDocRef);
    return updatedDoc.data();
  } catch (error) {
    console.error('Error subtracting points:', error);
    throw error;
  }
};

/**
 * Set points to a specific value (use with caution)
 * @param {string} userId - Firebase Auth user ID
 * @param {number} newPoints - New points value
 */
export const setPoints = async (userId, newPoints) => {
  try {
    if (newPoints < 0) {
      throw new Error('Points cannot be negative');
    }

    const vendorDocRef = doc(vendorsRef, userId);
    
    // Check if document exists, if not create it
    const vendorDoc = await getDoc(vendorDocRef);
    if (!vendorDoc.exists()) {
      await initializeVendor(userId);
    }

    await updateDoc(vendorDocRef, {
      points: newPoints,
      updatedAt: serverTimestamp()
    });

    // Get updated document
    const updatedDoc = await getDoc(vendorDocRef);
    return updatedDoc.data();
  } catch (error) {
    console.error('Error setting points:', error);
    throw error;
  }
};

/**
 * Get business name for a vendor
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<string>} Business name
 */
export const getBusinessName = async (userId) => {
  try {
    const vendorDocRef = doc(vendorsRef, userId);
    const vendorDoc = await getDoc(vendorDocRef);

    if (!vendorDoc.exists()) {
      // Initialize if doesn't exist
      await initializeVendor(userId);
      return '';
    }

    const data = vendorDoc.data();
    return data.businessName || '';
  } catch (error) {
    console.error('Error getting business name:', error);
    throw error;
  }
};

/**
 * Update business name for a vendor
 * @param {string} userId - Firebase Auth user ID
 * @param {string} businessName - New business name
 * @returns {Promise<object>} Updated vendor data
 */
export const updateBusinessName = async (userId, businessName) => {
  try {
    const vendorDocRef = doc(vendorsRef, userId);
    
    // Check if document exists, if not create it
    const vendorDoc = await getDoc(vendorDocRef);
    if (!vendorDoc.exists()) {
      await initializeVendor(userId);
    }

    await updateDoc(vendorDocRef, {
      businessName: businessName || '',
      updatedAt: serverTimestamp()
    });

    // Get updated document
    const updatedDoc = await getDoc(vendorDocRef);
    return updatedDoc.data();
  } catch (error) {
    console.error('Error updating business name:', error);
    throw error;
  }
};

