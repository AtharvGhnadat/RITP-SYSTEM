import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Calendar, BarChart, Shield, CheckCircle, Clock, FileText } from 'lucide-react';
const LandingPage = () => {
  const navigate = useNavigate();
  const features = [{
    icon: Users,
    title: "Student Management",
    description: "Comprehensive student database with profiles and academic records"
  }, {
    icon: BookOpen,
    title: "Subject Assignment",
    description: "Efficient subject allocation to faculty with department-wise organization"
  }, {
    icon: Calendar,
    title: "Attendance Tracking",
    description: "Digital attendance marking with automated notifications"
  }, {
    icon: BarChart,
    title: "Analytics & Reports",
    description: "Detailed attendance reports and analytics for better insights"
  }, {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure access control for administrators and faculty members"
  }, {
    icon: GraduationCap,
    title: "Academic Excellence",
    description: "Tools to improve attendance rates and academic performance"
  }];
  const futureEnhancements = [{
    icon: Users,
    title: "Student & Parent Portal",
    description: "Direct access for students and parents to view attendance records"
  }, {
    icon: BarChart,
    title: "Advanced AI Insights",
    description: "Predictive analytics for academic performance and attendance patterns"
  }, {
    icon: CheckCircle,
    title: "Biometric Integration",
    description: "Fingerprint and facial recognition for automated attendance"
  }, {
    icon: BookOpen,
    title: "LMS/ERP Integration",
    description: "Seamless integration with existing learning management systems"
  }, {
    icon: Clock,
    title: "Real-time Notifications",
    description: "Instant SMS/Email alerts for attendance and academic updates"
  }, {
    icon: FileText,
    title: "Multilingual Support",
    description: "Support for multiple languages to serve diverse institutions"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50 nav-clean">
        <div className="container-clean">
          <div className="flex items-center justify-between h-14 sm:h-16 my-[20px]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img src="/uploads/logo.png" alt="College Logo" className="h-11 w-11 sm:h-11 sm:w-11 rounded-md flex-shrink-0 object-cover" />
              <span className="text-lg sm:text-xl font-bold text-foreground truncate px-[5px]">Smart Attendance </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button variant="outline" onClick={() => navigate('/login')} className="text-sm px-3 py-2 touch-target rounded-2xl">
                Login
              </Button>
              <Button onClick={() => navigate('/register')} className="btn-primary text-sm px-3 py-2 touch-target rounded-2xl">
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-clean">
        <div className="container-clean text-center">
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 my-[10px]">
              Modern Attendance
              <span className="text-primary block mt-2">Management System</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your educational institution's attendance tracking with our comprehensive, 
              user-friendly digital solution designed for the modern classroom.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Button size="lg" onClick={() => navigate('/login')} className="btn-primary text-base px-6 py-3 sm:px-8 sm:py-4 touch-target rounded-3xl mx-[50px]">
                Login to Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register')} className="text-base px-6 py-3 sm:px-8 sm:py-4 touch-target rounded-3xl mx-[50px]">
                Register as Faculty
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-clean bg-white">
        <div className="container-clean">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Attendance Management
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our comprehensive platform provides all the tools necessary for efficient 
              attendance tracking and academic management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mx-[12px] rounded-none">
            {features.map((feature, index) => <Card key={index} style={{
            animationDelay: `${index * 0.1}s`
          }} className="clean-card hover:shadow-lg transition-shadow duration-300 animate-fade-in rounded-xl mx-0 my-0">
                <CardHeader className="clean-card-header pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
                    <span className="leading-tight">{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="clean-card-content">
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Future Enhancements Section */}
      <section className="section-clean bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container-clean">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Future Enhancements
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're continuously working to expand our platform with cutting-edge features 
              to serve educational institutions better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {futureEnhancements.map((feature, index) => <Card key={index} className="clean-card border-2 border-dashed border-border/50 bg-background/50 hover:bg-background transition-colors duration-300 animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <CardHeader className="clean-card-header pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground flex-shrink-0" />
                    <span className="leading-tight text-muted-foreground">{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="clean-card-content">
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-clean text-primary-foreground bg-blue-600 rounded-lg">
        <div className="container-clean text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-slate-50">
              Ready to Transform Your Attendance Management?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed text-zinc-100">
              Join hundreds of educational institutions already using our platform 
              to improve their attendance tracking and academic outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Button size="lg" variant="secondary" onClick={() => navigate('/login')} className="text-base px-6 py-3 sm:px-8 sm:py-4 touch-target mx-[50px] rounded-2xl">
                Login Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register')} className="text-base px-6 py-3 sm:px-8 sm:py-4 touch-target bg-white text-primary hover:bg-gray-100 border-white mx-[50px] rounded-2xl">
                Register as Faculty
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background section-clean">
        <div className="container-clean">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/uploads/logo.png" alt="College Logo" className="h-12 w-12 rounded-md" />
                <span className="text-base sm:text-lg font-bold">Smart Attendance System</span>
              </div>
              <p className="text-background/80 text-sm sm:text-base leading-relaxed">
                Modern attendance management for educational institutions.
              </p>
            </div>
            <div className="mx-0">
              <h3 className="font-semibold mb-4 text-base sm:text-lg text-slate-50">Quick Links</h3>
              <ul className="space-y-2 text-background/80">
                <li>
                  <Button variant="link" className="p-0 h-auto text-background/80 hover:text-background text-sm sm:text-base" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-background/80 hover:text-background text-sm sm:text-base" onClick={() => navigate('/register')}>
                    Register
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base sm:text-lg text-slate-50">Contact</h3>
              <p className="text-background/80 text-sm sm:text-base leading-relaxed">
                For support and inquiries, please contact your system administrator.
              </p>
            </div>
          </div>
          <div className="border-t border-background/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-background/80 bg-transparent">
            <p className="text-sm sm:text-base text-slate-50">&copy; 2024 Smart Attendance System. All rights reserved.</p>
            <p className="mt-2 text-slate-50 text-lg font-semibold">Developed by Atharv Ghandat ❤️</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;