
import type { CSVRow } from './csvParser';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface DataTypeConfig {
  fields: { [key: string]: string };
  requiredFields: string[];
}

export const validateData = (
  csvData: CSVRow[],
  dataType: string,
  columnMapping: { [csvColumn: string]: string },
  dataTypeConfig: DataTypeConfig
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  csvData.forEach((row, index) => {
    // Check required fields
    dataTypeConfig.requiredFields.forEach(field => {
      const csvColumn = Object.keys(columnMapping).find(col => columnMapping[col] === field);
      if (!csvColumn || !row[csvColumn]?.trim()) {
        errors.push({
          row: index + 1,
          field: dataTypeConfig.fields[field as keyof typeof dataTypeConfig.fields],
          message: 'Required field is empty'
        });
      }
    });

    // Specific validations by data type
    if (dataType === 'students') {
      validateStudentData(row, index, columnMapping, errors, csvData);
    } else if (dataType === 'faculty') {
      validateFacultyData(row, index, columnMapping, errors);
    } else if (dataType === 'subjects') {
      validateSubjectData(row, index, columnMapping, errors);
    }
  });

  return errors;
};

const validateStudentData = (
  row: CSVRow,
  index: number,
  columnMapping: { [key: string]: string },
  errors: ValidationError[],
  allData: CSVRow[]
) => {
  const rollNoCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'rollNo');
  if (rollNoCol && row[rollNoCol]) {
    // Check for duplicate roll numbers in CSV
    const duplicates = allData.filter((r, i) => i !== index && r[rollNoCol] === row[rollNoCol]);
    if (duplicates.length > 0) {
      errors.push({
        row: index + 1,
        field: 'Roll Number',
        message: 'Duplicate roll number in CSV'
      });
    }
  }

  const mobileCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'parentMobile');
  if (mobileCol && row[mobileCol]) {
    const mobile = row[mobileCol].replace(/\D/g, '');
    if (mobile.length !== 10) {
      errors.push({
        row: index + 1,
        field: 'Parent Mobile',
        message: 'Mobile number must be 10 digits'
      });
    }
  }
};

const validateFacultyData = (
  row: CSVRow,
  index: number,
  columnMapping: { [key: string]: string },
  errors: ValidationError[]
) => {
  const emailCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'email');
  if (emailCol && row[emailCol]) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row[emailCol])) {
      errors.push({
        row: index + 1,
        field: 'Email',
        message: 'Invalid email format'
      });
    }
  }
};

const validateSubjectData = (
  row: CSVRow,
  index: number,
  columnMapping: { [key: string]: string },
  errors: ValidationError[]
) => {
  // Add any subject-specific validation here
  const yearCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'year');
  if (yearCol && row[yearCol]) {
    const year = parseInt(row[yearCol]);
    if (isNaN(year) || year < 1 || year > 4) {
      errors.push({
        row: index + 1,
        field: 'Year',
        message: 'Year must be between 1 and 4'
      });
    }
  }
};
