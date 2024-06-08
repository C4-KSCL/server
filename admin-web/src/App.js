import React from "react";
import { Outlet, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./api/authContext";
import ServiceCenterPage from "./pages/ServiceCenterPage";
import "./App.css";
import Nav from "./components/Nav";
import UserMangementPage from "./pages/UserManagementPage";
import ServiceCenterDetailPage from "./pages/ServiceCenterDetailPage";

// QueryClient 생성
const queryClient = new QueryClient();

const Layout = () => {
	return (
		<div>
			<Nav />
			<Outlet/>
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
								path="service-center/:postNumber"
								element={<ServiceCenterDetailPage />}
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
