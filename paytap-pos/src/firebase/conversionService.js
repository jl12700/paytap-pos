import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from './config';

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
