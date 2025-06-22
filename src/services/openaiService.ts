
import { SystemSettings } from '../contexts/DatabaseContext';

interface GenerateMessageRequest {
  subjectName: string;
  date: string;
  time: string;
  department: string;
  year: string;
  absentStudents: Array<{
    rollNo: string;
    name: string;
  }>;
  tone: 'strict' | 'polite' | 'friendly';
  facultyName: string;
  customTemplate?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenAISettings {
  openaiApiKey?: string;
  openaiEnabled: boolean;
}

export class OpenAIService {
  private apiKey: string | null = null;
  private isEnabled: boolean = false;

  constructor(settings?: OpenAISettings) {
    if (settings) {
      this.apiKey = settings.openaiApiKey || null;
      this.isEnabled = settings.openaiEnabled;
    }
  }

  updateSettings(settings: OpenAISettings) {
    this.apiKey = settings.openaiApiKey || null;
    this.isEnabled = settings.openaiEnabled;
  }

  async generateWhatsAppMessage(request: GenerateMessageRequest): Promise<string> {
    if (!this.isEnabled || !this.apiKey) {
      return this.generateFallbackMessage(request);
    }

    try {
      const prompt = this.constructPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates professional WhatsApp messages for parents about their children\'s school attendance. Keep messages concise, clear, and appropriate for the requested tone.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        return this.generateFallbackMessage(request);
      }

      const data: OpenAIResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        console.error('No response from OpenAI API');
        return this.generateFallbackMessage(request);
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.generateFallbackMessage(request);
    }
  }

  private constructPrompt(request: GenerateMessageRequest): string {
    const studentList = request.absentStudents.map(student => 
      `- ${student.name} (Roll No: ${student.rollNo})`
    ).join('\n');

    return `Generate a WhatsApp message for parents about their children's attendance.

Context:
- Subject: ${request.subjectName}
- Date: ${request.date}
- Time: ${request.time}
- Department: ${request.department}
- Year: ${request.year}
- Faculty: ${request.facultyName}

Absent Students:
${studentList}

Tone: ${request.tone}
${request.customTemplate ? `\nCustom Template/Instructions: ${request.customTemplate}` : ''}

Requirements:
- Use a ${request.tone} tone
- Keep it professional and appropriate for parents
- Include all absent students with their roll numbers
- Make it suitable for WhatsApp (concise but informative)
- End with appropriate closing based on tone

Generate the message:`;
  }

  private generateFallbackMessage(request: GenerateMessageRequest): string {
    const { subjectName, date, time, absentStudents, tone } = request;
    
    let message = '';
    
    if (tone === 'strict') {
      message = `ATTENDANCE ALERT - IMMEDIATE ATTENTION REQUIRED\n\n`;
      message += `Subject: ${subjectName}\n`;
      message += `Date: ${date}\n`;
      message += `Time: ${time}\n\n`;
      message += `The following students were ABSENT:\n\n`;
    } else if (tone === 'friendly') {
      message = `Hi there! 😊\n\n`;
      message += `Hope you're having a great day! Just wanted to update you about today's attendance for ${subjectName} (${date} at ${time}):\n\n`;
      message += `Students who were absent:\n\n`;
    } else {
      message = `Dear Parent/Guardian,\n\n`;
      message += `This is to inform you about your ward's attendance in ${subjectName} on ${date} at ${time}:\n\n`;
      message += `Absent students:\n\n`;
    }

    absentStudents.forEach((student, index) => {
      message += `${index + 1}. ${student.name} (Roll No: ${student.rollNo})\n`;
    });

    if (tone === 'strict') {
      message += `\nThis absence is recorded and will affect the student's overall attendance percentage. Immediate action is required to ensure regular attendance.`;
    } else if (tone === 'friendly') {
      message += `\nNo worries! Just wanted to keep you in the loop. Please ensure they attend regularly for the best learning experience! 😊`;
    } else {
      message += `\nKindly ensure your ward attends classes regularly for better academic performance. Thank you for your cooperation.`;
    }

    return message;
  }
}

export const openaiService = new OpenAIService();
