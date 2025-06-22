
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PremiumPageWrapper } from '@/components/PremiumPageWrapper';
import { ArrowLeft, Upload, Download, Calendar, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { processTimetableCSV, generateSampleTimetableCSV, ProcessingResult } from '../../utils/timetableProcessor';
import { toast } from '@/hooks/use-toast';

const TimetableManagement = () => {
  const { db, logAuditAction } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
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
    a.download = 'sample-timetable.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Sample Downloaded',
      description: 'Sample timetable CSV has been downloaded.'
    });
  };

  const processTimetable = async () => {
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
      const result = await processTimetableCSV(fileContent, db);
      
      setProcessingResult(result);

      // Log audit action with proper role type
      await logAuditAction(
        'Timetable Upload',
        `Processed timetable CSV: ${result.successfulAssignments} assignments created/updated, ${result.skippedRows} rows skipped`,
        user.id?.toString() || '0',
        user.role as 'admin' | 'faculty'
      );

      if (result.success) {
        toast({
          title: 'Timetable Processed Successfully',
          description: `${result.successfulAssignments} assignments created/updated.`
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

  return (
    <PremiumPageWrapper 
      title="Timetable Management" 
      subtitle="Upload and manage the college timetable to automatically assign subjects to faculty"
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
              CSV Format Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Required Columns:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <strong>FacultyEmail</strong> - Faculty member's email address</li>
                  <li>• <strong>SubjectName</strong> - Name of the subject</li>
                  <li>• <strong>Department</strong> - Department (e.g., AIML, Computer Science)</li>
                  <li>• <strong>Year</strong> - Academic year (e.g., 1st Year, 2nd Year)</li>
                  <li>• <strong>DayOfWeek</strong> - Full day name (Monday, Tuesday, etc.)</li>
                  <li>• <strong>Time</strong> - Time in HH:MM format (e.g., 09:30, 14:00)</li>
                  <li>• <strong>ClassroomNumber</strong> - Optional classroom number</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Important Notes:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Faculty must exist and be approved in the system</li>
                  <li>• Subject must exist for the specified department and year</li>
                  <li>• Time must be in 24-hour HH:MM format</li>
                  <li>• Days must be full names (Monday, not Mon)</li>
                  <li>• Existing assignments will be updated if found</li>
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

        {/* Upload Card */}
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
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-600">File Selected:</p>
                    <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">Drop your timetable CSV here</p>
                    <p className="text-sm text-gray-600">or click to browse files</p>
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
                      Process Timetable
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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

              {/* Error Details */}
              {processingResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
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
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Timetable has been successfully processed! Faculty schedules have been updated.
                    Faculty members can now see their assigned classes on their dashboards.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PremiumPageWrapper>
  );
};

export default TimetableManagement;
