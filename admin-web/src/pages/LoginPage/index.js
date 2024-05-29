import React, {  useState } from "react";
import UserInput from "../../components/UserInput";
import axios from "../../api/axios";
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
	const [userInfo, setUserInfo] = useState({
		email: "",
		password: "",
	});

	const navigate = useNavigate();

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setUserInfo((userInfo) => ({
			...userInfo,
			[name]: value,
		}));
	};

	const loginProcess = async () => {
        console.log(axios.baseUrl);
        console.log(userInfo.email);
        console.log(userInfo.password);
		await axios
			.post("/auth/login", {
				email: userInfo.email,
				password: userInfo.password,
			})
			.then(function (response) {
				console.log(response);
				if(response.status===200 && response.data.user.manager===1){
					navigate('/admin');
				}
			})
			.catch(function (error) {
				console.log(error);
			});
	};

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
				<button className="btn-primary" onClick={loginProcess}>
					로그인
				</button>
			</div>
		</div>
	);
}
