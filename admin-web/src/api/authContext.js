import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [accessToken, setAccessToken] = useState(null);
	const [userInfo, setUserInfo] = useState(null);

	const updateAccessToken = (token) => {
		setAccessToken(token);
	};

	const updateUserInfo = (userInfo) => {
		setUserInfo(userInfo);
	};

	const logout = () => {
		setAccessToken(null);
		setUserInfo(null);
		console.log("로그아웃")
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
