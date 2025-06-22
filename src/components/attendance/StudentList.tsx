
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, User } from 'lucide-react';
import { StudentForAttendance } from '../../utils/attendanceUtils';

interface StudentListProps {
  students: StudentForAttendance[];
  onStatusChange: (studentId: string, status: 'present' | 'absent') => void;
  readonly?: boolean;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  onStatusChange,
  readonly = false
}) => {
  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">
            No students are assigned to this subject. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleToggleAttendance = (studentId: string) => {
    if (readonly) return;
    
    const student = students.find(s => s.studentId === studentId);
    if (student) {
      const newStatus = student.status === 'present' ? 'absent' : 'present';
      onStatusChange(studentId, newStatus);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Students ({students.length})</h3>
        <div className="space-y-2">
          {students.map((student, index) => (
            <div
              key={student.studentId}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                student.status === 'present' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-500">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-600">Roll No: {student.rollNo}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant={student.status === 'present' ? 'default' : 'destructive'}
                  className={student.status === 'present' ? 'bg-green-600' : ''}
                >
                  {student.status === 'present' ? 'Present' : 'Absent'}
                </Badge>
                
                {!readonly && (
                  <Button
                    size="sm"
                    variant={student.status === 'present' ? 'destructive' : 'default'}
                    onClick={() => handleToggleAttendance(student.studentId)}
                    className="flex items-center gap-1"
                  >
                    {student.status === 'present' ? (
                      <>
                        <X className="h-4 w-4" />
                        Mark Absent
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Mark Present
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
