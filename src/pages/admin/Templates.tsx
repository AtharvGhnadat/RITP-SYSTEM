
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MessageTemplate } from '../../contexts/DatabaseContext';

const Templates = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toneFilter, setToneFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'General' as MessageTemplate['category'],
    tone: 'polite' as MessageTemplate['tone']
  });

  const categories: MessageTemplate['category'][] = ['General', 'Attendance Alert', 'Defaulter Notice', 'Reminder'];
  const tones: MessageTemplate['tone'][] = ['strict', 'polite', 'friendly'];
  
  const availableVariables = [
    '{{studentName}}', '{{rollNo}}', '{{subject}}', '{{date}}', '{{time}}',
    '{{department}}', '{{year}}', '{{parentMobile}}', '{{facultyName}}',
    '{{collegeName}}', '{{attendancePercentage}}', '{{className}}'
  ];

  useEffect(() => {
    loadTemplates();
  }, [db]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter, toneFilter]);

  const loadTemplates = async () => {
    if (!db) return;
    
    try {
      const allTemplates = await db.messageTemplates.toArray();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Tone filter
    if (toneFilter && toneFilter !== 'all') {
      filtered = filtered.filter(template => template.tone === toneFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      const variables = extractVariables(formData.content);

      if (editingTemplate) {
        // Update existing template
        await db.messageTemplates.update(editingTemplate.id, {
          name: formData.name,
          content: formData.content,
          type: 'general', // Add required type field
          category: formData.category,
          tone: formData.tone,
          variables
        });
        toast({
          title: "Success",
          description: "Template updated successfully!"
        });
      } else {
        // Add new template - generate string ID and use it consistently
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTemplate: MessageTemplate = {
          id: templateId,
          name: formData.name,
          content: formData.content,
          type: 'general', // Add required type field
          category: formData.category,
          tone: formData.tone,
          variables,
          createdAt: new Date().toISOString()
        };
        await db.messageTemplates.add(newTemplate);
        toast({
          title: "Success",
          description: "Template added successfully!"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      tone: template.tone
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (!db) return;

    try {
      await db.messageTemplates.delete(template.id);
      toast({
        title: "Success",
        description: "Template deleted successfully!"
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      category: 'General',
      tone: 'polite'
    });
    setEditingTemplate(null);
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = content.match(regex);
    return matches ? [...new Set(matches)] : [];
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end);
      setFormData({ ...formData, content: newContent });
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const getPreviewContent = () => {
    return formData.content
      .replace(/\{\{studentName\}\}/g, 'John Doe')
      .replace(/\{\{rollNo\}\}/g, '2023001')
      .replace(/\{\{subject\}\}/g, 'Data Structures')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString())
      .replace(/\{\{department\}\}/g, 'Computer Science')
      .replace(/\{\{year\}\}/g, '2nd Year')
      .replace(/\{\{parentMobile\}\}/g, '+91 9123456789')
      .replace(/\{\{facultyName\}\}/g, 'Dr. Smith')
      .replace(/\{\{collegeName\}\}/g, 'RITP College')
      .replace(/\{\{attendancePercentage\}\}/g, '65')
      .replace(/\{\{className\}\}/g, 'CSE-2A');
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
              <h1 className="text-xl font-semibold text-gray-900">Message Templates</h1>
              <p className="text-sm text-gray-500">Create and manage WhatsApp message templates</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Template Name</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Enter template name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <Select value={formData.category} onValueChange={(value: MessageTemplate['category']) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tone</label>
                      <Select value={formData.tone} onValueChange={(value: MessageTemplate['tone']) => setFormData({ ...formData, tone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tones.map((tone) => (
                            <SelectItem key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Message Content</label>
                      <Textarea
                        id="template-content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                        placeholder="Enter your message template..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Available Variables</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {availableVariables.map((variable) => (
                          <Button
                            key={variable}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertVariable(variable)}
                            className="text-xs"
                          >
                            {variable}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {formData.content && (
                      <div>
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Live Preview
                        </label>
                        <div className="mt-1 p-3 bg-gray-50 border rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{getPreviewContent()}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={toneFilter} onValueChange={setToneFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tones</SelectItem>
                  {tones.map((tone) => (
                    <SelectItem key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tone</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell className="capitalize">{template.tone}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable) => (
                              <span key={variable} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {variable}
                              </span>
                            ))}
                            {template.variables.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{template.variables.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(template)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

export default Templates;
