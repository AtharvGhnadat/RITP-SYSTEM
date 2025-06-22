import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';

const AddStudent = () => {
  const { db, logAuditAction } = useDatabase();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    department: '',
    year: '',
    phoneNumber: '',
    parentPhoneNumber: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.rollNo || !formData.department || !formData.year) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!db) {
        throw new Error('Database not available');
      }

      // Check if roll number already exists
      const existingStudent = await db.students
        .where('rollNo')
        .equals(formData.rollNo)
        .first();

      if (existingStudent) {
        toast({
          title: "Duplicate Roll Number",
          description: "A student with this roll number already exists.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const newStudent = {
        name: formData.name,
        rollNo: formData.rollNo,
        email: formData.email,
        department: formData.department,
        year: formData.year,
        phoneNumber: formData.phoneNumber,
        parentMobile: formData.parentPhoneNumber,
        createdAt: new Date().toISOString()
      };

      await db.students.add(newStudent);
      await logAuditAction('Student Added', `New student ${formData.name} (${formData.rollNo}) added`, 'faculty', 'faculty');

      toast({
        title: "Student Added",
        description: "Student has been added successfully.",
      });

      // Reset form
      setFormData({
        name: '',
        rollNo: '',
        email: '',
        department: '',
        year: '',
        phoneNumber: '',
        parentPhoneNumber: ''
      });

    } catch (error) {
      console.error('Failed to add student:', error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Add New Student</h1>
              <p className="text-sm text-gray-500">Add a student to the database</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student's full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rollNo">Roll Number *</Label>
                  <Input
                    id="rollNo"
                    value={formData.rollNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                    placeholder="Enter roll number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
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
                    value={formData.year}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhoneNumber">Parent/Guardian Phone Number</Label>
                <Input
                  id="parentPhoneNumber"
                  type="tel"
                  value={formData.parentPhoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentPhoneNumber: e.target.value }))}
                  placeholder="Enter parent/guardian phone number"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Adding...' : 'Add Student'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/faculty/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddStudent;
