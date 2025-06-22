import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import SubjectAssignment from '../../components/SubjectAssignment';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  createdAt: string;
}

const FacultyManagement = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [subjectAssignmentOpen, setSubjectAssignmentOpen] = useState(false);
  const [selectedFacultyForAssignment, setSelectedFacultyForAssignment] = useState<{ id: string; name: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
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

  useEffect(() => {
    loadFaculty();
  }, [db]);

  useEffect(() => {
    filterFaculty();
  }, [faculty, searchTerm, departmentFilter]);

  const loadFaculty = async () => {
    if (!db) return;
    
    try {
      const facultyList = await db.users
        .where('role')
        .equals('faculty')
        .toArray();
      
      setFaculty(facultyList.map(user => ({
        id: user.id?.toString() || '',
        name: user.name,
        email: user.email,
        department: user.department || '',
        status: user.status,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Failed to load faculty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFaculty = () => {
    let filtered = faculty;
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(f => f.department === departmentFilter);
    }
    
    setFilteredFaculty(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      if (editingFaculty) {
        // Update existing faculty
        await db.users.update(parseInt(editingFaculty.id), {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          ...(formData.password && { password: formData.password })
        });
        toast({
          title: "Faculty Updated",
          description: "Faculty member has been updated successfully.",
        });
      } else {
        // Check if email already exists
        const existingUser = await db.users.where('email').equals(formData.email).first();
        if (existingUser) {
          toast({
            title: "Error",
            description: "Email already exists.",
            variant: "destructive",
          });
          return;
        }

        // Add new faculty
        await db.users.add({
          ...formData,
          role: 'faculty',
          status: 'approved',
          createdAt: new Date().toISOString()
        });
        toast({
          title: "Faculty Added",
          description: "New faculty member has been added successfully.",
        });
      }
      
      setIsDialogOpen(false);
      setEditingFaculty(null);
      setFormData({ name: '', email: '', password: '', department: '' });
      loadFaculty();
    } catch (error) {
      console.error('Failed to save faculty:', error);
      toast({
        title: "Error",
        description: "Failed to save faculty member.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      email: faculty.email,
      password: '',
      department: faculty.department
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (facultyId: string) => {
    if (!db) return;
    
    try {
      await db.users.delete(parseInt(facultyId));
      // Also delete their subject assignments
      await db.facultySubjects.where('facultyId').equals(facultyId).delete();
      toast({
        title: "Faculty Deleted",
        description: "Faculty member has been deleted successfully.",
      });
      loadFaculty();
    } catch (error) {
      console.error('Failed to delete faculty:', error);
      toast({
        title: "Error",
        description: "Failed to delete faculty member.",
        variant: "destructive",
      });
    }
  };

  const handleAssignSubjects = (faculty: Faculty) => {
    setSelectedFacultyForAssignment({ id: faculty.id, name: faculty.name });
    setSubjectAssignmentOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', department: '' });
    setEditingFaculty(null);
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
              <h1 className="text-xl font-semibold text-gray-900">Manage Faculty</h1>
              <p className="text-sm text-gray-500">Add, edit, and manage faculty members</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Faculty Members ({filteredFaculty.length})
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password {editingFaculty && '(leave empty to keep current)'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required={!editingFaculty}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
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
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
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
                  placeholder="Search by name or email..."
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
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaculty.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell className="font-medium">{faculty.name}</TableCell>
                      <TableCell>{faculty.email}</TableCell>
                      <TableCell>{faculty.department}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            faculty.status === 'approved' ? 'default' :
                            faculty.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {faculty.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignSubjects(faculty)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(faculty)}
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
                                <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {faculty.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(faculty.id)}>
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

            {filteredFaculty.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No faculty members found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Assignment Dialog */}
      {selectedFacultyForAssignment && (
        <SubjectAssignment
          facultyId={selectedFacultyForAssignment.id}
          facultyName={selectedFacultyForAssignment.name}
          isOpen={subjectAssignmentOpen}
          onClose={() => {
            setSubjectAssignmentOpen(false);
            setSelectedFacultyForAssignment(null);
          }}
        />
      )}
    </div>
  );
};

export default FacultyManagement;
