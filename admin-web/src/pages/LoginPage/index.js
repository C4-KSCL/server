import React, {  useState } from "react";
import UserInput from "../../components/UserInput";
import axios from "../../api/axios";
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../api/authContext';

export default function LoginPage() {
	const [userInfo, setUserInfo] = useState({
		email: "",
		password: "",
	});
	const { updateUserInfo, updateAccessToken } = useAuth();
	const navigate = useNavigate();

	// email, password의 input칸 변화시 실행
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setUserInfo((userInfo) => ({
			...userInfo,
			[name]: value,
		}));
	};

	// 로그인 과정
	const getUserInfo = async () => {
		await axios
			.post("/auth/login", {
				email: userInfo.email,
				password: userInfo.password,
			})
			.then(function (response) {
				console.log(response);
				if(response.status===200 && response.data.user.manager===1){
					updateUserInfo()
					updateAccessToken()
					navigate('/admin/service-center');
				} else {
					alert("관리자가 아닙니다");
				}
			})
			.catch(function (error) {
				console.log(error);
			});
	};


	// 로그인 처리 : 토큰 저장, 유저 정보 저장
	const useLogin = () =>{
		return useMutation(getUserInfo,{
			// 200번대 응답
			onSuccess : (data) =>{
				// refreshToken은 cookie에 저장, 
				document.cookie = "refreshToken=yourRefreshToken; Secure; HttpOnly";
				
				console.log(data);

			},
			// 400, 500번대 응답
			onError: (error) => {
				console.error('Login failed', error);
			  },
		})
	}

	return (
		<div>
			<div
				className="h-screen flex flex-col justify-center items-center"
				onChange={handleInputChange}
			>
				<p className="text-5xl mb-10">
					SoulMBTI 관리자 페이지입니다.
				</p>
				<div id="id-div">
					<p htmlFor="email" className="">
						아이디(이메일)
					</p>
					<UserInput
						type="text"
						placeholder="이메일을 입력하세요."
						name="email"
						value={userInfo.email}
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
						value={userInfo.password}
					/>
				</div>
				<button className="btn-primary" onClick={useLogin}>
					로그인
				</button>
			</div>
		</div>
	);
}
