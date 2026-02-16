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

// Collection reference for support tickets
const supportTicketsRef = collection(db, 'supportTickets');

// Support ticket operations
export const getSupportTickets = async () => {
  try {
    const q = query(supportTicketsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting support tickets:', error);
    throw error;
  }
};

export const addSupportTicket = async (ticketData) => {
  try {
    const docRef = await addDoc(supportTicketsRef, {
      ...ticketData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding support ticket:', error);
    throw error;
  }
};

export const updateSupportTicket = async (ticketId, updateData) => {
  try {
    const ticketDoc = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketDoc, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    throw error;
  }
};

export const deleteSupportTicket = async (ticketId) => {
  try {
    const ticketDoc = doc(db, 'supportTickets', ticketId);
    await deleteDoc(ticketDoc);
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    throw error;
  }
};

export const getSupportTicketsByStatus = async (status) => {
  try {
    const q = query(supportTicketsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting support tickets by status:', error);
    throw error;
  }
};

export const getSupportTicketsByCategory = async (category) => {
  try {
    const q = query(supportTicketsRef, where('category', '==', category), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting support tickets by category:', error);
    throw error;
  }
};

export const getSupportTicketsByUser = async (userId) => {
  try {
    const q = query(supportTicketsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting support tickets by user:', error);
    throw error;
  }
};

