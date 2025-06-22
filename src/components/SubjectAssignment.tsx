
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Plus, Save, Clock } from 'lucide-react';

interface LocalSubject {
  id: number;
  name: string;
  department: string;
  year: string;
}

interface FacultySubjectAssignment {
  subjectId: string;
  subjectName: string;
  classroomNumber: string;
  department: string;
  year: string;
  time: string;
}

interface SubjectAssignmentProps {
  facultyId: string;
  facultyName: string;
  isOpen: boolean;
  onClose: () => void;
}

const departments = [
  'Computer Engineering',
  'Information Technology', 
  'Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'AIML',
  'Data Science'
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const timeSlots = [
  '09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:30'
];

const SubjectAssignment: React.FC<SubjectAssignmentProps> = ({
  facultyId,
  facultyName,
  isOpen,
  onClose
}) => {
  const { db } = useDatabase();
  const [subjects, setSubjects] = useState<LocalSubject[]>([]);
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, facultyId, db]);

  const loadData = async () => {
    if (!db) return;
    
    setIsLoading(true);
    try {
      // Load all subjects and convert to LocalSubject format
      const allSubjects = await db.subjects.toArray();
      const localSubjects: LocalSubject[] = allSubjects.map(subject => ({
        id: subject.id || 0,
        name: subject.name,
        department: subject.department,
        year: subject.year
      }));
      setSubjects(localSubjects);

      // Load existing faculty subject assignments
      const facultySubjects = await db.facultySubjects
        .where('facultyId')
        .equals(facultyId)
        .toArray();

      const assignmentPromises = facultySubjects.map(async (fs) => {
        const subject = await db.subjects.get(parseInt(fs.subjectId));
        return {
          subjectId: fs.subjectId,
          subjectName: subject?.name || 'Unknown Subject',
          classroomNumber: fs.classroomNumber,
          department: fs.department,
          year: fs.year,
          time: fs.time || ''
        };
      });

      const existingAssignments = await Promise.all(assignmentPromises);
      setAssignments(existingAssignments);
      setSelectedSubjects(existingAssignments.map(a => a.subjectId));

    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load subject data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string, subjectName: string) => {
    if (selectedSubjects.includes(subjectId)) {
      // Remove subject
      setSelectedSubjects(prev => prev.filter(id => id !== subjectId));
      setAssignments(prev => prev.filter(a => a.subjectId !== subjectId));
    } else {
      // Add subject with default values
      setSelectedSubjects(prev => [...prev, subjectId]);
      setAssignments(prev => [...prev, {
        subjectId,
        subjectName,
        classroomNumber: '',
        department: '',
        year: '',
        time: ''
      }]);
    }
  };

  const updateAssignment = (subjectId: string, field: keyof FacultySubjectAssignment, value: string) => {
    setAssignments(prev => prev.map(a => 
      a.subjectId === subjectId 
        ? { ...a, [field]: value }
        : a
    ));
  };

  const handleSave = async () => {
    if (!db) return;

    // Validate assignments
    const invalidAssignments = assignments.filter(a => 
      !a.classroomNumber || !a.department || !a.year || !a.time
    );

    if (invalidAssignments.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (including time) for each subject assignment.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Remove existing assignments for this faculty
      await db.facultySubjects.where('facultyId').equals(facultyId).delete();

      // Add new assignments
      const newAssignments = assignments.map(a => ({
        facultyId,
        subjectId: a.subjectId,
        classroomNumber: a.classroomNumber,
        department: a.department,
        year: a.year,
        time: a.time,
        createdAt: new Date().toISOString()
      }));

      await db.facultySubjects.bulkAdd(newAssignments);

      toast({
        title: "Success",
        description: "Subject assignments saved successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Failed to save assignments:', error);
      toast({
        title: "Error",
        description: "Failed to save subject assignments.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assign Subjects to {facultyName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Subject Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Subjects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject.id.toString()}
                      checked={selectedSubjects.includes(subject.id.toString())}
                      onCheckedChange={() => handleSubjectToggle(subject.id.toString(), subject.name)}
                    />
                    <Label htmlFor={subject.id.toString()} className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subject.name}</span>
                        <Badge variant="outline">{subject.department}</Badge>
                        <Badge variant="secondary">{subject.year}</Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Assignment Details */}
            {assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.map(assignment => (
                    <div key={assignment.subjectId} className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium text-lg">{assignment.subjectName}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Classroom Number *</Label>
                          <Input
                            placeholder="e.g., Room 101"
                            value={assignment.classroomNumber}
                            onChange={(e) => updateAssignment(assignment.subjectId, 'classroomNumber', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Department *</Label>
                          <Select 
                            value={assignment.department}
                            onValueChange={(value) => updateAssignment(assignment.subjectId, 'department', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Year *</Label>
                          <Select 
                            value={assignment.year}
                            onValueChange={(value) => updateAssignment(assignment.subjectId, 'year', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map(year => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Class Time *
                          </Label>
                          <Select 
                            value={assignment.time}
                            onValueChange={(value) => updateAssignment(assignment.subjectId, 'time', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSave}
                disabled={isSaving || assignments.length === 0}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Assignments
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubjectAssignment;
