import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; //
import { userInfo } from "os";
interface MainLayoutProps {
  children: React.ReactNode;
}
import { NotificationCenter } from "@/components/NotificationCenter";

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth(); 

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between bg-gray-900 border-b bg-card px-4 shadow-soft">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white" />
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-white">
                  Appointment Management - {user?.group || null}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout(); 
                      navigate("/login",{ replace: true }); 
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gradient-card p-6">
            {children}
          </main>
           <footer className="bg-gray-900 text-gray-200 text-sm py-3 px-4 shadow-inner text-center">
  Developed by <span className="font-semibold">Miquel Barón</span> &copy; {new Date().getFullYear()}
</footer>

        </div>
        
      </div>

     
    </SidebarProvider>
  );
}