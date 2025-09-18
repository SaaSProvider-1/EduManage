const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('userstudents');

    // Get current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the problematic unique index on contact.email
    try {
      await collection.dropIndex('contact.email_1');
      console.log('Dropped old contact.email_1 index');
    } catch (error) {
      console.log('Index contact.email_1 might not exist:', error.message);
    }

    // Remove documents with null or empty email
    const deleteResult = await collection.deleteMany({
      $or: [
        { 'contact.email': null },
        { 'contact.email': '' },
        { 'contact.email': { $exists: false } }
      ]
    });
    console.log(`Deleted ${deleteResult.deletedCount} documents with null/empty emails`);

    // Create new sparse unique index
    await collection.createIndex(
      { 'contact.email': 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'contact_email_unique_sparse'
      }
    );
    console.log('Created new sparse unique index on contact.email');

    console.log('Index fix completed successfully!');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixIndexes();