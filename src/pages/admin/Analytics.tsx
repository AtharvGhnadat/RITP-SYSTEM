
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { AttendanceDatabase, AttendanceRecord, Student, Subject, SystemSettings } from '../../contexts/DatabaseContext';
import { ToastActionElement } from '@/components/ui/toast';
import { ToastProps } from '@radix-ui/react-toast';
import { VariantProps } from 'class-variance-authority';
import { ClassProp } from 'class-variance-authority/types';

// React's useCallback import
import { useCallback } from 'react';

const Analytics = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [defaulters, setDefaulters] = useState<(Student & { attendancePercentage: number })[]>([]);
  const [filteredDefaulters, setFilteredDefaulters] = useState<(Student & { attendancePercentage: number })[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  type AnalyticsState = {
    subjectWiseAttendance: { subject: string; attendance: number }[];
    facultyWiseAttendance: object[]; // Replace with actual type if implemented
    overallStats: {
      totalClasses: number;
      averageAttendance: number;
      totalDefaulters: number;
    };
  };

  const [analytics, setAnalytics] = useState<AnalyticsState>({
    subjectWiseAttendance: [],
    facultyWiseAttendance: [],
    overallStats: {
      totalClasses: 0,
      averageAttendance: 0,
      totalDefaulters: 0
    }
  });

  // ...rest of your imports

  const loadData = useCallback(async () => {
    if (!db) return;
    
    try {
      const [recordsData, studentsData, subjectsData, settingsData] = await Promise.all([
        db.attendanceRecords.toArray(),
        db.students.toArray(),
        db.subjects.toArray(),
        db.systemSettings.get('system-settings')
      ]);

      setAttendanceRecords(recordsData);
      setStudents(studentsData);
      setSubjects(subjectsData);
      setSettings(settingsData || null);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [db, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateAnalytics = React.useCallback(() => {
    // Subject-wise attendance
    const subjectAttendance: { [key: string]: { present: number; total: number; name: string } } = {};
    
    attendanceRecords.forEach(record => {
      const subject = subjects.find(s => s.id === record.subjectId);
      const subjectName = subject?.name || 'Unknown Subject';
      
      if (!subjectAttendance[record.subjectId]) {
        subjectAttendance[record.subjectId] = { present: 0, total: 0, name: subjectName };
      }
      
      record.studentAttendance.forEach(student => {
        subjectAttendance[record.subjectId].total++;
        if (student.status === 'present') {
          subjectAttendance[record.subjectId].present++;
        }
      });
    });

    const subjectWiseData = Object.values(subjectAttendance).map(item => ({
      subject: item.name,
      attendance: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
    }));

    // Overall stats
    let totalPresent = 0;
    let totalStudents = 0;
    
    attendanceRecords.forEach(record => {
      record.studentAttendance.forEach(student => {
        totalStudents++;
        if (student.status === 'present') {
          totalPresent++;
        }
      });
    });

    setAnalytics({
      subjectWiseAttendance: subjectWiseData,
      facultyWiseAttendance: [], // Will implement faculty-wise later
      overallStats: {
        totalClasses: attendanceRecords.length,
        averageAttendance: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0,
        totalDefaulters: 0 // Will be calculated in calculateDefaulters
      }
    });
  }, [attendanceRecords, subjects]);

  const calculateDefaulters = React.useCallback(() => {
    const minimumAttendance = settings?.minimumAttendancePercentage || 75;
    const studentAttendance: { [key: string]: { present: number; total: number; student: Student } } = {};

    // Calculate attendance for each student
    attendanceRecords.forEach(record => {
      record.studentAttendance.forEach(studentRecord => {
        const student = students.find(s => s.id === studentRecord.studentId);
        if (!student) return;

        if (!studentAttendance[studentRecord.studentId]) {
          studentAttendance[studentRecord.studentId] = { present: 0, total: 0, student };
        }
        
        studentAttendance[studentRecord.studentId].total++;
        if (studentRecord.status === 'present') {
          studentAttendance[studentRecord.studentId].present++;
        }
      });
    });

    // Filter defaulters
    const defaultersList = Object.values(studentAttendance)
      .map(item => ({
        ...item.student,
        attendancePercentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
      }))
      .filter(student => student.attendancePercentage < minimumAttendance);

    setDefaulters(defaultersList);
    
    // Update overall stats
    setAnalytics(prev => ({
      ...prev,
      overallStats: {
        ...prev.overallStats,
        totalDefaulters: defaultersList.length
      }
    }));
  }, [attendanceRecords, students, settings]);

  useEffect(() => {
    if (attendanceRecords.length > 0 && students.length > 0) {
      calculateAnalytics();
      calculateDefaulters();
    }
  }, [attendanceRecords, students, subjects, settings, calculateAnalytics, calculateDefaulters]);

  useEffect(() => {
    filterDefaulters();
  }, [defaulters, departmentFilter, yearFilter]);

  const filterDefaulters = () => {
    let filtered = [...defaulters];

    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }

    if (yearFilter && yearFilter !== 'all') {
      filtered = filtered.filter(student => student.year === yearFilter);
    }

    setFilteredDefaulters(filtered);
  };

  const exportToCSV = () => {
    // Simple CSV export implementation
    const csvData = filteredDefaulters.map(student => ({
      'Roll No': student.rollNo,
      'Name': student.name,
      'Department': student.department,
      'Year': student.year,
      'Attendance %': student.attendancePercentage
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defaulters-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported successfully!"
    });
  };

  const exportToPDF = async () => {
    // Simple PDF export using jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Defaulters Report', 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Minimum Attendance: ${settings?.minimumAttendancePercentage || 75}%`, 20, 55);

    let yPosition = 75;
    doc.setFontSize(10);
    doc.text('Roll No', 20, yPosition);
    doc.text('Name', 50, yPosition);
    doc.text('Department', 100, yPosition);
    doc.text('Year', 140, yPosition);
    doc.text('Attendance %', 170, yPosition);

    yPosition += 10;
    filteredDefaulters.forEach((student, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      doc.text(student.rollNo, 20, yPosition);
      doc.text(student.name, 50, yPosition);
      doc.text(student.department, 100, yPosition);
      doc.text(student.year, 140, yPosition);
      doc.text(`${student.attendancePercentage}%`, 170, yPosition);
      yPosition += 8;
    });

    doc.save('defaulters-report.pdf');
    toast({
      title: "Success",
      description: "PDF report exported successfully!"
    });
  };

  const departments = [...new Set(students.map(s => s.department))];
  const years = [...new Set(students.map(s => s.year))];

  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-semibold text-gray-900">Analytics & Reports</h1>
              <p className="text-sm text-gray-500">Comprehensive attendance analytics and insights</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-3xl font-bold">{analytics.overallStats.totalClasses}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Attendance</p>
                  <p className="text-3xl font-bold">{analytics.overallStats.averageAttendance}%</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Defaulters</p>
                  <p className="text-3xl font-bold">{analytics.overallStats.totalDefaulters}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subjectWiseAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Defaulter Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Defaulter Management
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600 flex items-center">
                Minimum Attendance: {settings?.minimumAttendancePercentage || 75}%
              </div>
            </div>

            {/* Defaulters Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDefaulters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No defaulters found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDefaulters.map((student) => (
                      <TableRow 
                        key={student.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/student/${student.id}`)}
                      >
                        <TableCell className="font-medium">{student.rollNo}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">
                            {student.attendancePercentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

