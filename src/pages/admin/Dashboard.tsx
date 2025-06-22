import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PremiumPageWrapper } from '@/components/PremiumPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, UserPlus, Settings, MessageSquare, Calendar, FileText, TrendingUp, AlertTriangle, ListChecks, ClipboardList, Clock } from 'lucide-react';
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <PremiumPageWrapper 
      title="Admin Dashboard" 
      subtitle="Manage users, subjects, and system settings" 
      headerTitle="Smart Attendance System"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/students')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Student Management</p>
                <p className="text-2xl font-bold text-foreground">Manage Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Management */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/faculty')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Faculty Management</p>
                <p className="text-2xl font-bold text-foreground">Manage Faculty</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Management */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/subjects')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Subject Management</p>
                <p className="text-2xl font-bold text-foreground">Manage Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Requests */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/faculty-requests')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ListChecks className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Faculty Requests</p>
                <p className="text-2xl font-bold text-foreground">Review Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/settings')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">System Settings</p>
                <p className="text-2xl font-bold text-foreground">Configure System</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/data-management')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Data Management</p>
                <p className="text-2xl font-bold text-foreground">Backup & Restore</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2" 
            onClick={() => navigate('/admin/faculty-timetables')}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-sm">Faculty Timetables</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2" 
            onClick={() => navigate('/admin/timetable')}
          >
            <Clock className="h-6 w-6" />
            <span className="text-sm">Timetable Management</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2" 
            onClick={() => navigate('/admin/import')}
          >
            <FileText className="h-6 w-6" />
            <span className="text-sm">Bulk Data Import</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2" 
            onClick={() => navigate('/admin/analytics')}
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm">Analytics Dashboard</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2" 
            onClick={() => navigate('/admin/templates')}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm">Message Templates</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2" 
            onClick={() => navigate('/admin/audit')}
          >
            <AlertTriangle className="h-6 w-6" />
            <span className="text-sm">Audit Logs</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/batches')} 
            className="h-20 flex-col gap-2"
          >
            <Users className="h-6 w-6" />
            <span className="text-sm">Manage Batches</span>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-border mt-8">
        <p className="text-sm text-muted-foreground mb-1">© 2024 All rights reserved to Atharv Ghandat</p>
        <p className="text-sm font-medium text-muted-foreground">Developed by Atharv Ghandat</p>
      </div>
    </PremiumPageWrapper>
  );
};

export default AdminDashboard;
