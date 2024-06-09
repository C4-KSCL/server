import React, { useEffect } from "react";
import axios from "../../api/axios";
import PostListItem from "../../components/PostListItem";
import { useAuth } from "../../api/authContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function ServiceCenterPage() {
	const { accessToken } = useAuth();
	const navigate = useNavigate();

	const getServieCenterposts = async () => {
		const response = await axios.get("customerService/readManager", {
			headers: {
				accessToken: accessToken,
			},
		});
		console.log(response);
		return response.data;
	};

	const handleClickPost = (post) => {
		console.log(post);
		navigate(`/admin/service-center/${post.postNumber}`, {
			state: { post },
		});
	};

	// console.log(accessToken);
	const { status, data, error } = useQuery({
		queryKey: ["service-center-posts"],
		queryFn: getServieCenterposts,
	});

	if (status === "pending") {
		return <span>Loading...</span>;
	}

	if (status === "error") {
		return <span>Error: {error.message}{error.name}</span>;
	}

	return (
		<div className="p-8">
			<p className="mb-6 text-4xl">문의 내역</p>
			<ul className="flex gap-4 mb-4 text-xl">
				<li className="cursor-pointer">전체</li>
				<li className="cursor-pointer">신고</li>
				<li className="cursor-pointer">불편사항</li>
				<li className="cursor-pointer">건의사항</li>
			</ul>
			<hr className="border-black w-full"></hr>
			<div className="flex pt-2 w-full font-bold">
				<p className="flex flex-grow-3 basis-3/5 justify-center">문의 제목</p>
				<p className="flex flex-grow-1 basis-1/5 justify-center">사용자 이메일</p>
				<p className="flex flex-grow-1 basis-1/5 justify-center ">문의 시간</p>
			</div>
			<hr className="my-2"></hr>
			<ul className="flex flex-col gap-2">
				{data.posts.map((post) => (
					<PostListItem
						key={post.postNumber}
						title={post.postTitle}
						email={post.email}
						isAnswered={post.isAnswered}
						postNumber={post.postNumber}
						timeStamp={post.createdTime}
						content={post.postContent}
						postCategory={post.postCategory}
						onClick={() => handleClickPost(post)}
					/>
				))}
			</ul>
		</div>
	);
}
