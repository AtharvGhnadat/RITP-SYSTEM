
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PremiumPageWrapper } from '@/components/PremiumPageWrapper';
import { BookOpen, Clock, Users, TrendingUp, AlertTriangle, UserPlus, Search, MessageSquare, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { 
  fetchFacultyTodaySchedule, 
  calculateFacultyStats,
  isWithinAttendanceHours,
  getCurrentTimeFormatted,
  getCurrentDayName,
  formatTimeDisplay,
  refreshFacultyDashboard,
  TodayScheduleItem,
  FacultyStats
} from '../../utils/facultyDashboardUtils';

interface NotificationAlert {
  id: string;
  type: 'attendance_pending' | 'new_student' | 'system_update' | 'message_pending';
  message: string;
  dismissible: boolean;
}

const FacultyDashboard = () => {
  const { db } = useDatabase();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize notifications
  useNotifications();
  
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [facultyStats, setFacultyStats] = useState<FacultyStats>({
    totalSubjects: 0,
    averageAttendanceMarked: 0,
    defaultersCount: 0
  });
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (db && user) {
      loadDashboardData();
    }
  }, [db, user]);

  const loadDashboardData = async () => {
    if (!db || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading dashboard data for faculty:', user.id);

      // Use the enhanced refresh function
      const { schedule, stats } = await refreshFacultyDashboard(db, user.id.toString());
      
      console.log('Dashboard data loaded:', { schedule, stats });
      
      setTodaySchedule(schedule);
      setFacultyStats({
        ...stats,
        totalSubjects: Math.max(stats.totalSubjects, schedule.length)
      });

      // Generate notifications
      const alerts = generateNotifications(schedule);
      setNotifications(alerts);
      
      setLastRefresh(getCurrentTimeFormatted());
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page or contact support if the issue persists.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotifications = (schedule: TodayScheduleItem[]): NotificationAlert[] => {
    const alerts: NotificationAlert[] = [];

    // Check for pending attendance marking
    const pendingClasses = schedule.filter(c => !c.attendanceMarked);
    if (pendingClasses.length > 0) {
      alerts.push({
        id: 'attendance_pending',
        type: 'attendance_pending',
        message: `${pendingClasses.length} class(es) need attendance marking today.`,
        dismissible: true
      });
    }

    // Check for classes that have passed their time but attendance not marked
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const missedClasses = schedule.filter(c => {
      const timeStr = c.startTime || c.time;
      const [hours, minutes] = timeStr.split(':').map(Number);
      const classTime = hours * 60 + minutes;
      return classTime < currentTime && !c.attendanceMarked;
    });

    if (missedClasses.length > 0) {
      const firstMissed = missedClasses[0];
      alerts.push({
        id: 'missed_attendance',
        type: 'attendance_pending',
        message: `Attendance for ${firstMissed.subjectName} at ${formatTimeDisplay(firstMissed.time)} is still pending!`,
        dismissible: true
      });
    }

    return alerts.slice(0, 3); // Limit to 3 notifications
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md mx-auto">
          <CardContent className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} className="w-full" disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PremiumPageWrapper 
      title="Faculty Dashboard" 
      subtitle={`Welcome back, ${user?.name}! Here's your daily overview.`} 
      headerTitle="Smart Attendance System"
      showNotifications={true}
    >
      <div className="space-y-6 p-4 sm:p-6">
        {/* Time Display & Refresh */}
        <Card className="shadow-sm border border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-lg font-semibold text-foreground">{getCurrentTimeFormatted()}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getCurrentDayName()} • {isWithinAttendanceHours() ? 'Attendance Hours Active' : 'Outside Attendance Hours'}
                </p>
                {lastRefresh && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {lastRefresh}
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map(notification => (
              <Alert key={notification.id} className="border-l-4 border-l-primary">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>{notification.message}</span>
                  {notification.dismissible && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => dismissNotification(notification.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      ×
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="ml-4 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                  <p className="text-2xl font-bold text-foreground">{facultyStats.totalSubjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div className="ml-4 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Classes Today</p>
                  <p className="text-2xl font-bold text-foreground">{todaySchedule.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 flex-shrink-0" />
                <div className="ml-4 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Attendance Marked</p>
                  <p className="text-2xl font-bold text-foreground">{facultyStats.averageAttendanceMarked}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1" 
            onClick={() => navigate('/faculty/defaulters')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-600 flex-shrink-0" />
                <div className="ml-4 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">My Defaulters</p>
                  <p className="text-2xl font-bold text-foreground">{facultyStats.defaultersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule ({getCurrentDayName()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Classes Scheduled</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any classes scheduled for today ({getCurrentDayName()}).
                </p>
                <p className="text-sm text-muted-foreground">
                  If you expect to have classes, please contact your administrator to upload your timetable.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((classItem, index) => (
                  <div 
                    key={`${classItem.id}-${index}`}
                    className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md ${
                      classItem.attendanceMarked 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-3 lg:mb-0 flex-1">
                      <Badge variant="outline" className="font-mono text-sm px-3 py-1 flex-shrink-0">
                        {formatTimeDisplay(classItem.time || classItem.startTime)}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {classItem.subjectName}
                          </h3>
                          {classItem.attendanceMarked && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-fit">
                              ✓ Marked
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex flex-wrap gap-4">
                            <p className="flex items-center gap-1">
                              <span className="font-medium">Code:</span> {classItem.subjectCode}
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="font-medium">Class:</span> {classItem.department} - {classItem.year}
                            </p>
                          </div>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="font-medium">Room:</span> {classItem.classroomNumber || classItem.classroom || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 lg:ml-4">
                      <Button 
                        onClick={() => navigate(`/faculty/attendance/${classItem.subjectId}`)}
                        disabled={!isWithinAttendanceHours()}
                        variant={classItem.attendanceMarked ? "outline" : "default"}
                        size="sm"
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                        {classItem.attendanceMarked ? 'View/Edit' : 'Mark Attendance'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access Tools */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:shadow-md transition-all" 
                onClick={() => navigate('/faculty/history')}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Attendance History</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:shadow-md transition-all" 
                onClick={() => navigate('/faculty/add-student')}
              >
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Add Student</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:shadow-md transition-all" 
                onClick={() => navigate('/faculty/student-search')}
              >
                <Search className="h-6 w-6" />
                <span className="text-sm">Student Profile</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:shadow-md transition-all" 
                onClick={() => navigate('/faculty/message-generator')}
              >
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">WhatsApp Message</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer with Branding */}
        <div className="text-center py-6 border-t border-border bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            © 2024 Smart Attendance System. All rights reserved to Atharv Ghandat.
          </p>
          <p className="text-xs text-muted-foreground">
            Developed by Atharv Ghandat
          </p>
        </div>
      </div>
    </PremiumPageWrapper>
  );
};

export default FacultyDashboard;
