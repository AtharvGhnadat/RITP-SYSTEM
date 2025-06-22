
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, Copy, Wand2 } from 'lucide-react';
import { openaiService } from '../../services/openaiService';

const MessageGenerator = () => {
  const { db } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTone, setSelectedTone] = useState<'strict' | 'polite' | 'friendly'>('polite');
  const [customTemplate, setCustomTemplate] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (db && user) {
      loadSubjects();
    }
  }, [db, user]);

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      loadAbsentStudents();
    }
  }, [selectedSubject, selectedDate]);

  const loadSubjects = async () => {
    if (!db || !user) return;
    
    try {
      // Get faculty subjects
      const assignments = await db.facultySubjects
        .where('facultyId')
        .equals(user.id)
        .toArray();

      const subjectPromises = assignments.map(async assignment => {
        const subject = await db.subjects.get(assignment.subjectId);
        return {
          ...subject,
          department: assignment.department,
          year: assignment.year
        };
      });

      const subjectData = await Promise.all(subjectPromises);
      setSubjects(subjectData.filter(Boolean));
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAbsentStudents = async () => {
    if (!db || !user || !selectedSubject || !selectedDate) return;
    
    try {
      // Find attendance record for the selected subject and date
      const attendanceRecord = await db.attendanceRecords
        .where('[subjectId+facultyId+date]')
        .equals([selectedSubject, user.id, selectedDate])
        .first();

      if (attendanceRecord) {
        const absent = attendanceRecord.studentAttendance
          .filter((s: any) => s.status === 'absent')
          .map((s: any) => ({
            rollNo: s.rollNo,
            name: s.name
          }));
        setAbsentStudents(absent);
      } else {
        setAbsentStudents([]);
        toast({
          title: "No Attendance Record",
          description: "No attendance record found for the selected date and subject.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to load absent students:', error);
    }
  };

  const generateMessage = async () => {
    if (!selectedSubject || !selectedDate || absentStudents.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a subject, date, and ensure there are absent students.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (!subject) return;

      // Get system settings for OpenAI - simplified approach
      let openaiEnabled = false;
      let openaiApiKey = '';
      
      try {
        const settings = await db?.systemSettings.get('system-settings');
        if (settings) {
          openaiEnabled = settings.openaiEnabled || false;
          openaiApiKey = settings.openaiApiKey || '';
        }
      } catch (error) {
        console.error('Failed to load OpenAI settings:', error);
      }

      // Update OpenAI service with current settings - pass only what the service needs
      openaiService.updateSettings({
        openaiEnabled,
        openaiApiKey
      });

      const messageRequest = {
        subjectName: subject.name,
        date: new Date(selectedDate).toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        department: subject.department,
        year: subject.year,
        absentStudents: absentStudents,
        tone: selectedTone,
        facultyName: user.name,
        customTemplate: customTemplate
      };

      const message = await openaiService.generateWhatsAppMessage(messageRequest);
      setGeneratedMessage(message);

      toast({
        title: "Message Generated",
        description: "WhatsApp message has been generated successfully.",
      });
    } catch (error) {
      console.error('Failed to generate message:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
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
              <h1 className="text-xl font-semibold text-gray-900">WhatsApp Message Generator</h1>
              <p className="text-sm text-gray-500">Generate messages for absent students</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} - {subject.department} {subject.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message Tone</Label>
                <Select value={selectedTone} onValueChange={(value: 'strict' | 'polite' | 'friendly') => setSelectedTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polite">Polite</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Custom Template (Optional)</Label>
                <Textarea
                  id="template"
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  placeholder="Add any specific instructions or custom message template..."
                  rows={3}
                />
              </div>

              {absentStudents.length > 0 && (
                <div className="space-y-2">
                  <Label>Absent Students ({absentStudents.length})</Label>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-md">
                    {absentStudents.map((student, index) => (
                      <div key={index} className="text-sm">
                        {student.rollNo} - {student.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={generateMessage}
                disabled={isGenerating || !selectedSubject || !selectedDate || absentStudents.length === 0}
                className="w-full flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Message
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Message</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedMessage ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedMessage}
                    readOnly
                    rows={12}
                    className="resize-none"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    className="w-full flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your message settings and click "Generate Message" to create a WhatsApp message for absent students.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessageGenerator;
