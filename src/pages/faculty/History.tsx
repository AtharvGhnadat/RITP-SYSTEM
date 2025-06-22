
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History as HistoryIcon, Calendar, BookOpen, Users } from 'lucide-react';

const History = () => {
  const { db } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (db && user) {
      loadData();
    }
  }, [db, user]);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchTerm, selectedSubject]);

  const loadData = async () => {
    if (!db || !user) return;
    
    try {
      // Load attendance records for this faculty
      const records = await db.attendanceRecords
        .where('facultyId')
        .equals(user.id)
        .reverse()
        .toArray();

      // Load subjects for filtering
      const subjectIds = [...new Set(records.map(r => r.subjectId))];
      const subjectPromises = subjectIds.map(id => db.subjects.get(id));
      const subjectData = await Promise.all(subjectPromises);
      
      setAttendanceRecords(records);
      setSubjects(subjectData.filter(Boolean));
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = attendanceRecords;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.date.includes(searchTerm) ||
        subjects.find(s => s?.id === record.subjectId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter(record => record.subjectId === selectedSubject);
    }
    
    setFilteredRecords(filtered);
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s?.id === subjectId);
    return subject?.name || 'Unknown Subject';
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
              onClick={() => navigate('/faculty/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Attendance History</h1>
              <p className="text-sm text-gray-500">View your past attendance records</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Attendance Records ({filteredRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by date or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="sm:w-48">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found</p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const presentCount = record.studentAttendance.filter((s: any) => s.status === 'present').length;
                  const totalCount = record.studentAttendance.length;
                  
                  return (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <h3 className="font-semibold">{getSubjectName(record.subjectId)}</h3>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(record.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Marked at: {new Date(record.timeMarked).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Total: {totalCount}
                            </Badge>
                            <Badge variant="default" className="bg-green-600">
                              Present: {presentCount}
                            </Badge>
                            <Badge variant="destructive">
                              Absent: {totalCount - presentCount}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round((presentCount / totalCount) * 100)}% Attendance
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;
