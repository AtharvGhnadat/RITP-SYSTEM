import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Upload, Archive, Trash2, CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PremiumPageWrapper } from '@/components/PremiumPageWrapper';

const DataManagement = () => {
  const navigate = useNavigate();
  const { db } = useDatabase();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [archiveDate, setArchiveDate] = useState<Date>();
  const [purgeDate, setPurgeDate] = useState<Date>();

  const logAuditAction = async (action: string, details: string, userId: string, userRole: 'admin' | 'faculty') => {
    try {
      await db.auditLogs.add({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userId: userId || '',
        userRole,
        action,
        actionType: action,
        details,
        adminUserName: user?.name || 'Unknown'
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  const exportAllData = async () => {
    if (!db) return;

    setIsExporting(true);
    try {
      // Get all data from all stores
      const allData = {
        students: await db.students.toArray(),
        faculty: await db.users.toArray(),
        subjects: await db.subjects.toArray(),
        facultySubjects: await db.facultySubjects.toArray(),
        attendanceRecords: await db.attendanceRecords.toArray(),
        batches: await db.batches.toArray(),
        auditLogs: await db.auditLogs.toArray(),
        announcements: await db.announcements.toArray(),
        systemSettings: await db.systemSettings.toArray(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_system_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the action
      await logAuditAction('Bulk Data Export', 'Complete system data backup exported', user?.id?.toString() || '', 'admin');

      toast({
        title: "Export Successful",
        description: "All system data has been exported successfully.",
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  const importData = async (file: File) => {
    if (!db) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);

      // Validate the imported data structure
      if (!importedData.version || !importedData.exportDate) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data with progress updates
      const stores = ['students', 'users', 'subjects', 'facultySubjects', 'attendanceRecords', 'batches', 'announcements'];
      let progress = 0;
      const progressStep = 80 / (stores.length * 2); // 80% for clearing and importing, 20% for final steps

      for (const storeName of stores) {
        if (db[storeName as keyof typeof db]) {
          await (db[storeName as keyof typeof db] as any).clear();
          progress += progressStep;
          setImportProgress(progress);
        }
      }

      // Import new data
      for (const storeName of stores) {
        if (importedData[storeName] && db[storeName as keyof typeof db]) {
          await (db[storeName as keyof typeof db] as any).bulkAdd(importedData[storeName]);
          progress += progressStep;
          setImportProgress(progress);
        }
      }

      // Import system settings if available
      if (importedData.systemSettings && importedData.systemSettings.length > 0) {
        await db.systemSettings.clear();
        await db.systemSettings.bulkAdd(importedData.systemSettings);
      }

      setImportProgress(90);

      // Log the action
      await logAuditAction('Bulk Data Import', `Data imported from backup file: ${file.name}`, user?.id?.toString() || '', 'admin');

      setImportProgress(100);

      toast({
        title: "Import Successful",
        description: "All data has been imported successfully. The page will reload.",
      });

      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const archiveAttendanceData = async () => {
    if (!db || !archiveDate) return;

    setIsArchiving(true);
    try {
      const cutoffDate = archiveDate.toISOString().split('T')[0];
      
      // Get records to archive
      const recordsToArchive = await db.attendanceRecords
        .where('date')
        .below(cutoffDate)
        .toArray();

      if (recordsToArchive.length === 0) {
        toast({
          title: "No Records Found",
          description: "No attendance records found before the selected date.",
        });
        setIsArchiving(false);
        return;
      }

      // Update the records in the database with proper typing
      await Promise.all(
        recordsToArchive.map(record => {
          if (record.id) {
            return db.attendanceRecords.update(record.id, { 
              ...record,
              isArchived: true, 
              archivedAt: new Date().toISOString() 
            });
          }
          return Promise.resolve();
        })
      );

      // Log the action
      await logAuditAction('Data Archiving', `Archived ${recordsToArchive.length} attendance records before ${format(archiveDate, 'PPP')}`, user?.id?.toString() || '', 'admin');

      toast({
        title: "Archive Successful",
        description: `${recordsToArchive.length} attendance records have been archived.`,
      });

    } catch (error) {
      console.error('Archive failed:', error);
      toast({
        title: "Archive Failed",
        description: "Failed to archive attendance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const purgeAttendanceData = async () => {
    if (!db || !purgeDate) return;

    setIsPurging(true);
    try {
      const cutoffDate = purgeDate.toISOString().split('T')[0];
      
      // Get records to purge
      const recordsToPurge = await db.attendanceRecords
        .where('date')
        .below(cutoffDate)
        .toArray();

      if (recordsToPurge.length === 0) {
        toast({
          title: "No Records Found",
          description: "No attendance records found before the selected date.",
        });
        setIsPurging(false);
        return;
      }

      // Delete the records
      await db.attendanceRecords
        .where('date')
        .below(cutoffDate)
        .delete();

      // Log the action
      await logAuditAction('Data Purging', `Permanently deleted ${recordsToPurge.length} attendance records before ${format(purgeDate, 'PPP')}`, user?.id?.toString() || '', 'admin');

      toast({
        title: "Purge Successful",
        description: `${recordsToPurge.length} attendance records have been permanently deleted.`,
      });

    } catch (error) {
      console.error('Purge failed:', error);
      toast({
        title: "Purge Failed",
        description: "Failed to purge attendance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <PremiumPageWrapper
      title="Data Management"
      subtitle="Backup, restore, and manage system data"
      headerTitle="Smart Attendance System"
    >
      <div className="space-y-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Data Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Backup & Restore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Export All Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download a complete backup of all system data including students, faculty, subjects, attendance records, and settings.
                </p>
                <Button 
                  onClick={exportAllData}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export All Data (JSON)'}
                </Button>
              </div>

              <Separator />

              {/* Import Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">Import Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Restore system data from a previously exported backup file. This will overwrite all existing data.
                </p>
                
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Importing data will permanently overwrite all existing records. Make sure to export current data first if needed.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dataFile">Select Backup File (JSON)</Label>
                    <Input
                      id="dataFile"
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      disabled={isImporting}
                      className="mt-1"
                    />
                  </div>

                  {isImporting && (
                    <div className="space-y-2">
                      <Label>Import Progress</Label>
                      <Progress value={importProgress} className="w-full" />
                      <p className="text-sm text-gray-600">{importProgress}% complete</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Archiving & Purging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Data Archiving & Purging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Archive Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Archive Old Attendance Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Mark old attendance records as archived. Archived records are kept in the system but hidden from regular views.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <Label>Archive records before this date:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !archiveDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {archiveDate ? format(archiveDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={archiveDate}
                          onSelect={setArchiveDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        disabled={!archiveDate || isArchiving}
                        className="flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        {isArchiving ? 'Archiving...' : 'Archive Data'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Attendance Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will mark all attendance records before {archiveDate ? format(archiveDate, "PPP") : "the selected date"} as archived. 
                          Archived records will be hidden from normal views but can still be accessed if needed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={archiveAttendanceData}>
                          Archive Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <Separator />

              {/* Purge Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">Purge Old Attendance Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete old attendance records. This action cannot be undone.
                </p>
                
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Danger:</strong> Purging data will permanently delete records. This action cannot be undone. Consider archiving instead.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <Label>Purge records before this date:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !purgeDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {purgeDate ? format(purgeDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={purgeDate}
                          onSelect={setPurgeDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        disabled={!purgeDate || isPurging}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isPurging ? 'Purging...' : 'Purge Data'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently Delete Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all attendance records before {purgeDate ? format(purgeDate, "PPP") : "the selected date"}. 
                          This action cannot be undone. Are you absolutely sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={purgeAttendanceData}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Delete Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PremiumPageWrapper>
  );
};

export default DataManagement;
