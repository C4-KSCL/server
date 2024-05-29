import "./App.css";
import {Routes, Route} from "react-router-dom"
import LoginPage from "./pages/LoginPage";
import ServiceCenterPage from "./pages/ServiceCenterPage";

function App() {
	return (
		<div className="app">
			<Routes>
				<Route index  element={<LoginPage/>}/>
				<Route path="/admin" element={<ServiceCenterPage/>}/>
			</Routes>
		</div>
	);
}

export default App;
