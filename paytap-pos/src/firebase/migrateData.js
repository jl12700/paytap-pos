import { addMultipleCategories, addMultipleMenuItems } from './menuService';
import { menus } from '../constants';

// Transform existing menu data for Firebase
export const migrateMenuData = async () => {
  try {
    console.log('Starting data migration...');
    
    // Transform categories
    const categories = menus.map(menu => ({
      name: menu.name,
      icon: menu.icon,
      bgColor: menu.bgColor,
      order: menu.id,
      isActive: true
    }));
    
    // Add categories to Firebase
    console.log('Adding categories...');
    const categoryIds = await addMultipleCategories(categories);
    console.log('Categories added:', categoryIds);
    
    // Transform menu items
    const allMenuItems = [];
    menus.forEach((menu, menuIndex) => {
      menu.items.forEach(item => {
        allMenuItems.push({
          name: item.name,
          price: item.price,
          category: item.category,
          categoryId: categoryIds[menuIndex], // Link to the category
          isAvailable: true,
          description: '', // You can add descriptions later
          imageUrl: '', // You can add image URLs later
          allergens: [], // You can add allergen information later
          tags: [] // You can add tags later
        });
      });
    });
    
    // Add menu items to Firebase
    console.log('Adding menu items...');
    const itemIds = await addMultipleMenuItems(allMenuItems);
    console.log('Menu items added:', itemIds);
    
    console.log('Data migration completed successfully!');
    return { categoryIds, itemIds };
    
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
};

// Function to run migration (call this once to populate your database)
export const runMigration = async () => {
  try {
    await migrateMenuData();
    console.log('✅ Migration completed! Your menu data is now in Firebase.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};
