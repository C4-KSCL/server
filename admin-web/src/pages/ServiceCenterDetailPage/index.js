import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/authContext";
import axios from "../../api/axios";
import { useMutation } from "@tanstack/react-query";
import PostDetail from "../../components/PostDetail";

export default function ServiceCenterDetailPage() {
	const { accessToken } = useAuth();
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
				postNumber: Number(post.postData.postNumber),
			},
			{
				headers: {
					accessToken: accessToken,
				},
			}
		);
		// console.log(response);
		return response;
	};

	const useAnswerServiceCenterPost = useMutation({
		mutationFn: answerServiceCenterPost,
		onSuccess: () => {
			navigate("/admin/service-center");
		},
		onError: (error) => {
			console.error("post 답변 실패", error);
		},
	});

	return (
		<PostDetail
			post={post}
			inputTitleRef={inputTitleRef}
			inputContentRef={inputContentRef}
			useAnswerServiceCenterPost={useAnswerServiceCenterPost}
		/>
	);
}
