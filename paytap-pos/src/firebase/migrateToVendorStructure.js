// migrateToVendorStructure.js
import { getDocs, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/config';

/**
 * Migration Script: Move menu items from flat structure to vendor subcollections
 * 
 * OLD STRUCTURE:
 * menuItems/ (shared by all vendors)
 * 
 * NEW STRUCTURE:
 * vendors/{vendorId}/menuItems/ (isolated per vendor)
 */

// ✅ OPTION 1: Migrate ALL existing items to ONE vendor
export const migrateAllItemsToVendor = async (targetVendorId) => {
  try {
    console.log('🚀 Starting migration...');
    console.log(`📦 Target Vendor: ${targetVendorId}`);
    
    // Get all items from old flat structure
    const oldItemsRef = collection(db, 'menuItems');
    const oldItemsSnap = await getDocs(oldItemsRef);
    
    if (oldItemsSnap.empty) {
      console.log('⚠️ No items found in old structure. Nothing to migrate.');
      return { migrated: 0 };
    }
    
    console.log(`📋 Found ${oldItemsSnap.size} items to migrate`);
    
    let migratedCount = 0;
    
    // Move each item to new vendor subcollection
    for (const itemDoc of oldItemsSnap.docs) {
      const data = itemDoc.data();
      
      // Create in new location: vendors/{vendorId}/menuItems/{itemId}
      const newItemRef = doc(db, 'vendors', targetVendorId, 'menuItems', itemDoc.id);
      
      await setDoc(newItemRef, {
        name: data.name,
        price: data.price,
        description: data.description || '',
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date()
      });
      
      migratedCount++;
      console.log(`✅ Migrated: ${data.name} (${migratedCount}/${oldItemsSnap.size})`);
    }
    
    console.log(`✅ Migration complete! Migrated ${migratedCount} items to vendor ${targetVendorId}`);
    console.log('⚠️ Old items still exist in menuItems/ collection.');
    console.log('💡 Run deleteOldMenuItems() to clean up after verifying migration.');
    
    return { migrated: migratedCount };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ✅ OPTION 2: Split items between multiple vendors (based on category or manual)
export const migrateItemsToMultipleVendors = async (vendorMapping) => {
  /**
   * Example vendorMapping:
   * {
   *   'vendor_A_uid': ['item1_id', 'item2_id'],
   *   'vendor_B_uid': ['item3_id', 'item4_id']
   * }
   */
  try {
    console.log('🚀 Starting multi-vendor migration...');
    
    const oldItemsRef = collection(db, 'menuItems');
    const oldItemsSnap = await getDocs(oldItemsRef);
    
    if (oldItemsSnap.empty) {
      console.log('⚠️ No items found in old structure.');
      return { migrated: 0 };
    }
    
    let totalMigrated = 0;
    
    // Process each vendor
    for (const [vendorId, itemIds] of Object.entries(vendorMapping)) {
      console.log(`\n📦 Processing vendor: ${vendorId}`);
      
      for (const itemId of itemIds) {
        // Find the item in old structure
        const itemDoc = oldItemsSnap.docs.find(doc => doc.id === itemId);
        
        if (!itemDoc) {
          console.warn(`⚠️ Item ${itemId} not found, skipping...`);
          continue;
        }
        
        const data = itemDoc.data();
        
        // Create in new vendor subcollection
        const newItemRef = doc(db, 'vendors', vendorId, 'menuItems', itemId);
        
        await setDoc(newItemRef, {
          name: data.name,
          price: data.price,
          description: data.description || '',
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          createdAt: data.createdAt || new Date(),
          updatedAt: new Date()
        });
        
        totalMigrated++;
        console.log(`  ✅ Migrated: ${data.name}`);
      }
    }
    
    console.log(`\n✅ Multi-vendor migration complete! Migrated ${totalMigrated} items total.`);
    return { migrated: totalMigrated };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// ✅ OPTION 3: Create sample menu for a new vendor
export const createSampleMenuForVendor = async (vendorId, vendorType = 'food') => {
  try {
    console.log(`🚀 Creating sample menu for vendor: ${vendorId}`);
    console.log(`📋 Type: ${vendorType}`);
    
    const sampleMenus = {
      food: [
        { name: 'Fried Chicken', price: 120, description: 'Crispy fried chicken' },
        { name: 'Pork Adobo', price: 100, description: 'Classic Filipino dish' },
        { name: 'Bicol Express', price: 110, description: 'Spicy coconut stew' },
        { name: 'Sinigang', price: 95, description: 'Sour tamarind soup' },
        { name: 'Sisig', price: 130, description: 'Sizzling pork dish' }
      ],
      drinks: [
        { name: 'Iced Coffee', price: 60, description: 'Cold brewed coffee' },
        { name: 'Mango Shake', price: 70, description: 'Fresh mango smoothie' },
        { name: 'Buko Juice', price: 50, description: 'Fresh coconut juice' },
        { name: 'Calamansi Juice', price: 45, description: 'Filipino lemon juice' },
        { name: 'Sago\'t Gulaman', price: 40, description: 'Sweet iced drink' }
      ],
      snacks: [
        { name: 'Lumpia Shanghai', price: 80, description: 'Filipino spring rolls' },
        { name: 'Turon', price: 35, description: 'Banana spring roll' },
        { name: 'Puto', price: 25, description: 'Steamed rice cake' },
        { name: 'Ensaymada', price: 45, description: 'Sweet bread with cheese' },
        { name: 'Bibingka', price: 50, description: 'Rice cake with egg' }
      ]
    };
    
    const itemsToCreate = sampleMenus[vendorType] || sampleMenus.food;
    
    let createdCount = 0;
    
    for (const item of itemsToCreate) {
      const newItemRef = doc(collection(db, 'vendors', vendorId, 'menuItems'));
      
      await setDoc(newItemRef, {
        ...item,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      createdCount++;
      console.log(`  ✅ Created: ${item.name}`);
    }
    
    console.log(`✅ Created ${createdCount} sample items for vendor ${vendorId}`);
    return { created: createdCount };
    
  } catch (error) {
    console.error('❌ Failed to create sample menu:', error);
    throw error;
  }
};

// ✅ Cleanup: Delete old flat structure (ONLY run after verifying migration!)
export const deleteOldMenuItems = async () => {
  try {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will DELETE all items in the old menuItems collection.\n\n' +
      'Make sure you have:\n' +
      '1. Successfully migrated items to vendor subcollections\n' +
      '2. Verified the migration worked correctly\n\n' +
      'This action CANNOT be undone. Continue?'
    );
    
    if (!confirmed) {
      console.log('❌ Cleanup cancelled by user');
      return { deleted: 0 };
    }
    
    console.log('🗑️ Starting cleanup of old menuItems collection...');
    
    const oldItemsRef = collection(db, 'menuItems');
    const oldItemsSnap = await getDocs(oldItemsRef);
    
    if (oldItemsSnap.empty) {
      console.log('✅ No items to delete. Collection already clean.');
      return { deleted: 0 };
    }
    
    let deletedCount = 0;
    
    for (const itemDoc of oldItemsSnap.docs) {
      await deleteDoc(doc(db, 'menuItems', itemDoc.id));
      deletedCount++;
      console.log(`  🗑️ Deleted: ${itemDoc.data().name} (${deletedCount}/${oldItemsSnap.size})`);
    }
    
    console.log(`✅ Cleanup complete! Deleted ${deletedCount} old items.`);
    return { deleted: deletedCount };
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

// ✅ Verify migration: Check if items exist in new structure
export const verifyMigration = async (vendorId) => {
  try {
    console.log(`🔍 Verifying migration for vendor: ${vendorId}`);
    
    const newItemsRef = collection(db, 'vendors', vendorId, 'menuItems');
    const newItemsSnap = await getDocs(newItemsRef);
    
    console.log(`✅ Found ${newItemsSnap.size} items in new structure`);
    
    newItemsSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}: ₱${data.price}`);
    });
    
    return { count: newItemsSnap.size };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};

// ✅ Easy-to-use migration runner
export const runMigration = async () => {
  try {
    console.log('='.repeat(60));
    console.log('🔄 MENU MIGRATION WIZARD');
    console.log('='.repeat(60));
    
    // Check if old items exist
    const oldItemsSnap = await getDocs(collection(db, 'menuItems'));
    
    if (oldItemsSnap.empty) {
      console.log('\n⚠️ No items found in old menuItems/ collection.');
      console.log('💡 To create a sample menu for testing, run:');
      console.log('   createSampleMenuForVendor("YOUR_VENDOR_UID", "food")');
      return;
    }
    
    console.log(`\n📋 Found ${oldItemsSnap.size} items in old structure`);
    console.log('\n📝 Choose migration method:');
    console.log('1. Migrate ALL items to ONE vendor (typical for single vendor setup)');
    console.log('2. Split items between multiple vendors (manual mapping required)');
    console.log('3. Cancel migration');
    
    const choice = prompt('Enter choice (1, 2, or 3):');
    
    if (choice === '1') {
      const vendorId = prompt('Enter the vendor UID to migrate items to:');
      if (vendorId) {
        await migrateAllItemsToVendor(vendorId);
        await verifyMigration(vendorId);
      }
    } else if (choice === '2') {
      console.log('⚠️ Manual mapping required.');
      console.log('💡 Edit the script and call:');
      console.log('   migrateItemsToMultipleVendors({ vendorId: [itemIds...] })');
    } else {
      console.log('❌ Migration cancelled');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Export all functions for manual use
export default {
  migrateAllItemsToVendor,
  migrateItemsToMultipleVendors,
  createSampleMenuForVendor,
  deleteOldMenuItems,
  verifyMigration,
  runMigration
};