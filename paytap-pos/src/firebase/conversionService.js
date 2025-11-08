import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from './config';
import { subtractPoints } from './pointsService';

// Collection reference for conversions
const conversionsRef = collection(db, 'conversions');

// Conversion operations
export const getConversions = async () => {
  try {
    const q = query(conversionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting conversions:', error);
    throw error;
  }
};

export const addConversion = async (conversionData) => {
  try {
    const docRef = await addDoc(conversionsRef, {
      ...conversionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding conversion:', error);
    throw error;
  }
};

export const updateConversion = async (conversionId, updateData) => {
  try {
    const conversionDoc = doc(db, 'conversions', conversionId);
    
    // Get the current conversion data to check status change
    const currentConversion = await getDoc(conversionDoc);
    const currentData = currentConversion.data();
    
    // Check if status is changing from 'pending' to 'Approved' or 'completed'
    const isStatusChangingToApproved = 
      currentData?.requestStatus === 'pending' && 
      (updateData.requestStatus === 'Approved' || updateData.requestStatus === 'completed');
    
    // If status is changing to approved, deduct points
    if (isStatusChangingToApproved && currentData?.vendorId && currentData?.conversionAmount) {
      try {
        const pointsToSubtract = Math.floor(currentData.conversionAmount);
        if (pointsToSubtract > 0) {
          await subtractPoints(currentData.vendorId, pointsToSubtract);
          console.log(`✅ Deducted ${pointsToSubtract} points from vendor ${currentData.vendorId} upon approval`);
        }
      } catch (pointsError) {
        console.error('Error deducting points upon approval:', pointsError);
        // Don't fail the update if points deduction fails, but log it
        // Admin should be notified if this happens
      }
    }
    
    // Update the conversion document
    await updateDoc(conversionDoc, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating conversion:', error);
    throw error;
  }
};

export const deleteConversion = async (conversionId) => {
  try {
    const conversionDoc = doc(db, 'conversions', conversionId);
    await deleteDoc(conversionDoc);
  } catch (error) {
    console.error('Error deleting conversion:', error);
    throw error;
  }
};

export const getConversionsByStatus = async (status) => {
  try {
    const q = query(conversionsRef, where('requestStatus', '==', status), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting conversions by status:', error);
    throw error;
  }
};

export const getConversionsByPaymentMethod = async (paymentMethod) => {
  try {
    const q = query(conversionsRef, where('paymentMethod', '==', paymentMethod), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting conversions by payment method:', error);
    throw error;
  }
};

export const getConversionsByTransactionCode = async (transactionCode) => {
  try {
    const q = query(conversionsRef, where('transactionCode', '==', transactionCode));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting conversion by transaction code:', error);
    throw error;
  }
};
