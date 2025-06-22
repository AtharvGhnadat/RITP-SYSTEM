
import { parse } from 'date-fns';
import { AttendanceDatabase, TimetableAssignment } from '../contexts/DatabaseContext';

export interface TimetableEntry {
  day: string;
  time: string;
  subject: string;
  faculty: string;
  classroom: string;
  department: string;
  year: string;
}

export interface ProcessedTimetable {
  success: boolean;
  data: TimetableEntry[];
  errors: string[];
}

export interface ProcessingResult {
  success: boolean;
  totalRows: number;
  successfulAssignments: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
}

export const processTimetableData = (
  csvData: string[][],
  headers: string[]
): ProcessedTimetable => {
  const errors: string[] = [];
  const processedData: TimetableEntry[] = [];

  // Expected headers
  const expectedHeaders = ['subjectname', 'department', 'year', 'dayofweek', 'time', 'classroomnumber'];
  
  // Normalize headers for comparison
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
  
  // Find column indices with better matching
  const columnIndices = {
    subject: findColumnIndex(normalizedHeaders, 'subjectname', 'subject'),
    department: findColumnIndex(normalizedHeaders, 'department', 'dept'),
    year: findColumnIndex(normalizedHeaders, 'year', 'class'),
    day: findColumnIndex(normalizedHeaders, 'dayofweek', 'day'),
    time: findColumnIndex(normalizedHeaders, 'time'),
    classroom: findColumnIndex(normalizedHeaders, 'classroomnumber', 'classroom', 'room')
  };

  // Validate that all required columns are found
  const missingColumns: string[] = [];
  Object.entries(columnIndices).forEach(([field, index]) => {
    if (index === -1) {
      missingColumns.push(field);
    }
  });

  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your CSV has columns for Subject Name, Department, Year, Day of Week, Time, and Classroom Number.`);
    return { success: false, data: [], errors };
  }

  // Process each row
  csvData.forEach((row, index) => {
    const rowNum = index + 2; // +2 because we skip header and arrays are 0-indexed
    
    if (row.length === 0 || row.every(cell => !cell.trim())) {
      return; // Skip empty rows
    }

    const entry: Partial<TimetableEntry> = {};
    const rowErrors: string[] = [];

    // Extract and validate data
    try {
      entry.subject = row[columnIndices.subject]?.trim();
      entry.department = row[columnIndices.department]?.trim();
      entry.year = row[columnIndices.year]?.trim();
      entry.day = row[columnIndices.day]?.trim();
      entry.time = row[columnIndices.time]?.trim();
      entry.classroom = row[columnIndices.classroom]?.trim();

      // Validate required fields
      if (!entry.subject) {
        rowErrors.push(`Row ${rowNum}: Subject Name is required`);
      }
      if (!entry.department) {
        rowErrors.push(`Row ${rowNum}: Department is required`);
      }
      if (!entry.year) {
        rowErrors.push(`Row ${rowNum}: Year is required`);
      }
      if (!entry.day) {
        rowErrors.push(`Row ${rowNum}: Day of Week is required`);
      }
      if (!entry.time) {
        rowErrors.push(`Row ${rowNum}: Time is required`);
      }

      // Validate time format
      if (entry.time && !isValidTimeFormat(entry.time)) {
        rowErrors.push(`Row ${rowNum}: Invalid time format '${entry.time}'. Please use HH:MM format (e.g., 09:30, 14:00)`);
      }

      // Validate day
      if (entry.day && !isValidDay(entry.day)) {
        rowErrors.push(`Row ${rowNum}: Invalid day '${entry.day}'. Please use full day names (Monday, Tuesday, etc.)`);
      }

      if (rowErrors.length === 0) {
        processedData.push(entry as TimetableEntry);
      } else {
        errors.push(...rowErrors);
      }

    } catch (error) {
      errors.push(`Row ${rowNum}: Failed to process row data - ${error}`);
    }
  });

  return {
    success: errors.length === 0,
    data: processedData,
    errors
  };
};

const findColumnIndex = (headers: string[], ...possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
};

const isValidTimeFormat = (time: string): boolean => {
  // Accept formats like "09:00", "9:00 AM", "14:30", etc.
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i;
  return timeRegex.test(time);
};

const isValidDay = (day: string): boolean => {
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return validDays.includes(day.toLowerCase());
};

export const processFacultyTimetableCSV = async (
  csvContent: string,
  db: AttendanceDatabase,
  facultyId: string
): Promise<ProcessingResult> => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return {
      success: false,
      totalRows: 0,
      successfulAssignments: 0,
      skippedRows: 0,
      errors: ['CSV file is empty'],
      warnings: []
    };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

  const processed = processTimetableData(dataRows, headers);
  
  if (!processed.success) {
    return {
      success: false,
      totalRows: dataRows.length,
      successfulAssignments: 0,
      skippedRows: dataRows.length,
      errors: processed.errors,
      warnings: []
    };
  }

  const saveResult = await saveFacultyTimetableToDatabase(db, processed.data, facultyId);
  
  return {
    success: saveResult.success,
    totalRows: dataRows.length,
    successfulAssignments: processed.data.length - saveResult.errors.length,
    skippedRows: saveResult.errors.length,
    errors: saveResult.errors,
    warnings: saveResult.warnings
  };
};

export const processTimetableCSV = async (
  csvContent: string,
  db: AttendanceDatabase
): Promise<ProcessingResult> => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return {
      success: false,
      totalRows: 0,
      successfulAssignments: 0,
      skippedRows: 0,
      errors: ['CSV file is empty'],
      warnings: []
    };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

  const processed = processTimetableData(dataRows, headers);
  
  if (!processed.success) {
    return {
      success: false,
      totalRows: dataRows.length,
      successfulAssignments: 0,
      skippedRows: dataRows.length,
      errors: processed.errors,
      warnings: []
    };
  }

  const saveResult = await saveTimetableToDatabase(db, processed.data);
  
  return {
    success: saveResult.success,
    totalRows: dataRows.length,
    successfulAssignments: processed.data.length - saveResult.errors.length,
    skippedRows: saveResult.errors.length,
    errors: saveResult.errors,
    warnings: saveResult.warnings
  };
};

export const generateSampleTimetableCSV = (): string => {
  const headers = ['SubjectName', 'Department', 'Year', 'DayOfWeek', 'Time', 'ClassroomNumber'];
  const sampleData = [
    ['Mathematics', 'AIML', '1st Year', 'Monday', '09:00', 'Room 101'],
    ['Physics', 'Computer Science', '2nd Year', 'Tuesday', '10:30', 'Lab A'],
    ['Chemistry', 'AIML', '1st Year', 'Wednesday', '14:00', 'Room 205']
  ];

  return [headers, ...sampleData].map(row => row.join(',')).join('\n');
};

const saveFacultyTimetableToDatabase = async (
  db: AttendanceDatabase,
  timetableData: TimetableEntry[],
  facultyId: string
): Promise<{ success: boolean; errors: string[]; warnings: string[] }> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    console.log('Saving faculty timetable for faculty ID:', facultyId);
    console.log('Timetable data:', timetableData);

    // Clear existing timetable data for this faculty
    await db.timetableAssignments.where('facultyId').equals(facultyId).delete();

    // Process each timetable entry
    for (const entry of timetableData) {
      try {
        console.log('Processing entry:', entry);

        // Find subject by name, department, and year using the new 'name' index
        const subject = await db.subjects
          .where('name')
          .equalsIgnoreCase(entry.subject)
          .and(subj => subj.department === entry.department && subj.year === entry.year)
          .first();

        console.log('Found subject:', subject);

        if (!subject) {
          errors.push(`Subject '${entry.subject}' not found for Department '${entry.department}' and Year '${entry.year}'. Please ensure the subject exists in the system.`);
          continue;
        }

        // Normalize time format
        const normalizedTime = normalizeTimeFormat(entry.time);
        
        // Create timetable assignment
        const assignment: Omit<TimetableAssignment, 'id'> = {
          facultyId: facultyId,
          subjectId: subject.id!.toString(),
          day: capitalizeDay(entry.day),
          startTime: normalizedTime,
          endTime: calculateEndTime(normalizedTime),
          classroom: entry.classroom || '',
          department: entry.department,
          year: entry.year,
          time: normalizedTime,
          classroomNumber: entry.classroom || '',
          createdAt: new Date().toISOString()
        };

        console.log('Creating assignment:', assignment);
        const assignmentId = await db.timetableAssignments.add(assignment);
        console.log('Created assignment with ID:', assignmentId);

      } catch (error) {
        console.error('Error processing timetable entry:', error);
        errors.push(`Failed to process entry for subject '${entry.subject}': ${error}`);
      }
    }

    console.log('Faculty timetable save complete. Errors:', errors.length);

    return {
      success: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    console.error('Failed to save faculty timetable to database:', error);
    return {
      success: false,
      errors: ['Failed to save timetable to database'],
      warnings: []
    };
  }
};

export const saveTimetableToDatabase = async (
  db: AttendanceDatabase,
  timetableData: TimetableEntry[]
): Promise<{ success: boolean; errors: string[]; warnings: string[] }> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Clear existing timetable data
    await db.timetableAssignments.clear();

    // Process each timetable entry
    for (const entry of timetableData) {
      try {
        // Find subject by name, department, and year using the new 'name' index
        const subject = await db.subjects
          .where('name')
          .equalsIgnoreCase(entry.subject)
          .and(subj => subj.department === entry.department && subj.year === entry.year)
          .first();

        if (!subject) {
          errors.push(`Subject '${entry.subject}' not found for Department '${entry.department}' and Year '${entry.year}'. Please ensure the subject exists in the system.`);
          continue;
        }

        // Normalize time format
        const normalizedTime = normalizeTimeFormat(entry.time);
        
        // Create timetable assignment - without faculty assignment for now
        const assignment: Omit<TimetableAssignment, 'id'> = {
          facultyId: '', // Will be assigned later
          subjectId: subject.id!.toString(),
          day: capitalizeDay(entry.day),
          startTime: normalizedTime,
          endTime: calculateEndTime(normalizedTime),
          classroom: entry.classroom || '',
          department: entry.department,
          year: entry.year,
          time: normalizedTime,
          classroomNumber: entry.classroom || '',
          createdAt: new Date().toISOString()
        };

        await db.timetableAssignments.add(assignment);

      } catch (error) {
        console.error('Error processing timetable entry:', error);
        errors.push(`Failed to process entry for subject '${entry.subject}': ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    console.error('Failed to save timetable to database:', error);
    return {
      success: false,
      errors: ['Failed to save timetable to database'],
      warnings: []
    };
  }
};

const normalizeTimeFormat = (time: string): string => {
  // Convert to 24-hour format if needed
  const timeRegex = /^(\d{1,2}):(\d{2})(\s?(AM|PM))?$/i;
  const match = time.match(timeRegex);
  
  if (!match) return time;
  
  let [, hours, minutes, , ampm] = match;
  let hour = parseInt(hours);
  
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = hours + 1;
  return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const capitalizeDay = (day: string): string => {
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
};
