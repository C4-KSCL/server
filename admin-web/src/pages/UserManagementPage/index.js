import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../api/authContext";
import { useMutation } from "@tanstack/react-query";

export default function UserMangementPage() {
	const { accessToken } = useAuth();
	const [searchResults, setSearchResults] = useState([]);
	const [searchString, setSearchString] = useState("");

	const handleChange = (e) => {
		setSearchString(e.target.value);
		searchUser(e.target.value);
	};

	useEffect(() => {}, [searchResults]);

	// 회원 검색
	const searchUser = async (searchString) => {
		if (searchString.length > 0) {
			const response = await axios.get(
				`manage/search?search_string=${searchString}`,
				{
					headers: {
						accessToken: accessToken,
					},
				}
			);
			console.log(response);
			setSearchResults(response.data.user);
		}
	};

	// 회원 정지
	const suspendUser = async (userNumber) => {
		const response = await axios.post(
			"manage/suspend",
			{
				userNumber: userNumber,
			},
			{
				headers: {
					accessToken: accessToken,
				},
			}
		);
		return response.data;
	};

	// 회원 정지 useMutation
	const useSuspendUser = useMutation({
		mutationFn: suspendUser,
		onSuccess: (data) => {
			console.log(data);
		},
		onError: (error) => {
			console.log(error);
		},
	});

	// 회원 정지 해제
	const removeSuspend = async (userNumber) => {
		const response = await axios.post(
			"manage/removeSuspend",
			{
				userNumber: userNumber,
			},
			{
				headers: {
					accessToken: accessToken,
				},
			}
		);
		return response.data;
	};

	// 회원 정지 해제 useMutation
	const useRemoveSuspend = useMutation({
		mutationFn: removeSuspend,
		onSuccess: (data) => {
			console.log(data);
		},
		onError: (error) => {
			console.log(error);
		},
	});

	return (
		<div className="flex flex-col p-8">
			<p className="mb-6 text-4xl">회원 검색</p>

			<input
				type="text"
				className="text-field p-2 w-1/2 mb-4"
				placeholder="유저의 이메일을 입력해주세요"
				value={searchString}
				onChange={handleChange}
			/>
			<p className="mb-6 text-xl">검색 결과 : {searchResults.length}건</p>
			<div className="grid grid-cols-2 gap-8">
				{searchResults.map((user) => (
					<div
						key={user.userNumber}
						className="flex gap-2 border rounded border-blue-200"
					>
						<img
							src={user.userImage}
							alt={`${user.nickname} 사진`}
							className=" w-44 h-52"
						/>
						<div className="flex flex-col justify-evenly px-4 pt-4">
							<p className="font-bold">
								{user.nickname} ({user.email})
							</p>
							<p>회원 생성 날짜 : {user.userCreated}</p>
							<div className="flex gap-3">
								<button className="btn-gray">경고 주기</button>
								<button className="btn-gray">
									문의 내역 보기
								</button>
								{user.suspend === 0 ? (
									<button
										className="btn-red"
										onClick={async () => {
											await useSuspendUser.mutateAsync(
												user.userNumber
											);
											await searchUser(searchString);
										}}
									>
										회원 정지
									</button>
								) : (
									<button
										className="btn-blue"
										onClick={async () => {
											await useRemoveSuspend.mutateAsync(
												user.userNumber
											);
											await searchUser(searchString);
										}}
									>
										정지 해제
									</button>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
