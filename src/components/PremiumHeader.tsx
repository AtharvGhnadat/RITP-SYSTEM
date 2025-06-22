import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, X, LogOut, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
interface PremiumHeaderProps {
  title?: string;
  showNotifications?: boolean;
}
export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title = "Smart Attendance System",
  showNotifications = true
}) => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  const handleLogoClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'faculty') {
      navigate('/faculty/dashboard');
    } else {
      navigate('/');
    }
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const navigationItems = user?.role === 'admin' ? [{
    label: 'Dashboard',
    href: '/admin/dashboard'
  }, {
    label: 'Students',
    href: '/admin/students'
  }, {
    label: 'Faculty',
    href: '/admin/faculty'
  }, {
    label: 'Subjects',
    href: '/admin/subjects'
  }, {
    label: 'Analytics',
    href: '/admin/analytics'
  }, {
    label: 'Settings',
    href: '/admin/settings'
  }] : [{
    label: 'Dashboard',
    href: '/faculty/dashboard'
  }, {
    label: 'Attendance',
    href: '/faculty/attendance'
  }, {
    label: 'History',
    href: '/faculty/history'
  }, {
    label: 'Students',
    href: '/faculty/student-search'
  }];
  return <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 py-3 px-4 sm:px-0" style={{
        paddingTop: '15px',
        paddingBottom: '15px'
      }}>
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 my-0">
            <button onClick={handleLogoClick} className="flex items-center space-x-2 sm:space-x-3 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-md p-1">
              <img src="/uploads/logo.png" alt="College Logo" className="h-12 w-12 sm:h-12 sm:w-12 rounded-md flex-shrink-" />
              <div className="hidden sm:block min-w-0">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-foreground truncate">
                  {title}
                </h1>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-shrink-0">
            {navigationItems.map(item => <Link key={item.href} to={item.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-200 whitespace-nowrap">
                {item.label}
              </Link>)}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Notifications */}
            {showNotifications && <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10" aria-label="Notifications">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full">
                  <span className="sr-only">New notifications</span>
                </span>
              </Button>}

            {/* User Menu - Desktop */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-9 sm:h-10 px-2 sm:px-3">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden lg:inline-block max-w-20 xl:max-w-28 truncate text-sm">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-accent text-red-600 hover:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 sm:h-10 sm:w-10" onClick={toggleMobileMenu} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={cn("lg:hidden transition-all duration-300 ease-in-out overflow-hidden border-t border-border", isMobileMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0")}>
          <nav className="space-y-1 pt-4 py-[17px]">
            {navigationItems.map(item => <Link key={item.href} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-foreground hover:bg-accent rounded-md transition-colors py-3 px-4">
                {item.label}
              </Link>)}
            
            {/* Mobile User Info & Logout */}
            <div className="border-t border-border mt-4 pt-4">
              <div className="flex items-center space-x-3 px-4 mb-3">
                <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-left hover:bg-accent px-4 py-3 font-medium text-red-600 hover:text-red-700 min-h-[48px]">
                <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Footer with Branding */}
      <div className="hidden print:block text-xs text-center py-2 border-t border-border bg-muted/30">
        <p>© 2024 Smart Attendance System. All rights reserved to Atharv Ghandat.</p>
        <p>Developed by Atharv Ghandat</p>
      </div>
    </header>;
};