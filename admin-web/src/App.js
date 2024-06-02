import React from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from './api/authContext';
import ServiceCenterPage from "./pages/ServiceCenterPage";
import "./App.css";
import HomePage from "./pages/HomePage";

// QueryClient 생성
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/admin" element={<LoginPage />} />
        </Routes>
      </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
