import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Settings as SettingsIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SystemSettings } from '../../contexts/DatabaseContext';

const Settings = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState<SystemSettings>({
    id: 1,
    openaiApiKey: '',
    openaiEnabled: false,
    collegeStartTime: '09:30',
    collegeEndTime: '16:30',
    theme: 'light',
    collegeLogoUrl: '/lovable-uploads/46ab4226-620a-4e6f-b2ad-dc8849643ef1.png',
    defaultMessageTone: 'polite',
    minimumAttendancePercentage: 75,
    storageWarningThreshold: 80,
    notificationsEnabled: true,
    attendanceThreshold: 75,
    updatedAt: new Date().toISOString()
  });

  useEffect(() => {
    loadSettings();
  }, [db]);

  const loadSettings = async () => {
    if (!db) return;
    
    try {
      const existingSettings = await db.systemSettings.get(1);
      if (existingSettings) {
        setSettings(existingSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!db) return;

    // Validation
    if (settings.openaiEnabled && !settings.openaiApiKey?.trim()) {
      toast({
        title: "Validation Error",
        description: "OpenAI API Key is required when OpenAI is enabled.",
        variant: "destructive"
      });
      return;
    }

    if (settings.collegeStartTime >= settings.collegeEndTime) {
      toast({
        title: "Validation Error",
        description: "College start time must be before end time.",
        variant: "destructive"
      });
      return;
    }

    if (settings.minimumAttendancePercentage < 0 || settings.minimumAttendancePercentage > 100) {
      toast({
        title: "Validation Error",
        description: "Minimum attendance percentage must be between 0 and 100.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString()
      };

      await db.systemSettings.put(updatedSettings);
      setSettings(updatedSettings);
      
      toast({
        title: "Success",
        description: "Settings saved successfully!"
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
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
              <h1 className="text-xl font-semibold text-gray-900">System Settings</h1>
              <p className="text-sm text-gray-500">Configure global system parameters</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* OpenAI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                OpenAI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable OpenAI Integration</label>
                  <p className="text-sm text-gray-500">Enable AI-powered WhatsApp message generation</p>
                </div>
                <Switch
                  checked={settings.openaiEnabled}
                  onCheckedChange={(checked) => handleInputChange('openaiEnabled', checked)}
                />
              </div>
              
              {settings.openaiEnabled && (
                <div>
                  <label className="text-sm font-medium">OpenAI API Key</label>
                  <Input
                    type="password"
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is stored securely and only used for message generation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* College Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>College Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">College Start Time</label>
                  <Input
                    type="time"
                    value={settings.collegeStartTime}
                    onChange={(e) => handleInputChange('collegeStartTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">College End Time</label>
                  <Input
                    type="time"
                    value={settings.collegeEndTime}
                    onChange={(e) => handleInputChange('collegeEndTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">College Logo URL</label>
                <Input
                  type="url"
                  value={settings.collegeLogoUrl || ''}
                  onChange={(e) => handleInputChange('collegeLogoUrl', e.target.value)}
                  placeholder="Enter logo URL or upload path"
                  className="mt-1"
                />
                {settings.collegeLogoUrl && (
                  <div className="mt-2">
                    <img 
                      src={settings.collegeLogoUrl} 
                      alt="College Logo Preview" 
                      className="h-16 w-16 object-contain border rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Minimum Attendance Percentage</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.minimumAttendancePercentage}
                  onChange={(e) => handleInputChange('minimumAttendancePercentage', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Students below this percentage will be marked as defaulters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Storage Warning Threshold (%)</label>
                <Input
                  type="number"
                  min="50"
                  max="95"
                  value={settings.storageWarningThreshold || 80}
                  onChange={(e) => handleInputChange('storageWarningThreshold', parseInt(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when storage usage exceeds this percentage
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Messaging */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Messaging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Theme</label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'light' | 'dark') => handleInputChange('theme', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Default Message Tone</label>
                <Select 
                  value={settings.defaultMessageTone || 'polite'} 
                  onValueChange={(value: 'strict' | 'polite' | 'friendly') => handleInputChange('defaultMessageTone', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="polite">Polite</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Default tone for AI-generated WhatsApp messages
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
