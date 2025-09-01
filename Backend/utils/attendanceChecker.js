import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const checkTeacherAttendance = async (io) => {
  try {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // Find all active batches with classes today
    const batchesWithClassesToday = await Batch.find({
      status: 'active',
      'schedule.day': currentDay
    }).populate('teacher', 'firstName lastName email phone');
    
    for (const batch of batchesWithClassesToday) {
      const todaysSchedule = batch.schedule.filter(s => s.day === currentDay);
      
      for (const schedule of todaysSchedule) {
        const classStartTime = schedule.startTime;
        const [startHour, startMinute] = classStartTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        
        const classStartMinutes = startHour * 60 + startMinute;
        const currentMinutes = currentHour * 60 + currentMinute;
        
        // Check if class has started and teacher is late (more than 10 minutes)
        const minutesLate = currentMinutes - classStartMinutes;
        
        if (minutesLate >= 10) {
          // Check if attendance has been marked for today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const attendance = await Attendance.findOne({
            batch: batch._id,
            date: today
          });
          
          // If no attendance marked or teacher marked as absent/late
          if (!attendance || attendance.teacherAttendance.status === 'absent') {
            // Notify admins
            const admins = await User.find({ role: 'admin', status: 'active' });
            
            const notification = new Notification({
              title: 'Teacher Absent Alert',
              message: `Teacher ${batch.teacher.fullName} is ${minutesLate} minutes late for ${batch.name} class`,
              type: 'teacher_absent',
              category: 'administrative',
              priority: 'high',
              sender: batch.teacher._id,
              recipients: admins.map(admin => ({
                user: admin._id,
                role: 'admin'
              })),
              relatedEntity: {
                entityType: 'batch',
                entityId: batch._id,
                entityData: {
                  batchName: batch.name,
                  teacherName: batch.teacher.fullName,
                  classTime: schedule.startTime,
                  minutesLate
                }
              }
            });
            
            await notification.save();
            
            // Emit real-time notification
            if (io) {
              io.to('admin').emit('teacherAbsentNotification', {
                batchId: batch._id,
                batchName: batch.name,
                teacherId: batch.teacher._id,
                teacherName: batch.teacher.fullName,
                classTime: schedule.startTime,
                minutesLate,
                timestamp: new Date()
              });
            }
            
            console.log(`⚠️ Teacher absence alert: ${batch.teacher.fullName} is ${minutesLate} minutes late for ${batch.name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking teacher attendance:', error);
  }
};

// Check for upcoming classes and send reminders
export const sendClassReminders = async (io) => {
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Find batches with classes starting in 15 minutes
    const upcomingClasses = await Batch.find({
      status: 'active',
      'schedule.day': currentDay
    }).populate('teacher students.student', 'firstName lastName email phone');
    
    for (const batch of upcomingClasses) {
      const todaysSchedule = batch.schedule.filter(s => s.day === currentDay);
      
      for (const schedule of todaysSchedule) {
        const [hour, minute] = schedule.startTime.split(':').map(Number);
        const classTime = new Date();
        classTime.setHours(hour, minute, 0, 0);
        
        // Check if class starts in approximately 15 minutes
        const timeDiff = classTime.getTime() - now.getTime();
        if (timeDiff > 14 * 60 * 1000 && timeDiff < 16 * 60 * 1000) {
          // Send notification to teacher
          const teacherNotification = new Notification({
            title: 'Class Reminder',
            message: `You have a class starting in 15 minutes: ${batch.name}`,
            type: 'reminder',
            category: 'academic',
            priority: 'medium',
            sender: batch.teacher._id, // System notification
            recipients: [{
              user: batch.teacher._id,
              role: 'teacher'
            }]
          });
          
          await teacherNotification.save();
          
          // Send notifications to students
          const activeStudents = batch.students.filter(s => s.status === 'active');
          if (activeStudents.length > 0) {
            const studentNotification = new Notification({
              title: 'Class Reminder',
              message: `Your ${batch.name} class starts in 15 minutes`,
              type: 'reminder',
              category: 'academic',
              priority: 'medium',
              sender: batch.teacher._id,
              recipients: activeStudents.map(student => ({
                user: student.student._id,
                role: 'student'
              }))
            });
            
            await studentNotification.save();
          }
          
          // Emit real-time notifications
          if (io) {
            io.to(batch.teacher._id.toString()).emit('classReminder', {
              batchId: batch._id,
              batchName: batch.name,
              startTime: schedule.startTime,
              room: schedule.room
            });
            
            activeStudents.forEach(student => {
              io.to(student.student._id.toString()).emit('classReminder', {
                batchId: batch._id,
                batchName: batch.name,
                startTime: schedule.startTime,
                room: schedule.room
              });
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error sending class reminders:', error);
  }
};