import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { auth } from './config';

/**
 * Initialize owner credentials for a vendor
 * This should be called once when the owner first sets up their credentials
 */
export const initializeOwnerCredentials = async (username, password) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in');
    }

    const vendorRef = doc(db, 'vendors', currentUser.uid);
    const vendorDoc = await getDoc(vendorRef);

    if (vendorDoc.exists()) {
      const data = vendorDoc.data();
      // Check if credentials already exist
      if (data.ownerUsername && data.ownerPassword) {
        throw new Error('Owner credentials already set');
      }
    }

    // Store credentials (in production, password should be hashed)
    await setDoc(vendorRef, {
      ownerUsername: username,
      ownerPassword: password, // In production, hash this password
      ownerCredentialsSet: true
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error initializing owner credentials:', error);
    throw error;
  }
};

/**
 * Verify owner credentials
 */
export const verifyOwnerCredentials = async (username, password) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in');
    }

    const vendorRef = doc(db, 'vendors', currentUser.uid);
    const vendorDoc = await getDoc(vendorRef);

    if (!vendorDoc.exists()) {
      throw new Error('Vendor document not found');
    }

    const data = vendorDoc.data();

    // Check if credentials are set
    if (!data.ownerUsername || !data.ownerPassword) {
      // If no credentials are set, allow first-time setup
      // You can set default credentials or require setup
      // For now, we'll allow setting credentials
      if (username && password) {
        await initializeOwnerCredentials(username, password);
        return true;
      }
      throw new Error('Owner credentials not set. Please set them first.');
    }

    // Verify credentials
    if (data.ownerUsername === username && data.ownerPassword === password) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying owner credentials:', error);
    throw error;
  }
};

/**
 * Check if owner credentials are set
 */
export const hasOwnerCredentials = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    const vendorRef = doc(db, 'vendors', currentUser.uid);
    const vendorDoc = await getDoc(vendorRef);

    if (!vendorDoc.exists()) {
      return false;
    }

    const data = vendorDoc.data();
    return !!(data.ownerUsername && data.ownerPassword);
  } catch (error) {
    console.error('Error checking owner credentials:', error);
    return false;
  }
};

/**
 * Update owner credentials
 */
export const updateOwnerCredentials = async (oldUsername, oldPassword, newUsername, newPassword) => {
  try {
    // First verify old credentials
    const isValid = await verifyOwnerCredentials(oldUsername, oldPassword);
    if (!isValid) {
      throw new Error('Invalid current credentials');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in');
    }

    const vendorRef = doc(db, 'vendors', currentUser.uid);
    await setDoc(vendorRef, {
      ownerUsername: newUsername,
      ownerPassword: newPassword, // In production, hash this password
      ownerCredentialsSet: true
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error updating owner credentials:', error);
    throw error;
  }
};

