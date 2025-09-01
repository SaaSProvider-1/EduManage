import cron from 'node-cron';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import Notification from '../models/Notification.js';
import { sendEmail } from './email.js';

// Fee reminder task - runs daily at 9 AM
export const setupFeeReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('🔔 Running fee reminder task...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcomingFees = await Fee.find({
        dueDate: {
          $gte: new Date(),
          $lte: tomorrow
        },
        status: 'pending'
      }).populate('student', 'firstName lastName email')
        .populate('batch', 'name');
      
      for (const fee of upcomingFees) {
        // Create notification
        await Notification.create({
          title: 'Fee Due Tomorrow',
          message: `Your fee of ₹${fee.amount} for ${fee.batch.name} is due tomorrow.`,
          recipient: fee.student._id,
          type: 'fee',
          relatedId: fee._id,
          relatedModel: 'Fee'
        });
        
        // Send email
        await sendEmail({
          to: fee.student.email,
          subject: 'Fee Due Tomorrow - Coaching Center',
          html: `
            <h2>Fee Due Reminder</h2>
            <p>Dear ${fee.student.firstName},</p>
            <p>This is a reminder that your fee of <strong>₹${fee.amount}</strong> for batch <strong>${fee.batch.name}</strong> is due tomorrow.</p>
            <p>Please make the payment to avoid any inconvenience.</p>
            <p>Thank you!</p>
          `
        });
      }
      
      console.log(`✅ Fee reminders sent for ${upcomingFees.length} fees`);
    } catch (error) {
      console.error('❌ Error in fee reminder task:', error);
    }
  });
};

// Exam reminder task - runs daily at 8 AM
export const setupExamReminders = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('🔔 Running exam reminder task...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      
      const upcomingExams = await Exam.find({
        examDate: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        },
        status: 'published'
      }).populate('batch', 'name students')
        .populate('teacher', 'firstName lastName');
      
      for (const exam of upcomingExams) {
        // Get all students in the batch
        const batch = await Batch.findById(exam.batch._id)
          .populate('students.student', 'firstName lastName email');
        
        for (const studentEntry of batch.students) {
          if (studentEntry.status === 'active') {
            const student = studentEntry.student;
            
            // Create notification
            await Notification.create({
              title: 'Exam Tomorrow',
              message: `You have an exam "${exam.title}" tomorrow at ${exam.startTime}.`,
              recipient: student._id,
              type: 'exam',
              relatedId: exam._id,
              relatedModel: 'Exam'
            });
            
            // Send email
            await sendEmail({
              to: student.email,
              subject: 'Exam Reminder - Tomorrow',
              html: `
                <h2>Exam Reminder</h2>
                <p>Dear ${student.firstName},</p>
                <p>This is a reminder that you have an exam tomorrow:</p>
                <ul>
                  <li><strong>Subject:</strong> ${exam.title}</li>
                  <li><strong>Date:</strong> ${exam.examDate.toDateString()}</li>
                  <li><strong>Time:</strong> ${exam.startTime} - ${exam.endTime}</li>
                  <li><strong>Duration:</strong> ${exam.duration} minutes</li>
                  <li><strong>Total Marks:</strong> ${exam.totalMarks}</li>
                </ul>
                <p>Please be on time and bring all necessary materials.</p>
                <p>Good luck!</p>
              `
            });
          }
        }
      }
      
      console.log(`✅ Exam reminders sent for ${upcomingExams.length} exams`);
    } catch (error) {
      console.error('❌ Error in exam reminder task:', error);
    }
  });
};

// Notification cleanup task - runs daily at midnight
export const setupNotificationCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🧹 Running notification cleanup task...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
      
      console.log(`✅ Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('❌ Error in notification cleanup task:', error);
    }
  });
};

// Token cleanup task - runs daily at 1 AM
export const setupTokenCleanup = () => {
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('🧹 Running token cleanup task...');
      
      const result = await User.updateMany(
        { 
          $or: [
            { 'emailVerificationExpires': { $lt: new Date() } },
            { 'passwordResetExpires': { $lt: new Date() } }
          ]
        },
        { 
          $unset: { 
            emailVerificationToken: 1,
            emailVerificationExpires: 1,
            passwordResetToken: 1,
            passwordResetExpires: 1
          }
        }
      );
      
      console.log(`✅ Cleaned up expired tokens for ${result.modifiedCount} users`);
    } catch (error) {
      console.error('❌ Error in token cleanup task:', error);
    }
  });
};

// Initialize all scheduled tasks
export const initializeScheduledTasks = (io) => {
  console.log('🕐 Initializing scheduled tasks...');
  
  setupFeeReminders();
  setupExamReminders();
  setupNotificationCleanup();
  setupTokenCleanup();
  
  console.log('✅ All scheduled tasks initialized');
};