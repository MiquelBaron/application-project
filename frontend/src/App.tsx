// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Settings from "./pages/Settings";
import Clients from "./pages/Customers";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Staffs from "./pages/Staffs"
import CalendarPage from "./pages/Calendar";
import  ProtectedRoute  from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes with MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CalendarPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
                            <MainLayout>

              <div className="p-6 text-center">Appointments view coming soon!</div>
              </MainLayout>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Clients />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <MainLayout>
              <div className="p-6 text-center"><Staffs></Staffs></div>
              </MainLayout>

            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
              <div className="p-6 text-center">Settings view coming soon!</div>
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Example public pages */}
          <Route
            path="/calendar"
            element={
              <MainLayout>
              <div className="p-6 text-center">Calendar view coming soon!</div>
              </MainLayout>

            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
              <div className="p-6 text-center">Analytics dashboard coming soon!</div>
              </MainLayout>

            }
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
