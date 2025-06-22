
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  // Temporarily disabled until notification system is fully implemented
  return (
    <Button variant="ghost" size="sm" className="relative opacity-50 cursor-not-allowed">
      <Bell className="h-5 w-5" />
    </Button>
  );
};

export default NotificationBell;
