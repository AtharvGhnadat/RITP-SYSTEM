import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, Download, CheckCircle, AlertTriangle, FileText, Users, BookOpen, UserCheck } from 'lucide-react';
import { PremiumPageWrapper } from '@/components/PremiumPageWrapper';
import { toast } from '@/hooks/use-toast';

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
}

const Import = () => {
  const { db, logAuditAction } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'students' | 'faculty' | 'subjects'>('students');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file.',
          variant: 'destructive'
        });
      }
    }
  };

  const downloadSampleCSV = () => {
    let csvContent = '';
    let filename = '';

    switch (importType) {
      case 'students':
        csvContent = 'Name,Email,RollNo,Department,Year,PhoneNumber,ParentMobile\nJohn Doe,john.doe@student.com,2023001,Computer Science,1st Year,9876543210,9876543211\nJane Smith,jane.smith@student.com,2023002,AIML,2nd Year,9876543211,9876543212';
        filename = 'sample-students.csv';
        break;
      case 'faculty':
        csvContent = 'Name,Email,Department,PhoneNumber\nDr. John Smith,john.smith@college.edu,Computer Science,9876543210\nDr. Jane Doe,jane.doe@college.edu,AIML,9876543211';
        filename = 'sample-faculty.csv';
        break;
      case 'subjects':
        csvContent = 'Name,Code,Department,Year\nMathematics,MATH101,Computer Science,1st Year\nPhysics,PHY101,AIML,1st Year';
        filename = 'sample-subjects.csv';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Sample Downloaded',
      description: `Sample ${importType} CSV has been downloaded.`
    });
  };

  const processImport = async () => {
    if (!selectedFile || !db || !user) {
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are logged in.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const fileContent = await selectedFile.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setImportResult({
          success: false,
          totalRows: 0,
          successfulImports: 0,
          skippedRows: 0,
          errors: ['CSV file is empty'],
          warnings: []
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

      const result = await processCSVData(dataRows, headers, importType);
      setImportResult(result);

      // Log audit action
      await logAuditAction(
        `Bulk ${importType} Import`,
        `Processed ${importType} CSV: ${result.successfulImports} records imported, ${result.skippedRows} records skipped`,
        user.id?.toString() || '0',
        user.role as 'admin' | 'faculty'
      );

      if (result.success) {
        toast({
          title: 'Import Successful',
          description: `${result.successfulImports} ${importType} records imported successfully.`
        });
      } else {
        toast({
          title: 'Import Completed with Issues',
          description: `${result.skippedRows} records were skipped due to errors.`,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Failed to process import:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while processing the file.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processCSVData = async (dataRows: string[][], headers: string[], type: string): Promise<ImportResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let successfulImports = 0;

    if (!db) {
      return {
        success: false,
        totalRows: dataRows.length,
        successfulImports: 0,
        skippedRows: dataRows.length,
        errors: ['Database not available'],
        warnings: []
      };
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // +2 because we skip header and arrays are 0-indexed

      try {
        if (type === 'students') {
          const [name, email, rollNo, department, year, phoneNumber, parentMobile] = row;
          
          if (!name || !email || !rollNo || !department || !year) {
            errors.push(`Row ${rowNum}: Missing required fields (Name, Email, RollNo, Department, Year)`);
            continue;
          }

          // Check for existing student
          const existing = await db.students.where('email').equals(email).or('rollNo').equals(rollNo).first();
          if (existing) {
            warnings.push(`Row ${rowNum}: Student with email '${email}' or roll number '${rollNo}' already exists - skipped`);
            continue;
          }

          await db.students.add({
            name,
            email,
            rollNo,
            department,
            year,
            phoneNumber: phoneNumber || '',
            parentMobile: parentMobile || '',
            createdAt: new Date().toISOString()
          });

        } else if (type === 'faculty') {
          const [name, email, department, phoneNumber] = row;
          
          if (!name || !email || !department) {
            errors.push(`Row ${rowNum}: Missing required fields (Name, Email, Department)`);
            continue;
          }

          // Check for existing faculty
          const existing = await db.users.where('email').equals(email).first();
          if (existing) {
            warnings.push(`Row ${rowNum}: Faculty with email '${email}' already exists - skipped`);
            continue;
          }

          await db.users.add({
            name,
            email,
            password: 'password123', // Default password
            role: 'faculty',
            department,
            phoneNumber: phoneNumber || '',
            status: 'approved',
            createdAt: new Date().toISOString()
          });

        } else if (type === 'subjects') {
          const [name, code, department, year] = row;
          
          if (!name || !code || !department || !year) {
            errors.push(`Row ${rowNum}: Missing required fields (Name, Code, Department, Year)`);
            continue;
          }

          // Check for existing subject
          const existing = await db.subjects.where('code').equals(code).first();
          if (existing) {
            warnings.push(`Row ${rowNum}: Subject with code '${code}' already exists - skipped`);
            continue;
          }

          await db.subjects.add({
            name,
            code,
            department,
            year,
            createdAt: new Date().toISOString()
          });
        }

        successfulImports++;

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: Failed to process - ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      totalRows: dataRows.length,
      successfulImports,
      skippedRows: dataRows.length - successfulImports,
      errors,
      warnings
    };
  };

  return (
    <PremiumPageWrapper 
      title="Bulk Data Import" 
      subtitle="Import students, faculty, and subjects from CSV files"
      headerTitle="Admin Panel"
    >
      <div className="space-y-6">
        {/* Back Navigation */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Import Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Select Import Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setImportType('students')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  importType === 'students' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Users className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Students</h3>
                <p className="text-sm text-muted-foreground">Import student records</p>
              </button>

              <button
                onClick={() => setImportType('faculty')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  importType === 'faculty' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <UserCheck className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Faculty</h3>
                <p className="text-sm text-muted-foreground">Import faculty records</p>
              </button>

              <button
                onClick={() => setImportType('subjects')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  importType === 'subjects' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Subjects</h3>
                <p className="text-sm text-muted-foreground">Import subject records</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                onClick={downloadSampleCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-border/80'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-accent-foreground" />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="font-medium text-primary">File Selected:</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="flex justify-center">
                <Button 
                  onClick={processImport}
                  disabled={isProcessing}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {importType}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResult.totalRows}</div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.successfulImports}</div>
                  <div className="text-sm text-green-600">Successful Imports</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.skippedRows}</div>
                  <div className="text-sm text-red-600">Skipped Rows</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>{Math.round((importResult.successfulImports / importResult.totalRows) * 100)}%</span>
                </div>
                <Progress 
                  value={(importResult.successfulImports / importResult.totalRows) * 100} 
                  className="h-2"
                />
              </div>

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({importResult.warnings.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded border-l-4 border-orange-400">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Errors ({importResult.errors.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription className="text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {importResult.success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Import completed successfully! All {importType} records have been added to the system.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-border mt-8">
          <p className="text-sm text-muted-foreground mb-1">© 2024 All rights reserved to Atharv Ghandat</p>
          <p className="text-sm font-medium text-muted-foreground">Developed by Atharv Ghandat</p>
        </div>
      </div>
    </PremiumPageWrapper>
  );
};

export default Import;
