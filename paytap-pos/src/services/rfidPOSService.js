// src/services/rfidPOSService.js
import { supabase } from '../supabase/supabaseClient';

const rfidPOSService = {
  // Search card for checkout
  searchCardForCheckout: async (rfidUID) => {
    try {
      console.log('🔍 Searching for card:', rfidUID);

      if (!rfidUID || rfidUID.trim() === '') {
        throw new Error('Please tap or scan a card');
      }

      const { data, error } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', rfidUID.toUpperCase())
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Card lookup error:', error);
        throw new Error('Card not found or inactive');
      }

      console.log('✅ Card found:', data);
      return data;
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  },

  // Process payment
  processPayment: async (rfidUID, totalAmount, orderDetails = {}) => {
    try {
      console.log('💳 Processing payment:', { rfidUID, totalAmount });

      if (!rfidUID || totalAmount <= 0) {
        throw new Error('Invalid payment details');
      }

      const card = await rfidPOSService.searchCardForCheckout(rfidUID);

      if (card.balance < totalAmount) {
        throw new Error(
          `Insufficient balance. Available: ₱${card.balance}, Required: ₱${totalAmount}`
        );
      }

      const newBalance = card.balance - totalAmount;

      const { data, error } = await supabase
        .from('rfid_cards')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', rfidUID.toUpperCase())
        .select()
        .single();

      if (error) {
        throw new Error('Payment processing failed');
      }

      // Log transaction
      await rfidPOSService.logTransaction({
        rfid_uid: rfidUID.toUpperCase(),
        firebase_uid: card.firebase_uid,
        amount: totalAmount,
        type: 'debit',
        old_balance: card.balance,
        new_balance: newBalance,
        order_details: orderDetails,
      });

      return {
        success: true,
        old_balance: card.balance,
        new_balance: newBalance,
        amount_paid: totalAmount,
        card_holder: card.name,
        transaction_time: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Payment error:', error);
      throw error;
    }
  },

  // Check balance
  checkBalance: async (rfidUID) => {
    try {
      const card = await rfidPOSService.searchCardForCheckout(rfidUID);
      return {
        balance: card.balance,
        name: card.name,
        status: card.status,
      };
    } catch (error) {
      throw error;
    }
  },

  // Log transaction
  logTransaction: async (transactionData) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            rfid_uid: transactionData.rfid_uid,
            firebase_uid: transactionData.firebase_uid,
            amount: transactionData.amount,
            type: transactionData.type,
            old_balance: transactionData.old_balance,
            new_balance: transactionData.new_balance,
            order_details: transactionData.order_details,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.warn('Transaction logging failed:', error);
      }
    } catch (error) {
      console.warn('Transaction logging error:', error);
    }
  },

  // Refund payment
  refundPayment: async (rfidUID, amount, reason = 'Refund') => {
    try {
      const card = await rfidPOSService.searchCardForCheckout(rfidUID);
      const newBalance = card.balance + amount;

      const { data, error } = await supabase
        .from('rfid_cards')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', rfidUID.toUpperCase())
        .select()
        .single();

      if (error) {
        throw new Error('Refund failed');
      }

      await rfidPOSService.logTransaction({
        rfid_uid: rfidUID.toUpperCase(),
        firebase_uid: card.firebase_uid,
        amount: amount,
        type: 'credit',
        old_balance: card.balance,
        new_balance: newBalance,
        order_details: { reason },
      });

      return {
        success: true,
        old_balance: card.balance,
        new_balance: newBalance,
        amount_refunded: amount,
      };
    } catch (error) {
      throw error;
    }
  },
};

export default rfidPOSService;