
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PremiumPageWrapper } from '@/components/PremiumPageWrapper';
import { ArrowLeft, Upload, Download, Calendar, Clock, CheckCircle, AlertTriangle, FileText, User } from 'lucide-react';
import { processFacultyTimetableCSV, generateSampleTimetableCSV, ProcessingResult } from '../../utils/timetableProcessor';
import { toast } from '@/hooks/use-toast';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
}

const FacultyTimetables = () => {
  const { db, logAuditAction } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load faculty list if user is authenticated and database is available
    if (user && db) {
      loadFacultyList();
    } else if (!user) {
      // If no user, redirect to login
      navigate('/login');
    }
  }, [db, user, navigate]);

  const loadFacultyList = async () => {
    if (!db) {
      console.error('Database not available');
      setIsLoading(false);
      return;
    }
    
    try {
      const faculty = await db.users
        .where('role')
        .equals('faculty')
        .and(user => user.status === 'approved')
        .toArray();

      setFacultyList(faculty.map(f => ({
        id: f.id!.toString(),
        name: f.name,
        email: f.email,
        department: f.department || ''
      })));
    } catch (error) {
      console.error('Failed to load faculty list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load faculty list.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        setProcessingResult(null);
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
        setProcessingResult(null);
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
    const csvContent = generateSampleTimetableCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-faculty-timetable.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Sample Downloaded',
      description: 'Sample faculty timetable CSV has been downloaded.'
    });
  };

  const processTimetable = async () => {
    if (!selectedFile || !db || !user || !selectedFaculty) {
      toast({
        title: 'Error',
        description: 'Please select a faculty member and a CSV file.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const fileContent = await selectedFile.text();
      const result = await processFacultyTimetableCSV(fileContent, db, selectedFaculty);
      
      setProcessingResult(result);

      const selectedFacultyInfo = facultyList.find(f => f.id === selectedFaculty);

      // Log audit action
      if (logAuditAction) {
        await logAuditAction(
          'Faculty Timetable Upload',
          `Processed timetable for ${selectedFacultyInfo?.name}: ${result.successfulAssignments} assignments created, ${result.skippedRows} rows skipped`,
          user.id?.toString() || '0',
          user.role as 'admin' | 'faculty'
        );
      }

      if (result.success) {
        toast({
          title: 'Timetable Processed Successfully',
          description: `${result.successfulAssignments} assignments created for ${selectedFacultyInfo?.name}.`
        });
      } else {
        toast({
          title: 'Processing Completed with Issues',
          description: `${result.skippedRows} rows were skipped due to errors.`,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Failed to process timetable:', error);
      toast({
        title: 'Processing Failed',
        description: 'An error occurred while processing the timetable.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading spinner while checking authentication or loading data
  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PremiumPageWrapper 
      title="Faculty Timetable Management" 
      subtitle="Upload individual faculty timetables for automated attendance assignment"
      headerTitle="Admin Panel"
    >
      <div className="space-y-8">
        {/* Back Navigation */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              How Faculty Timetables Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Auto-Assignment Feature:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Upload individual faculty timetables</li>
                  <li>• System automatically assigns subjects based on day/time</li>
                  <li>• Faculty see current day's schedule on dashboard</li>
                  <li>• Attendance marking becomes available at class time</li>
                  <li>• No manual subject selection required</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>SubjectName</strong> - Must exist in system</li>
                  <li>• <strong>Department</strong> - Subject's department</li>
                  <li>• <strong>Year</strong> - Academic year (1st Year, 2nd Year)</li>
                  <li>• <strong>DayOfWeek</strong> - Full day name (Monday, Tuesday)</li>
                  <li>• <strong>Time</strong> - 24-hour format (09:30, 14:00)</li>
                  <li>• <strong>ClassroomNumber</strong> - Optional classroom</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={downloadSampleCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Faculty Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a faculty member to upload timetable for" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  {facultyList.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{faculty.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {faculty.email} • {faculty.department}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedFaculty && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Selected: {facultyList.find(f => f.id === selectedFaculty)?.name}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Upload this faculty member's weekly timetable to enable automated attendance assignment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        {selectedFaculty && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Timetable CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Zone */}
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
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium">Drop faculty timetable CSV here</p>
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

              {/* Process Button */}
              {selectedFile && (
                <div className="flex justify-center">
                  <Button 
                    onClick={processTimetable}
                    disabled={isProcessing}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing Timetable...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        Process Faculty Timetable
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing Results */}
        {processingResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {processingResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Processing Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processingResult.totalRows}</div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{processingResult.successfulAssignments}</div>
                  <div className="text-sm text-green-600">Successful Assignments</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{processingResult.skippedRows}</div>
                  <div className="text-sm text-red-600">Skipped Rows</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>{Math.round((processingResult.successfulAssignments / processingResult.totalRows) * 100)}%</span>
                </div>
                <Progress 
                  value={(processingResult.successfulAssignments / processingResult.totalRows) * 100} 
                  className="h-2"
                />
              </div>

              {/* Warnings */}
              {processingResult.warnings && processingResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({processingResult.warnings.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {processingResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-orange-700 bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {processingResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Processing Errors ({processingResult.errors.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {processingResult.errors.map((error, index) => (
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
              {processingResult.success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Faculty timetable has been successfully processed! The selected faculty member will now see their assigned classes automatically on their dashboard based on the current day and time.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-1">© 2024 All rights reserved to Atharv Ghandat</p>
          <p className="text-sm font-medium text-muted-foreground">Developed by Atharv Ghandat</p>
        </div>
      </div>
    </PremiumPageWrapper>
  );
};

export default FacultyTimetables;
