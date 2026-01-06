import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar,
  Users,
  PlusCircle,
  Home,
  XCircle,
  ClipboardCheck,
  Tablet,
  Bell,
  CalendarCheck,
  User2,
  Box,
  Layers
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
      {
        title: "Appointments", url: "/calendar?view=agenda", icon: CalendarCheck, requiresAdmin: false},
      { title: "Create Appointment", url: "/appointments/new", icon: PlusCircle, requiresAdmin:true },

    ]
  },
  {
    label: "Management",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Staff members", url: "/staff", icon: User2, requiresAdmin: true },
      { title: "Services", url: "/services", icon: Layers, requiresAdmin: true },
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
    <Sidebar collapsible="icon" className="bg-gray-900 ">
      {/* HEADER */}
<div className="flex h-14 items-center border-b border-gray-700 px-4">
  {!isCollapsed && (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <Calendar className="h-4 w-4 text-white" />
      </div>
      <span className="font-semibold text-white">AppointmentPro</span>
    </div>
  )}
</div>


      {/* CONTENT */}
      <SidebarContent className="overflow-x-hidden">
        {sidebarSections.map((section) => {
        // Filtrar items visibles según permisos
        const visibleItems = section.items.filter(
          (item) => !item.requiresAdmin || user?.group === "Admins"
        );

        // Si no hay items visibles → no renderizar la sección
        if (visibleItems.length === 0) return null;

        return (
          <SidebarGroup key={section.label}>
            {!isCollapsed && (
              <SidebarGroupLabel  className="text-gray-300">{section.label}</SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => (
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
        );
      })}

      </SidebarContent>
    </Sidebar>
  );
}
