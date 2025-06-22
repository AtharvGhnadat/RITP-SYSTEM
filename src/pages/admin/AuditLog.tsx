
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ArrowLeft, FileText, Search } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import type { AuditLog } from '../../contexts/DatabaseContext';

const AuditLogPage = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [adminUserFilter, setAdminUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const actionTypes = [
    'Faculty Approved',
    'Faculty Rejected', 
    'Student Added',
    'Student Updated',
    'Student Deleted',
    'Faculty Added',
    'Faculty Updated',
    'Faculty Deleted',
    'Subject Added',
    'Subject Updated',
    'Subject Deleted',
    'Batch Created',
    'Batch Updated',
    'Batch Deleted',
    'Settings Changed',
    'Bulk Import',
    'Data Export',
    'Data Purge',
    'Announcement Created',
    'Announcement Deleted',
    'Attendance Corrected',
    'Profile Updated',
    'Password Changed'
  ];

  const uniqueAdminUsers = React.useMemo(() => {
    const users = [...new Set(auditLogs.map(log => log.adminUserName))];
    return users.filter(user => user !== 'System');
  }, [auditLogs]);

  useEffect(() => {
    loadAuditLogs();
  }, [db]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, actionTypeFilter, adminUserFilter, dateFilter]);

  const loadAuditLogs = async () => {
    if (!db) return;
    
    try {
      const logs = await db.auditLogs.orderBy('timestamp').reverse().toArray();
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.adminUserName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (actionTypeFilter && actionTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.actionType === actionTypeFilter);
    }
    
    if (adminUserFilter && adminUserFilter !== 'all') {
      filtered = filtered.filter(log => log.adminUserName === adminUserFilter);
    }
    
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now);
          filtered = filtered.filter(log => {
            const logDate = parseISO(log.timestamp);
            return logDate >= startDate;
          });
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(log => {
            const logDate = parseISO(log.timestamp);
            return logDate >= startDate;
          });
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(log => {
            const logDate = parseISO(log.timestamp);
            return logDate >= startDate;
          });
          break;
      }
    }
    
    setFilteredLogs(filtered);
  };

  const getActionTypeVariant = (actionType: string) => {
    if (actionType.includes('Deleted') || actionType.includes('Rejected') || actionType.includes('Purge')) {
      return 'destructive';
    }
    if (actionType.includes('Added') || actionType.includes('Created') || actionType.includes('Approved')) {
      return 'default';
    }
    if (actionType.includes('Updated') || actionType.includes('Changed') || actionType.includes('Corrected')) {
      return 'secondary';
    }
    return 'outline';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, 'PPp');
    } catch {
      return 'Invalid date';
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
              <h1 className="text-xl font-semibold text-gray-900">Audit Log</h1>
              <p className="text-sm text-gray-500">Track administrative actions and system changes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log ({filteredLogs.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin User</label>
                <Select value={adminUserFilter} onValueChange={setAdminUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueAdminUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.adminUserName}</span>
                          {log.adminUserName === 'System' && (
                            <Badge variant="outline" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionTypeVariant(log.actionType)}>
                          {log.actionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.details}>
                          {log.details}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No audit logs found</p>
                <p className="text-gray-400 text-sm">
                  {auditLogs.length === 0 
                    ? "No administrative actions have been logged yet."
                    : "Try adjusting your filters to see more results."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogPage;
