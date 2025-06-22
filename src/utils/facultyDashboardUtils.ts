
import { AttendanceDatabase, TimetableAssignment, Subject, User } from '../contexts/DatabaseContext';

export interface TodayScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  time: string;
  startTime: string;
  endTime: string;
  classroom: string;
  classroomNumber: string;
  department: string;
  year: string;
  day: string;
  attendanceMarked: boolean;
  attendanceId?: number;
}

export interface FacultyStats {
  totalSubjects: number;
  averageAttendanceMarked: number;
  defaultersCount: number;
}

export const getCurrentDayName = (): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

export const fetchFacultyTodaySchedule = async (
  db: AttendanceDatabase,
  facultyId: string
): Promise<TodayScheduleItem[]> => {
  try {
    const currentDay = getCurrentDayName();
    console.log('Fetching schedule for faculty:', facultyId, 'Day:', currentDay);

    // Fetch timetable assignments for this faculty and current day
    const timetableAssignments = await db.timetableAssignments
      .where('facultyId')
      .equals(facultyId)
      .and(assignment => assignment.day.toLowerCase() === currentDay.toLowerCase())
      .toArray();

    console.log('Found timetable assignments:', timetableAssignments);

    if (timetableAssignments.length === 0) {
      console.log('No timetable assignments found for faculty', facultyId, 'on', currentDay);
      return [];
    }

    const scheduleItems: TodayScheduleItem[] = [];

    for (const assignment of timetableAssignments) {
      try {
        console.log('Processing assignment:', assignment);
        
        // Get subject details using the subjectId from assignment
        const subjectId = parseInt(assignment.subjectId);
        const subject = await db.subjects.get(subjectId);
        
        console.log('Found subject for ID', subjectId, ':', subject);
        
        if (subject) {
          // Check if attendance is already marked for today
          const today = new Date().toISOString().split('T')[0];
          const attendanceRecord = await db.attendance
            .where(['subjectId', 'date', 'facultyId'])
            .equals([subject.id!, today, facultyId])
            .first();

          console.log('Attendance record for today:', attendanceRecord);

          const scheduleItem: TodayScheduleItem = {
            id: `${assignment.id}`,
            subjectId: subject.id!.toString(),
            subjectName: subject.name,
            subjectCode: subject.code,
            time: assignment.time || assignment.startTime,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            classroom: assignment.classroom || assignment.classroomNumber,
            classroomNumber: assignment.classroomNumber || assignment.classroom,
            department: assignment.department,
            year: assignment.year,
            day: assignment.day,
            attendanceMarked: !!attendanceRecord,
            attendanceId: attendanceRecord?.id
          };

          console.log('Created schedule item:', scheduleItem);
          scheduleItems.push(scheduleItem);
        } else {
          console.warn('Subject not found for ID:', subjectId);
        }
      } catch (error) {
        console.error('Error processing assignment:', assignment, error);
      }
    }

    // Sort by time
    const sortedItems = scheduleItems.sort((a, b) => {
      const timeA = a.startTime || a.time;
      const timeB = b.startTime || b.time;
      return timeA.localeCompare(timeB);
    });

    console.log('Final sorted schedule items:', sortedItems);
    return sortedItems;

  } catch (error) {
    console.error('Error fetching faculty today schedule:', error);
    return [];
  }
};

export const calculateFacultyStats = async (
  db: AttendanceDatabase,
  facultyId: string
): Promise<FacultyStats> => {
  try {
    console.log('Calculating faculty stats for:', facultyId);

    // Get all subjects assigned to this faculty
    const timetableAssignments = await db.timetableAssignments
      .where('facultyId')
      .equals(facultyId)
      .toArray();

    console.log('All timetable assignments for faculty:', timetableAssignments);

    const uniqueSubjectIds = [...new Set(timetableAssignments.map(a => a.subjectId))];
    const totalSubjects = uniqueSubjectIds.length;

    console.log('Unique subject IDs:', uniqueSubjectIds, 'Total subjects:', totalSubjects);

    // Calculate attendance marking percentage for today
    const today = new Date().toISOString().split('T')[0];
    let markedCount = 0;
    
    for (const subjectId of uniqueSubjectIds) {
      const attendanceRecord = await db.attendance
        .where(['subjectId', 'date', 'facultyId'])
        .equals([parseInt(subjectId), today, facultyId])
        .first();
      
      if (attendanceRecord) {
        markedCount++;
      }
    }

    const averageAttendanceMarked = totalSubjects > 0 ? Math.round((markedCount / totalSubjects) * 100) : 0;

    // Calculate defaulters (students with < 75% attendance in faculty's subjects)
    let defaultersCount = 0;
    
    for (const subjectId of uniqueSubjectIds) {
      const attendanceRecords = await db.attendance
        .where('subjectId')
        .equals(parseInt(subjectId))
        .toArray();

      const studentAttendanceMap = new Map<number, { present: number; total: number }>();
      
      attendanceRecords.forEach(record => {
        if (!studentAttendanceMap.has(record.studentId)) {
          studentAttendanceMap.set(record.studentId, { present: 0, total: 0 });
        }
        const stats = studentAttendanceMap.get(record.studentId)!;
        stats.total++;
        if (record.status === 'present') {
          stats.present++;
        }
      });

      studentAttendanceMap.forEach(stats => {
        if (stats.total > 0 && (stats.present / stats.total) < 0.75) {
          defaultersCount++;
        }
      });
    }

    const finalStats = {
      totalSubjects,
      averageAttendanceMarked,
      defaultersCount
    };

    console.log('Calculated faculty stats:', finalStats);
    return finalStats;

  } catch (error) {
    console.error('Error calculating faculty stats:', error);
    return {
      totalSubjects: 0,
      averageAttendanceMarked: 0,
      defaultersCount: 0
    };
  }
};

export const isWithinAttendanceHours = (): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = 9 * 60 + 30; // 9:30 AM
  const endTime = 16 * 60 + 30; // 4:30 PM
  
  return currentTime >= startTime && currentTime <= endTime;
};

export const getCurrentTimeFormatted = (): string => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatTimeDisplay = (time: string): string => {
  try {
    // Handle various time formats
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const min = parseInt(minutes);
      
      if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;
      }
    }
    
    return time;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};

export const refreshFacultyDashboard = async (
  db: AttendanceDatabase,
  facultyId: string
): Promise<{ schedule: TodayScheduleItem[]; stats: FacultyStats }> => {
  try {
    console.log('Refreshing faculty dashboard for:', facultyId);
    
    const [schedule, stats] = await Promise.all([
      fetchFacultyTodaySchedule(db, facultyId),
      calculateFacultyStats(db, facultyId)
    ]);
    
    console.log('Dashboard refresh complete:', { schedule, stats });
    
    return { schedule, stats };
  } catch (error) {
    console.error('Error refreshing faculty dashboard:', error);
    throw error;
  }
};
