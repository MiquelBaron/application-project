import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Clock, 
  Bell, 
  Globe, 
  Calendar,
  Save,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Configuration state (these would be loaded from your Django API)
  const [config, setConfig] = useState({
    // Business Information
    businessName: "AppointmentPro Business",
    businessEmail: "contact@business.com",
    businessPhone: "+1 (555) 123-4567",
    businessAddress: "123 Business St, City, State 12345",
    
    // Appointment Settings
    defaultDuration: "30",
    bufferTime: "15",
    advanceBookingDays: "30",
    cancellationHours: "24",
    
    // Working Hours
    mondayStart: "09:00",
    mondayEnd: "17:00",
    mondayEnabled: true,
    tuesdayStart: "09:00",
    tuesdayEnd: "17:00", 
    tuesdayEnabled: true,
    wednesdayStart: "09:00",
    wednesdayEnd: "17:00",
    wednesdayEnabled: true,
    thursdayStart: "09:00",
    thursdayEnd: "17:00",
    thursdayEnabled: true,
    fridayStart: "09:00",
    fridayEnd: "17:00",
    fridayEnabled: true,
    saturdayStart: "10:00",
    saturdayEnd: "14:00",
    saturdayEnabled: false,
    sundayStart: "10:00", 
    sundayEnd: "14:00",
    sundayEnabled: false,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    reminderHours: "24",
    
    // System Settings
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12",
    language: "en",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would call your Django API to save the configuration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const weekdays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
          <p className="text-muted-foreground">
            Configure your appointment system settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-gradient-primary text-white hover:opacity-90">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Basic information about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={config.businessName}
                onChange={(e) => updateConfig('businessName', e.target.value)}
                placeholder="Your Business Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={config.businessEmail}
                onChange={(e) => updateConfig('businessEmail', e.target.value)}
                placeholder="contact@business.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={config.businessPhone}
                onChange={(e) => updateConfig('businessPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                value={config.businessAddress}
                onChange={(e) => updateConfig('businessAddress', e.target.value)}
                placeholder="123 Business St, City, State 12345"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Settings
            </CardTitle>
            <CardDescription>
              Default settings for appointment booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                <Select value={config.defaultDuration} onValueChange={(value) => updateConfig('defaultDuration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                <Select value={config.bufferTime} onValueChange={(value) => updateConfig('bufferTime', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="advanceBooking">Advance Booking (days)</Label>
                <Input
                  id="advanceBooking"
                  type="number"
                  value={config.advanceBookingDays}
                  onChange={(e) => updateConfig('advanceBookingDays', e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellation">Cancellation Notice (hours)</Label>
                <Input
                  id="cancellation"
                  type="number"
                  value={config.cancellationHours}
                  onChange={(e) => updateConfig('cancellationHours', e.target.value)}
                  placeholder="24"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Working Hours
            </CardTitle>
            <CardDescription>
              Set your business operating hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekdays.map((day) => (
                <div key={day.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={config[`${day.key}Enabled` as keyof typeof config] as boolean}
                      onCheckedChange={(checked) => updateConfig(`${day.key}Enabled`, checked)}
                    />
                    <Label className="min-w-[80px] text-left">{day.label}</Label>
                  </div>
                  
                  {config[`${day.key}Enabled` as keyof typeof config] && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={config[`${day.key}Start` as keyof typeof config] as string}
                        onChange={(e) => updateConfig(`${day.key}Start`, e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={config[`${day.key}End` as keyof typeof config] as string}
                        onChange={(e) => updateConfig(`${day.key}End`, e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                  
                  {!config[`${day.key}Enabled` as keyof typeof config] && (
                    <div className="text-muted-foreground">Closed</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification settings for appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email notifications for appointments</p>
              </div>
              <Switch
                checked={config.emailNotifications}
                onCheckedChange={(checked) => updateConfig('emailNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send SMS notifications for appointments</p>
              </div>
              <Switch
                checked={config.smsNotifications}
                onCheckedChange={(checked) => updateConfig('smsNotifications', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminderHours">Reminder Time (hours before)</Label>
              <Select value={config.reminderHours} onValueChange={(value) => updateConfig('reminderHours', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Localization and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={config.timezone} onValueChange={(value) => updateConfig('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={config.dateFormat} onValueChange={(value) => updateConfig('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={config.timeFormat} onValueChange={(value) => updateConfig('timeFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={config.language} onValueChange={(value) => updateConfig('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}