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
	const { updateUserInfo, updateAccessToken} =
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
		const response=await axios.post("/auth/login", {
			email: writtenUserInfo.email,
			password: writtenUserInfo.password,
		});
		return response
	};

	// 로그인 처리 : 토큰 저장, 유저 정보 저장
	const useLogin = useMutation({
		mutationFn: loginProcess,
		// 200번대 응답
		onSuccess: (response) => {
			// console.log("data", response.data);
			if (response.data.user.manager === 1) {
				// refreshToken은 cookie에 저장,
				document.cookie =
					"refreshToken=yourRefreshToken; Secure; HttpOnly";
				updateAccessToken(response.data.accessToken);
				// console.log("토큰 업데이트", response.data.accessToken);
				updateUserInfo(response.data.user);
				// console.log("유저정보 업데이트", response.data.user);
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

	const handleSubmit = (e) => {
		e.preventDefault();
		useLogin.mutate();
	};

	return ( 
		<div className="flex justify-center items-center h-screen w-screen">
			<div className="flex flex-col justify-center items-start gap-4 ">
				<img className='logo' src="https://matchingimage.s3.ap-northeast-2.amazonaws.com/logo2.png" alt="Logo" />
				<div className="flex flex-col shadow-lg p-10">
					<p className="text-3xl font-bold py-2">관리자 로그인</p>
					<form className=" w-64" onSubmit={handleSubmit}>
						<div id="id-div" className="pb-4">
							<p htmlFor="email" className="my-2">
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
							<p htmlFor="password" className="my-2">
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
						<button type="submit" className="btn-blue mt-4 w-full" >
						로그인
					</button>
					</form>
				</div>
			</div>
		</div>
	);
}
