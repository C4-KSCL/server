import React, { useState } from "react";
import UserInput from "../../components/UserInput";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../api/authContext";

export default function LoginPage() {
	const [writtenUserInfo, setWrittenUserInfo] = useState({
		email: "",
		password: "",
	});
	const { updateUserInfo, updateAccessToken, accessToken, userInfo } =
		useAuth();
	const navigate = useNavigate();

	// email, password의 input칸 변화시 실행
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setWrittenUserInfo((userInfo) => ({
			...userInfo,
			[name]: value,
		}));
	};

	// 로그인 과정
	const loginProcess = async () => {
		await axios.post("/auth/login", {
			email: writtenUserInfo.email,
			password: writtenUserInfo.password,
		});
	};

	// 로그인 처리 : 토큰 저장, 유저 정보 저장
	const useLogin = () =>
		useMutation(loginProcess, {
			// 200번대 응답
			onSuccess: (data) => {
				if (data.user.manager === 1) {
					console.log("data", data);
					// refreshToken은 cookie에 저장,
					document.cookie =
						"refreshToken=yourRefreshToken; Secure; HttpOnly";
					updateAccessToken(data.accessToken);
					console.log("토큰 업데이트", accessToken);
					updateUserInfo(data.user);
					console.log("유저정보 업데이트", userInfo);
					navigate("/admin/service-center");
				} else {
					alert("관리자가 아닙니다");
				}
			},
			// 400, 500번대 응답
			onError: (error) => {
				console.error("Login failed", error);
			},
		});
	return (
		<div>
			<div className="h-screen flex flex-col justify-center items-center">
				<p className="text-5xl mb-10">SoulMBTI 관리자 페이지입니다.</p>
				<form>
					<div id="id-div">
						<p htmlFor="email" className="">
							아이디(이메일)
						</p>
						<UserInput
							type="text"
							placeholder="이메일을 입력하세요."
							name="email"
							value={writtenUserInfo.email}
							onChange={handleInputChange}
						/>
					</div>
					<div id="pw-div">
						<p htmlFor="password" className="">
							비밀번호
						</p>
						<UserInput
							type="password"
							placeholder="비밀번호를 입력하세요."
							name="password"
							value={writtenUserInfo.password}
							onChange={handleInputChange}
						/>
					</div>
				</form>

				<button className="btn-primary" onClick={useLogin}>
					로그인
				</button>
			</div>
		</div>
	);
}
