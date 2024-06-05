import React from "react";
import { useAuth } from "../api/authContext";

export default function UserAvatar() {
	const { userInfo, logout } = useAuth();
	return (
		<div className="flex gap-5 items-center justify-center">
			<p className="text-xl ">관리자 <span className="font-bold">{userInfo? userInfo.nickname : ""}</span></p>
			<button className="btn-blue" onClick={logout}>
				로그아웃
			</button>
		</div>
	);
}
