import React from "react";
import { Outlet, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./api/authContext";
import ServiceCenterPage from "./pages/ServiceCenterPage";
import "./App.css";
import Sidebar from "./components/Sidebar";
import UserMangementPage from "./pages/UserManagementPage";

// QueryClient 생성
const queryClient = new QueryClient();

const Layout = () => {
	return (
		<div>
			<Sidebar />

			<Outlet />
		</div>
	);
};

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<div className="app">
					<Routes>
						<Route path="/admin" element={<LoginPage />} />
						<Route path="/admin/*" element={<Layout />}>
							<Route
								path="service-center"
								element={<ServiceCenterPage />}
							/>
							<Route
								path="user-management"
								element={<UserMangementPage />}
							/>
						</Route>
					</Routes>
				</div>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
