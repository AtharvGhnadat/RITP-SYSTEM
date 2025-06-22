
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X } from 'lucide-react';

interface PendingFaculty {
  id: string;
  name: string;
  email: string;
  department: string;
  createdAt: string;
}

const FacultyRequests = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const [pendingFaculty, setPendingFaculty] = useState<PendingFaculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingFaculty();
  }, [db]);

  const loadPendingFaculty = async () => {
    if (!db) return;
    
    try {
      const pending = await db.users
        .where('status')
        .equals('pending')
        .and(user => user.role === 'faculty')
        .toArray();
      
      setPendingFaculty(pending.map(user => ({
        id: user.id?.toString() || '',
        name: user.name,
        email: user.email,
        department: user.department || '',
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Failed to load pending faculty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (facultyId: string) => {
    if (!db) return;
    
    try {
      await db.users.update(parseInt(facultyId), { status: 'approved' });
      toast({
        title: "Faculty Approved",
        description: "Faculty member has been approved successfully.",
      });
      loadPendingFaculty();
    } catch (error) {
      console.error('Failed to approve faculty:', error);
      toast({
        title: "Error",
        description: "Failed to approve faculty member.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (facultyId: string) => {
    if (!db) return;
    
    try {
      await db.users.update(parseInt(facultyId), { status: 'rejected' });
      toast({
        title: "Faculty Rejected",
        description: "Faculty registration has been rejected.",
      });
      loadPendingFaculty();
    } catch (error) {
      console.error('Failed to reject faculty:', error);
      toast({
        title: "Error",
        description: "Failed to reject faculty member.",
        variant: "destructive",
      });
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
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Faculty Registration Requests</h1>
              <p className="text-sm text-gray-500">Approve or reject pending faculty registrations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Faculty Approvals ({pendingFaculty.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingFaculty.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending faculty registrations</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFaculty.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell className="font-medium">{faculty.name}</TableCell>
                        <TableCell>{faculty.email}</TableCell>
                        <TableCell>{faculty.department}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Pending</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(faculty.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Faculty</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve {faculty.name}? They will be able to access the system immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleApprove(faculty.id)}>
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Faculty</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject {faculty.name}'s registration? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReject(faculty.id)}>
                                    Reject
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyRequests;
