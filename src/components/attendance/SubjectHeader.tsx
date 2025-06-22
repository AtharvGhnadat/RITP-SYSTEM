
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MapPin, Clock, Users, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubjectInfo {
  id: string;
  name: string;
  department: string;
  year: string;
  classroomNumber: string;
  time?: string;
}

interface SubjectHeaderProps {
  subject: SubjectInfo;
  selectedDate: string;
  onDateChange: (date: string) => void;
  attendanceExists: boolean;
}

export const SubjectHeader: React.FC<SubjectHeaderProps> = ({
  subject,
  selectedDate,
  onDateChange,
  attendanceExists
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium">Department:</span>
                <span>{subject.department}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Year:</span>
                <span>{subject.year}</span>
              </div>
              {subject.classroomNumber && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{subject.classroomNumber}</span>
                </div>
              )}
              {subject.time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{subject.time}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attendanceDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Attendance Date
              </Label>
              <Input
                id="attendanceDate"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                disabled={attendanceExists}
                className="min-w-[160px]"
              />
              {attendanceExists && (
                <p className="text-xs text-amber-600">
                  Attendance already marked for this date
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
