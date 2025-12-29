import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar,
  CalendarDays,
  Settings,
  BarChart3,
  Users,
  Clock,
  PlusCircle,
  Home,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Stethoscope,
  HeartCrack,
  Tablet,
  Bell
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Agrupamos los items en secciones
const sidebarSections = [
  {
    label: "General",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ]
  },
  {
    label: "Appointments",
    items: [
      { title: "Create Appointment", url: "/appointments/new", icon: PlusCircle },
    ]
  },
  {
    label: "Management",
    items: [
      { title: "Customers", url: "/customers", icon: Users, requiresAdmin: true },
      { title: "Staff members", url: "/staff", icon: Users, requiresAdmin: true },
      { title: "Services", url: "/services", icon: ClipboardCheck, requiresAdmin: true },
      { title: "Days Off", url: "/daysoff", icon: XCircle },
    ]
  },

];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const isCollapsed = state === "collapsed";
  const currentPath = location.pathname;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent ${
      isActive ? "bg-primary text-primary-foreground" : "text-foreground"
    }`;

  return (
    <Sidebar collapsible="icon">
      {/* HEADER */}
      <div className="flex h-14 items-center border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">AppointmentPro</span>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <SidebarContent className="overflow-x-hidden">
        {sidebarSections.map((section) => (
          <SidebarGroup key={section.label}>
            {!isCollapsed && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  if (item.requiresAdmin && user?.group !== "Admins") return null;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
