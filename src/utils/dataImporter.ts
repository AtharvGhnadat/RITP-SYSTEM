
import type { Student, User, Subject } from '../contexts/DatabaseContext';
import type { CSVRow } from './csvParser';

interface ImportResult {
  total: number;
  success: number;
  updated: number;
  errors: number;
}

export const performDataImport = async (
  db: any, // Using any type to match the database instance from useDatabase hook
  csvData: CSVRow[],
  dataType: 'students' | 'faculty' | 'subjects',
  columnMapping: { [csvColumn: string]: string },
  onProgress: (progress: number) => void
): Promise<ImportResult> => {
  let successCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    
    try {
      if (dataType === 'students') {
        await importStudentRecord(db, row, columnMapping, (isUpdate) => {
          if (isUpdate) updatedCount++; else successCount++;
        });
      } else if (dataType === 'faculty') {
        await importFacultyRecord(db, row, columnMapping, (isUpdate) => {
          if (isUpdate) updatedCount++; else successCount++;
        });
      } else if (dataType === 'subjects') {
        await importSubjectRecord(db, row, columnMapping, (isUpdate) => {
          if (isUpdate) updatedCount++; else successCount++;
        });
      }
    } catch (error) {
      console.error(`Error importing row ${i + 1}:`, error);
      errorCount++;
    }

    onProgress(Math.round(((i + 1) / csvData.length) * 100));
  }

  return {
    total: csvData.length,
    success: successCount,
    updated: updatedCount,
    errors: errorCount
  };
};

const importStudentRecord = async (
  db: any,
  row: CSVRow,
  columnMapping: { [key: string]: string },
  onComplete: (isUpdate: boolean) => void
) => {
  const getFieldValue = (field: string) => {
    const csvColumn = Object.keys(columnMapping).find(col => columnMapping[col] === field);
    return csvColumn ? row[csvColumn]?.trim() || '' : '';
  };

  const studentData: Omit<Student, 'id' | 'createdAt'> = {
    name: getFieldValue('name'),
    rollNo: getFieldValue('rollNo'),
    email: getFieldValue('email') || '',
    year: getFieldValue('year'),
    department: getFieldValue('department'),
    phoneNumber: getFieldValue('phoneNumber') || '',
    parentMobile: getFieldValue('parentMobile')
  };

  // Check if student exists
  const existingStudent = await db.students.where('rollNo').equals(studentData.rollNo).first();
  
  if (existingStudent) {
    await db.students.update(existingStudent.id, studentData);
    onComplete(true);
  } else {
    const newStudent: Student = {
      ...studentData,
      createdAt: new Date().toISOString()
    };
    await db.students.add(newStudent);
    onComplete(false);
  }
};

const importFacultyRecord = async (
  db: any,
  row: CSVRow,
  columnMapping: { [key: string]: string },
  onComplete: (isUpdate: boolean) => void
) => {
  const getFieldValue = (field: string) => {
    const csvColumn = Object.keys(columnMapping).find(col => columnMapping[col] === field);
    return csvColumn ? row[csvColumn]?.trim() || '' : '';
  };

  const facultyData: Omit<User, 'id' | 'createdAt'> = {
    name: getFieldValue('name'),
    email: getFieldValue('email'),
    password: getFieldValue('password'),
    department: getFieldValue('department'),
    role: 'faculty',
    status: 'approved'
  };

  const existingFaculty = await db.users.where('email').equals(facultyData.email).first();
  
  if (existingFaculty) {
    await db.users.update(existingFaculty.id, facultyData);
    onComplete(true);
  } else {
    const newFaculty: User = {
      ...facultyData,
      createdAt: new Date().toISOString()
    };
    await db.users.add(newFaculty);
    onComplete(false);
  }
};

const importSubjectRecord = async (
  db: any,
  row: CSVRow,
  columnMapping: { [key: string]: string },
  onComplete: (isUpdate: boolean) => void
) => {
  const getFieldValue = (field: string) => {
    const csvColumn = Object.keys(columnMapping).find(col => columnMapping[col] === field);
    return csvColumn ? row[csvColumn]?.trim() || '' : '';
  };

  const subjectData: Omit<Subject, 'id' | 'createdAt'> = {
    name: getFieldValue('name'),
    code: getFieldValue('code') || '',
    department: getFieldValue('department'),
    year: getFieldValue('year')
  };

  const existingSubject = await db.subjects
    .where(['name', 'department', 'year'])
    .equals([subjectData.name, subjectData.department, subjectData.year])
    .first();
  
  if (existingSubject) {
    await db.subjects.update(existingSubject.id, subjectData);
    onComplete(true);
  } else {
    const newSubject: Subject = {
      ...subjectData,
      createdAt: new Date().toISOString()
    };
    await db.subjects.add(newSubject);
    onComplete(false);
  }
};
