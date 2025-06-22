
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertTriangle, Download } from 'lucide-react';

const Defaulters = () => {
  const { db } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [threshold] = useState(75); // Default attendance threshold

  useEffect(() => {
    if (db && user) {
      loadSubjects();
    }
  }, [db, user]);

  useEffect(() => {
    if (selectedSubject) {
      loadDefaulters();
    }
  }, [selectedSubject]);

  const loadSubjects = async () => {
    if (!db || !user) return;
    
    try {
      // Get faculty subjects - this would need to be implemented based on your data structure
      setSubjects([
        { id: '1', name: 'Mathematics', department: 'Engineering', year: '1st Year' },
        { id: '2', name: 'Physics', department: 'Engineering', year: '1st Year' }
      ]);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaulters = async () => {
    if (!db || !selectedSubject) return;
    
    try {
      // This would need to be implemented based on your attendance data structure
      setDefaulters([
        { rollNo: '101', name: 'John Doe', attendancePercentage: 60 },
        { rollNo: '102', name: 'Jane Smith', attendancePercentage: 45 }
      ]);
    } catch (error) {
      console.error('Failed to load defaulters:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/faculty/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Attendance Defaulters</h1>
              <p className="text-sm text-gray-500">Students below {threshold}% attendance</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a subject to view defaulters" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} - {subject.department} {subject.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Defaulters List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defaulters.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defaulters.map((student) => (
                      <div key={student.rollNo} className="p-4 border rounded-lg bg-red-50 border-red-200">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-600">Roll No: {student.rollNo}</div>
                        <div className="text-sm font-medium text-red-600">
                          Attendance: {student.attendancePercentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Export Defaulters List
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No defaulters found for the selected subject.</p>
                  <p className="text-sm mt-2">All students have attendance above {threshold}%.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Defaulters;
