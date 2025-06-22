
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Users } from 'lucide-react';
import type { Batch, Student, User } from '../../contexts/DatabaseContext';

const BatchManagement = () => {
  const { db, logAuditAction } = useDatabase();
  const navigate = useNavigate();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    year: '',
    classroom: '',
    assignedFacultyId: '',
    assignedSubjectId: '',
    rollNumberRange: ''
  });
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

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

  useEffect(() => {
    loadData();
  }, [db]);

  useEffect(() => {
    filterBatches();
  }, [batches, searchTerm, departmentFilter, yearFilter]);

  useEffect(() => {
    if (formData.department && formData.year) {
      loadAvailableStudents();
    }
  }, [formData.department, formData.year, students]);

  const loadData = async () => {
    if (!db) return;
    
    try {
      const [batchList, studentList, facultyList] = await Promise.all([
        db.batches.toArray(),
        db.students.toArray(),
        db.users.where('role').equals('faculty').toArray()
      ]);
      
      setBatches(batchList);
      setStudents(studentList);
      setFaculty(facultyList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableStudents = () => {
    const filtered = students.filter(s => 
      s.department === formData.department && s.year === formData.year
    );
    setAvailableStudents(filtered);
  };

  const filterBatches = () => {
    let filtered = batches;
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(b => b.department === departmentFilter);
    }
    
    if (yearFilter && yearFilter !== 'all') {
      filtered = filtered.filter(b => b.year === yearFilter);
    }
    
    setFilteredBatches(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.name || !formData.department || !formData.year || selectedStudentIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and select at least one student.",
        variant: "destructive",
      });
      return;
    }

    try {
      const batchData: Omit<Batch, 'id'> = {
        name: formData.name,
        department: formData.department,
        year: formData.year,
        classroom: formData.classroom,
        studentIds: selectedStudentIds,
        assignedFacultyId: formData.assignedFacultyId === 'none' ? undefined : formData.assignedFacultyId,
        assignedSubjectId: formData.assignedSubjectId === 'none' ? undefined : formData.assignedSubjectId,
        createdAt: new Date().toISOString()
      };

      if (editingBatch && editingBatch.id) {
        await db.batches.update(editingBatch.id, batchData);
        await logAuditAction('Batch Updated', `Batch ${formData.name} updated`, 'admin', 'admin');
        toast({
          title: "Batch Updated",
          description: "Batch has been updated successfully.",
        });
      } else {
        await db.batches.add(batchData);
        await logAuditAction('Batch Created', `New batch ${formData.name} created`, 'admin', 'admin');
        toast({
          title: "Batch Created",
          description: "New batch has been created successfully.",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save batch:', error);
      toast({
        title: "Error",
        description: "Failed to save batch.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      department: batch.department,
      year: batch.year,
      classroom: batch.classroom || '',
      assignedFacultyId: batch.assignedFacultyId || 'none',
      assignedSubjectId: batch.assignedSubjectId || 'none',
      rollNumberRange: ''
    });
    setSelectedStudentIds(batch.studentIds);
    setIsDialogOpen(true);
  };

  const handleDelete = async (batchId: number) => {
    if (!db) return;
    
    try {
      const batch = await db.batches.get(batchId);
      await db.batches.delete(batchId);
      await logAuditAction('Batch Deleted', `Batch ${batch?.name} deleted`, 'admin', 'admin');
      toast({
        title: "Batch Deleted",
        description: "Batch has been deleted successfully.",
      });
      loadData();
    } catch (error) {
      console.error('Failed to delete batch:', error);
      toast({
        title: "Error",
        description: "Failed to delete batch.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      year: '',
      classroom: '',
      assignedFacultyId: 'none',
      assignedSubjectId: 'none',
      rollNumberRange: ''
    });
    setSelectedStudentIds([]);
    setEditingBatch(null);
  };

  const getBatchStudentCount = (batch: Batch) => {
    return batch.studentIds.length;
  };

  const getFacultyName = (facultyId?: string) => {
    if (!facultyId) return 'Not assigned';
    const facultyMember = faculty.find(f => f.id?.toString() === facultyId);
    return facultyMember?.name || 'Unknown';
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
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Manage Batches</h1>
              <p className="text-sm text-gray-500">Create and manage student batches</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Batches ({filteredBatches.length})
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBatch ? 'Edit Batch' : 'Create New Batch'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Batch Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Lab Batch A"
                        required
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="classroom">Classroom</Label>
                      <Input
                        id="classroom"
                        value={formData.classroom}
                        onChange={(e) => setFormData(prev => ({ ...prev, classroom: e.target.value }))}
                        placeholder="e.g., Lab 1"
                      />
                    </div>
                  </div>

                  {/* Student Selection */}
                  {formData.department && formData.year && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Students *</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                          {availableStudents.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={student.id?.toString()}
                                checked={selectedStudentIds.includes(student.id!)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedStudentIds(prev => [...prev, student.id!]);
                                  } else {
                                    setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                  }
                                }}
                              />
                              <Label htmlFor={student.id?.toString()} className="flex-1">
                                {student.rollNo} - {student.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">
                          Selected: {selectedStudentIds.length} students
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingBatch ? 'Update Batch' : 'Create Batch'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="sm:w-48">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:w-32">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{batch.department}</TableCell>
                      <TableCell>{batch.year}</TableCell>
                      <TableCell>{batch.classroom || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getBatchStudentCount(batch)} students
                        </Badge>
                      </TableCell>
                      <TableCell>{getFacultyName(batch.assignedFacultyId)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(batch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {batch.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(batch.id!)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredBatches.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No batches found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BatchManagement;
