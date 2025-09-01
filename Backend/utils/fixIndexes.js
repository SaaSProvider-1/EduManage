import mongoose from 'mongoose';
import User from '../models/User.js';

export const fixDatabaseIndexes = async () => {
  try {
    console.log('🔄 Checking database indexes...');
    
    // Get all indexes on the users collection
    const indexes = await User.collection.getIndexes();
    const indexNames = Object.keys(indexes);
    console.log('Current indexes:', indexNames);
    
    // List of problematic indexes to drop (old schema leftovers)
    const problematicIndexes = ['customerId_1', 'phoneNumber_1'];
    
    let hasProblematicIndexes = false;
    for (const indexName of problematicIndexes) {
      if (indexes[indexName]) {
        hasProblematicIndexes = true;
        try {
          console.log(`🗑️ Dropping problematic ${indexName} index...`);
          await User.collection.dropIndex(indexName);
          console.log(`✅ ${indexName} index dropped`);
        } catch (dropError) {
          console.log(`⚠️ Could not drop ${indexName} index:`, dropError.message);
        }
      }
    }
    
    // Check if we need to recreate proper indexes
    const requiredIndexes = ['email_1', 'studentId_1', 'teacherId_1', 'role_1', 'status_1', 'parentId_1'];
    const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));
    
    if (hasProblematicIndexes || missingIndexes.length > 0) {
      console.log('🔄 Recreating proper indexes...');
      
      try {
        // Email should be unique
        if (!indexNames.includes('email_1')) {
          await User.collection.createIndex({ email: 1 }, { unique: true });
          console.log('✅ Email index created');
        }
        
        // StudentId and TeacherId should be unique but sparse (allow nulls)
        if (!indexNames.includes('studentId_1')) {
          await User.collection.createIndex({ studentId: 1 }, { sparse: true, unique: true });
          console.log('✅ StudentId index created');
        }
        
        if (!indexNames.includes('teacherId_1')) {
          await User.collection.createIndex({ teacherId: 1 }, { sparse: true, unique: true });
          console.log('✅ TeacherId index created');
        }
        
        // Other non-unique indexes
        if (!indexNames.includes('role_1')) {
          await User.collection.createIndex({ role: 1 });
          console.log('✅ Role index created');
        }
        
        if (!indexNames.includes('status_1')) {
          await User.collection.createIndex({ status: 1 });
          console.log('✅ Status index created');
        }
        
        if (!indexNames.includes('parentId_1')) {
          await User.collection.createIndex({ parentId: 1 });
          console.log('✅ ParentId index created');
        }
        
      } catch (createError) {
        console.log('⚠️ Some indexes could not be created:', createError.message);
      }
      
      console.log('✅ Database indexes fixed successfully');
    } else {
      console.log('✅ All required indexes are already present');
    }
    
  } catch (error) {
    console.error('❌ Failed to fix database indexes:', error);
    // Don't throw error to prevent initialization from failing
    console.log('⚠️ Continuing with database initialization despite index issues...');
  }
};