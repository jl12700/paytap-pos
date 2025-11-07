import { collection, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const vendorsRef = collection(db, 'vendors');

export const initializeVendor = async (userId, userEmail = null) => {
  try {
    const vendorDocRef = doc(vendorsRef, userId);
    const vendorDoc = await getDoc(vendorDocRef);

    if (!vendorDoc.exists()) {
      await setDoc(vendorDocRef, {
        userId: userId,
        email: userEmail || '',
        points: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { points: 0 };
    }

    return vendorDoc.data();
  } catch (error) {
    console.error('Error initializing vendor:', error);
    throw error;
  }
};

export const getVendorPoints = async (userId) => {
  try {
    const vendorDocRef = doc(vendorsRef, userId);
    const vendorDoc = await getDoc(vendorDocRef);

    if (!vendorDoc.exists()) {
      return await initializeVendor(userId);
    }

    return vendorDoc.data();
  } catch (error) {
    console.error('Error getting vendor points:', error);
    throw error;
  }
};

export const addPoints = async (userId, pointsToAdd) => {
  try {
    if (pointsToAdd <= 0) {
      throw new Error('Points to add must be greater than 0');
    }

    const vendorDocRef = doc(vendorsRef, userId);
    
    const vendorDoc = await getDoc(vendorDocRef);
    if (!vendorDoc.exists()) {
      await initializeVendor(userId);
    }

    await updateDoc(vendorDocRef, {
      points: increment(pointsToAdd),
      updatedAt: serverTimestamp()
    });

    const updatedDoc = await getDoc(vendorDocRef);
    return updatedDoc.data();
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

export const subtractPoints = async (userId, pointsToSubtract) => {
  try {
    if (pointsToSubtract <= 0) {
      throw new Error('Points to subtract must be greater than 0');
    }

    const vendorDocRef = doc(vendorsRef, userId);
    
    const vendorDoc = await getDoc(vendorDocRef);
    if (!vendorDoc.exists()) {
      await initializeVendor(userId);
    }

    await updateDoc(vendorDocRef, {
      points: increment(-pointsToSubtract),
      updatedAt: serverTimestamp()
    });

    const updatedDoc = await getDoc(vendorDocRef);
    return updatedDoc.data();
  } catch (error) {
    console.error('Error subtracting points:', error);
    throw error;
  }
};