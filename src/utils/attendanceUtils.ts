
import { AttendanceDatabase } from '../contexts/DatabaseContext';

export interface StudentForAttendance {
  studentId: string;
  rollNo: string;
  name: string;
  status: 'present' | 'absent';
}

export const fetchStudentsForAttendance = async (
  db: AttendanceDatabase,
  facultyId: string,
  subjectId: string
): Promise<StudentForAttendance[]> => {
  try {
    console.log('Fetching students for attendance:', { facultyId, subjectId });

    // Get the faculty-subject assignment with compound index
    const facultySubjectAssignment = await db.facultySubjects
      .where('[facultyId+subjectId]')
      .equals([facultyId, subjectId])
      .first();

    if (!facultySubjectAssignment) {
      console.error('No faculty subject assignment found for:', { facultyId, subjectId });
      throw new Error('Subject assignment not found');
    }

    console.log('Faculty subject assignment found:', facultySubjectAssignment);

    // Get students using compound index for better performance
    const students = await db.students
      .where('[department+year]')
      .equals([facultySubjectAssignment.department, facultySubjectAssignment.year])
      .toArray();

    console.log(`Found ${students.length} students for ${facultySubjectAssignment.department} - ${facultySubjectAssignment.year}`);

    // Initialize as present and sort by roll number
    const studentAttendance: StudentForAttendance[] = students.map(student => ({
      studentId: student.id!.toString(),
      rollNo: student.rollNo,
      name: student.name,
      status: 'present' as const
    }));

    // Sort by roll number (numeric if possible, otherwise alphabetic)
    return studentAttendance.sort((a, b) => {
      const aNum = parseInt(a.rollNo);
      const bNum = parseInt(b.rollNo);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.rollNo.localeCompare(b.rollNo);
    });

  } catch (error) {
    console.error('Failed to fetch students for attendance:', error);
    throw error;
  }
};

export const checkAttendanceExists = async (
  db: AttendanceDatabase,
  subjectId: string,
  facultyId: string,
  date: string
): Promise<boolean> => {
  try {
    const existingRecord = await db.attendanceRecords
      .where('[subjectId+facultyId+date]')
      .equals([subjectId, facultyId, date])
      .first();

    return !!existingRecord;
  } catch (error) {
    console.error('Failed to check attendance existence:', error);
    return false;
  }
};

export const saveAttendanceRecord = async (
  db: AttendanceDatabase,
  attendanceData: {
    subjectId: string;
    facultyId: string;
    date: string;
    studentAttendance: StudentForAttendance[];
  }
): Promise<void> => {
  try {
    const record = {
      subjectId: parseInt(attendanceData.subjectId),
      facultyId: parseInt(attendanceData.facultyId),
      studentId: 0, // Default value for the required field
      status: 'present' as const, // Default value for the required field
      date: attendanceData.date,
      timeMarked: new Date().toISOString(),
      studentAttendance: attendanceData.studentAttendance,
      createdAt: new Date().toISOString()
    };

    await db.attendanceRecords.add(record);
    console.log('Attendance record saved successfully');
  } catch (error) {
    console.error('Failed to save attendance record:', error);
    throw error;
  }
};
