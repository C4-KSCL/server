import React, { useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/authContext";
import axios from "../../api/axios";
import { useMutation } from "@tanstack/react-query";

export default function ServiceCenterDetailPage() {
	const { accessToken } = useAuth();
	const { postNumber } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const { post } = location.state || {}; // 전달된 state에서 post를 가져옴
	const inputTitleRef = useRef(null);
	const inputContentRef = useRef(null);

	// 고객센터 게시물에 답변
	const answerServiceCenterPost = async () => {
		const responseTitle = inputTitleRef.current.value;
		const responseContent = inputContentRef.current.value;

		const response = await axios.post(
			"customerService/responsePost",
			{
				responseTitle: responseTitle,
				responseContent: responseContent,
				postNumber: Number(postNumber),
			},
			{
				headers: {
					accessToken: accessToken,
				},
			}
		);
		console.log(response);
		return response;
	};

	const useAnswerServiceCenterPost = useMutation({
		mutationFn: answerServiceCenterPost,
		onSuccess: (response) => {
			navigate("/admin/service-center");
		},
		onError: (error) => {
			console.error("Login failed", error);
		},
	});

	return (
		<div className="p-8">
			{post.isAnswered === 1 ? (
				// 답변 완료된 게시물 클릭시 열리는 창
				<div className="flex flex-col">
					<p className="mb-6 text-4xl">문의 내용</p>
					<div className="flex flex-col gap-4 p-4  bg-slate-100 border rounded">
						<p className="text-3xl">{post.postTitle}</p>
						<hr className="border-gray-600" />
						<p className="text-lg">{post.postContent}</p>
					</div>

					<p className="mt-6 mb-6 text-4xl">답변</p>
					<div className="flex flex-col gap-4 p-4  bg-slate-100 border rounded">
						<input
							type="text"
							value={post.responseTitle}
							className="text-3xl bg-slate-100"
						/>
						<hr className="border-gray-600" />
						<textarea
							type="text"
							value={post.responseContent}
							className="text-lg bg-slate-100 h-60"
						/>
					</div>
					<div className="flex justify-end ">
						<button className="btn-blue m-3">답변 수정하기</button>
					</div>
				</div>
			) : (
				// 답변 되지 않은 게시물 클릭시 열리는 창
				<div>
					<p className="mb-6 text-4xl">문의 내용</p>
					<div className="flex flex-col gap-4 p-4 bg-slate-100 border rounded">
						<p className="text-3xl">{post.postTitle}</p>
						<hr className="border-gray-600" />
						<p className="text-xl">{post.postContent}</p>
					</div>
					<p className="mt-6 mb-6 text-4xl">답변</p>
					<div className="flex flex-col gap-4 p-4  bg-slate-100 border rounded">
					<input
						ref={inputTitleRef}
						className="text-field text-3xl p-2"
						type="text"
						placeholder="답변 제목"
					/>
					<hr className="border-gray-600" />
					<textarea
						ref={inputContentRef}
						className="text-field h-60 p-2"
						type="text"
						placeholder="답변 내용"
					/>
					</div>
					<div className="flex justify-end p-4">
					<button
						className="btn-blue"
						onClick={useAnswerServiceCenterPost.mutate}
					>
						답변하기
					</button>
					</div>
					
				</div>
			)}
		</div>
	);
}
