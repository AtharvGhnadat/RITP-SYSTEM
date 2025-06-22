
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { SubjectHeader } from '../../components/attendance/SubjectHeader';
import { StudentList } from '../../components/attendance/StudentList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { fetchStudentsForAttendance, checkAttendanceExists, saveAttendanceRecord, type StudentForAttendance } from '../../utils/attendanceUtils';

const AttendanceMarking = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { db, logAuditAction } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<any>(null);
  const [students, setStudents] = useState<StudentForAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceExists, setAttendanceExists] = useState(false);

  useEffect(() => {
    if (subjectId && user) {
      loadSubjectAndStudents();
    }
  }, [subjectId, user, selectedDate]);

  const loadSubjectAndStudents = async () => {
    if (!db || !subjectId || !user) return;

    setIsLoading(true);
    try {
      // Load subject details
      const subjectData = await db.subjects.get(parseInt(subjectId));
      if (!subjectData) {
        throw new Error('Subject not found');
      }
      setSubject(subjectData);

      // Check if attendance already exists for this date
      const exists = await checkAttendanceExists(db, subjectId, user.id?.toString() || '0', selectedDate);
      setAttendanceExists(exists);

      if (exists) {
        toast({
          title: "Notice",
          description: "Attendance has already been marked for this date.",
          variant: "default",
        });
      }

      // Load students
      const studentList = await fetchStudentsForAttendance(db, user.id?.toString() || '0', subjectId);
      setStudents(studentList);

    } catch (error) {
      console.error('Failed to load subject and students:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data. Please try again.",
        variant: "destructive",
      });
      navigate('/faculty/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentStatusChange = (studentId: string, status: 'present' | 'absent') => {
    setStudents(prev => prev.map(student => 
      student.studentId === studentId 
        ? { ...student, status }
        : student
    ));
  };

  const handleSaveAttendance = async () => {
    if (!user || !subjectId) return;

    if (attendanceExists) {
      toast({
        title: "Warning",
        description: "Attendance has already been marked for this date.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveAttendanceRecord(db, {
        subjectId,
        facultyId: user.id?.toString() || '0',
        date: selectedDate,
        studentAttendance: students
      });

      await logAuditAction(
        'Attendance Marked',
        `Attendance marked for ${subject?.name} on ${selectedDate}`,
        user.id?.toString() || '0',
        user.role
      );

      toast({
        title: "Success",
        description: "Attendance has been saved successfully!",
      });

      navigate('/faculty/dashboard');
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const attendancePercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

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
              <h1 className="text-xl font-semibold text-gray-900">Mark Attendance</h1>
              <p className="text-sm text-gray-500">Mark attendance for your students</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {subject && (
            <SubjectHeader 
              subject={subject}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              attendanceExists={attendanceExists}
            />
          )}

          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-sm text-gray-600">Present</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{attendancePercentage}%</div>
                <div className="text-sm text-gray-600">Attendance</div>
              </CardContent>
            </Card>
          </div>

          {/* Student List */}
          <StudentList 
            students={students}
            onStatusChange={handleStudentStatusChange}
            readonly={attendanceExists}
          />

          {/* Save Button */}
          {!attendanceExists && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Ready to save?</h3>
                    <p className="text-sm text-gray-600">
                      Please review the attendance before saving. This action cannot be undone.
                    </p>
                  </div>
                  <Button 
                    onClick={handleSaveAttendance}
                    disabled={isSaving || students.length === 0}
                    className="min-w-[120px]"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceMarking;
