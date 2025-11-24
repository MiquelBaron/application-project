import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // <- importamos useAuth
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
  Tablet
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

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Appointments", url: "/appointments", icon: CalendarDays },
  { title: "Create Appointment", url: "/appointments/new", icon: PlusCircle },
  { title: "Customers", url: "/customers", icon: Users, requiresAdmin: true },
  { title: "Staff members", url: "/staff", icon: Users, requiresAdmin: true },
  { title: "Services", url: "/services", icon: ClipboardCheck, requiresAdmin: true },

];

const managementItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Configuration", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth(); // <- obtenemos el usuario
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent ${
      isActive ? "bg-primary text-primary-foreground" : "text-foreground"
    }`;

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
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

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                if (item.requiresAdmin && user?.group !== "Admins") return null; // <- solo admin
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

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
