
import { AttendanceDatabase, FacultySubject } from '../contexts/DatabaseContext';

export interface AssignedSubject {
  id: string;
  subjectName: string;
  department: string;
  year: string;
  classroomNumber: string;
  time?: string;
}

export interface TodayClass {
  subjectId: string;
  subjectName: string;
  time: string;
  classroomNumber: string;
  department: string;
  year: string;
  attendanceMarked?: boolean;
}

export const fetchFacultySubjects = async (
  db: AttendanceDatabase,
  facultyId: string
): Promise<AssignedSubject[]> => {
  try {
    console.log('Fetching faculty subjects for:', facultyId);

    const assignments = await db.facultySubjects
      .where('facultyId')
      .equals(facultyId)
      .toArray();

    console.log('Faculty assignments found:', assignments.length);

    const subjectPromises = assignments.map(async assignment => {
      const subject = await db.subjects.get(assignment.subjectId);
      return {
        id: assignment.subjectId,
        subjectName: subject?.name || 'Unknown Subject',
        department: assignment.department,
        year: assignment.year,
        classroomNumber: assignment.classroomNumber,
        time: assignment.time || '10:00'
      };
    });

    const subjects = await Promise.all(subjectPromises);
    console.log('Assigned subjects loaded:', subjects);
    return subjects;
  } catch (error) {
    console.error('Failed to fetch faculty subjects:', error);
    throw error;
  }
};

export const generateTodayScheduleWithStatus = async (
  db: AttendanceDatabase,
  subjects: AssignedSubject[],
  facultyId: string,
  todayDate: string
): Promise<TodayClass[]> => {
  const todayDayName = new Date(todayDate).toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses: TodayClass[] = [];

  try {
    // Get timetable assignments for today
    const timetableAssignments = await db.timetableAssignments
      .where('[facultyId+day]')
      .equals([facultyId, todayDayName])
      .toArray();

    console.log(`Found ${timetableAssignments.length} timetable assignments for ${todayDayName}`);

    for (const assignment of timetableAssignments) {
      // Get subject details
      const subject = await db.subjects.get(assignment.subjectId);
      if (!subject) continue;

      // Check if attendance has been marked for this subject today
      const existingAttendance = await db.attendanceRecords
        .where('[subjectId+facultyId+date]')
        .equals([assignment.subjectId, facultyId, todayDate])
        .first();

      const todayClass: TodayClass = {
        subjectId: assignment.subjectId,
        subjectName: subject.name,
        department: assignment.department || subject.department,
        year: assignment.year || subject.year,
        time: assignment.time || assignment.startTime,
        classroomNumber: assignment.classroomNumber || assignment.classroom,
        attendanceMarked: !!existingAttendance
      };

      todayClasses.push(todayClass);
    }

    // Sort by time
    todayClasses.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    console.log(`Generated ${todayClasses.length} classes for today's schedule`);
    return todayClasses;

  } catch (error) {
    console.error('Error generating today\'s schedule:', error);
    return [];
  }
};

export const calculateFacultyStats = async (
  db: AttendanceDatabase,
  facultyId: string,
  subjects: AssignedSubject[]
): Promise<{
  totalSubjects: number;
  averageAttendanceMarked: number;
  defaultersCount: number;
}> => {
  try {
    const totalSubjects = subjects.length;

    // Get faculty attendance records using faculty index
    const attendanceRecords = await db.attendanceRecords
      .where('facultyId')
      .equals(parseInt(facultyId))
      .toArray();

    // Calculate average attendance marked (last 30 days)
    const totalPossibleDays = 30;
    const totalPossibleRecords = subjects.length * totalPossibleDays;
    const actualRecords = attendanceRecords.length;
    const averageAttendanceMarked = totalPossibleRecords > 0 
      ? Math.round((actualRecords / totalPossibleRecords) * 100)
      : 0;

    // Calculate defaulters for faculty's subjects
    let defaultersCount = 0;
    const minAttendancePercentage = 75;

    for (const subject of subjects) {
      const subjectRecords = attendanceRecords.filter(r => r.subjectId.toString() === subject.id);
      const studentAttendanceMap = new Map<string, { present: number; total: number }>();
      
      subjectRecords.forEach(record => {
        if (record.studentAttendance) {
          record.studentAttendance.forEach((student: any) => {
            const studentKey = student.studentId.toString();
            if (!studentAttendanceMap.has(studentKey)) {
              studentAttendanceMap.set(studentKey, { present: 0, total: 0 });
            }
            
            const attendance = studentAttendanceMap.get(studentKey)!;
            attendance.total++;
            if (student.status === 'present') {
              attendance.present++;
            }
          });
        }
      });

      // Count defaulters
      studentAttendanceMap.forEach(attendance => {
        const percentage = attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 100;
        if (percentage < minAttendancePercentage) {
          defaultersCount++;
        }
      });
    }

    return {
      totalSubjects,
      averageAttendanceMarked,
      defaultersCount
    };
  } catch (error) {
    console.error('Failed to calculate faculty stats:', error);
    return {
      totalSubjects: subjects.length,
      averageAttendanceMarked: 0,
      defaultersCount: 0
    };
  }
};
