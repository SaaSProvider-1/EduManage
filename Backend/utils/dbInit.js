import User from '../models/User.js';
import Batch from '../models/Batch.js';
import bcrypt from 'bcryptjs';
import { fixDatabaseIndexes } from './fixIndexes.js';

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Checking database initialization...');
    
    // Check if database is already initialized
    const userCount = await User.countDocuments();
    const isFirstRun = userCount === 0;
    
    if (isFirstRun) {
      console.log('🆕 First run detected - initializing database...');
      
      // Fix any problematic indexes only on first run
      await fixDatabaseIndexes();
      
      // Create default admin user
      console.log('👤 Creating default admin user...');
      
      const defaultAdmin = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@demo.com',
        phone: '+1234567890',
        password: 'admin123',
        role: 'admin',
        isEmailVerified: true,
        status: 'active'
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created');
      
      // Create demo users only on first run
      const demoUsers = [
        {
          firstName: 'John',
          lastName: 'Teacher',
          email: 'teacher@demo.com',
          phone: '+1234567891',
          password: 'teacher123',
          role: 'teacher',
          isEmailVerified: true,
          status: 'active',
          qualifications: ['M.Sc Mathematics', 'B.Ed'],
          experience: 5,
          subjects: ['Mathematics', 'Physics']
        },
        {
          firstName: 'Jane',
          lastName: 'Student',
          email: 'student@demo.com',
          phone: '+1234567892',
          password: 'student123',
          role: 'student',
          isEmailVerified: true,
          status: 'active',
          grade: 'Class 10',
          rollNumber: 'ST001'
        },
        {
          firstName: 'Mike',
          lastName: 'Parent',
          email: 'parent@demo.com',
          phone: '+1234567893',
          password: 'parent123',
          role: 'parent',
          isEmailVerified: true,
          status: 'active'
        }
      ];
      
      for (const userData of demoUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = new User(userData);
          await user.save();
          console.log(`✅ Demo ${userData.role} user created: ${userData.email}`);
        }
      }
      
      console.log('✅ Database initialization completed');
    } else {
      console.log(`✅ Database already initialized (${userCount} users found)`);
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw to prevent server crash
  }
};