import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [accessToken, setAccessToken] = useState(null);
	const [userInfo, setUserInfo] = useState(null);
	const navigate = useNavigate();

	const updateAccessToken = (token) => {
		setAccessToken(token);
	};

	const updateUserInfo = (userInfo) => {
		setUserInfo(userInfo);
	};

	// 로그아웃
	const logout = () => {
		setAccessToken(null);
		setUserInfo(null);
		console.log("로그아웃");
		navigate("/admin");
	};

	return (
		<AuthContext.Provider
			value={{
				accessToken: accessToken,
				userInfo: userInfo,
				updateAccessToken,
				updateUserInfo,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);