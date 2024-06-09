import React, {  useState } from "react";
import axios from "../../api/axios";
import PostListItem from "../../components/PostListItem";
import { useAuth } from "../../api/authContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function ServiceCenterPage() {
	const { accessToken } = useAuth();
	const navigate = useNavigate();
	const [posts, setPosts] = useState([]);
	const [isShowenPosts, setIsShowenPosts] = useState([]);

	// 고객센터 정보 가져오기
	const getServieCenterposts = async () => {
		setPosts([]);
		const response = await axios.get("customerService/readManager", {
			headers: {
				accessToken: accessToken,
			},
		});
		// console.log("response.data",response.data)

		// 이미지 데이터를 postNumber로 그룹화
		const imagesByPostNumber = response.data.images.reduce((acc, image) => {
			if (!acc[image.postNumber]) {
				acc[image.postNumber] = [];
			}
			acc[image.postNumber].push(image);
			return acc;
		}, {});

		// 포스트 데이터에 이미지를 매칭하여 posts 상태 업데이트
		const posts = response.data.posts.map((post) => ({
			postData: post,
			imageData: imagesByPostNumber[post.postNumber] || [],
		}));

		// 상태 업데이트
		setPosts(posts);
		setIsShowenPosts(posts);
		return response.data;
	};

	// post 클릭했을 때
	const handleClickPost = (post) => {
		// console.log(post);
		navigate(`/admin/service-center/${post.postNumber}`, {
			state: { post },
		});
	};

	// console.log(accessToken);
	const { status, error } = useQuery({
		queryKey: ["service-center-posts"],
		queryFn: getServieCenterposts,
	});

	// 문의내역 카테고리 클릭했을 때
	const handleClickPostCategory = (category) => {
		switch (category) {
			case "전체": {
				setIsShowenPosts(posts);
				break;
			}
			case "신고": {
				const filteredPosts = posts.filter(
					(post) => post.postData.postCategory === "신고"
				);
				setIsShowenPosts(filteredPosts);
				break;
			}
			case "불편사항": {
				const filteredPosts = posts.filter(
					(post) => post.postData.postCategory === "불편사항"
				);
				setIsShowenPosts(filteredPosts);
				break;
			}
			case "건의사항": {
				const filteredPosts = posts.filter(
					(post) => post.postData.postCategory === "건의사항"
				);
				setIsShowenPosts(filteredPosts);
				break;
			}
			default: {
			}
		}
	};

	if (status === "pending") {
		return <span>Loading...</span>;
	}

	if (status === "error") {
		return (
			<span>
				Error: {error.message} {error.name}
			</span>
		);
	}

	return (
		<div className="p-8">
			<p className="mb-6 text-4xl">문의 내역</p>
			<ul
				className="flex gap-4 mb-4 text-xl"
				onClick={(e) => handleClickPostCategory(e.target.innerText)}
			>
				<li className="cursor-pointer">전체</li>
				<li className="cursor-pointer">신고</li>
				<li className="cursor-pointer">불편사항</li>
				<li className="cursor-pointer">건의사항</li>
			</ul>
			<hr className="border-black w-full"></hr>
			<div className="flex pt-2 w-full font-bold">
				<p className="flex flex-grow-3 basis-3/5 justify-center">
					문의 제목
				</p>
				<p className="flex flex-grow-1 basis-1/5 justify-center">
					사용자 이메일
				</p>
				<p className="flex flex-grow-1 basis-1/5 justify-center ">
					문의 시간
				</p>
			</div>
			<hr className="my-2"></hr>
			<ul className="flex flex-col gap-2">
				{isShowenPosts.map((post) => (
					<PostListItem
						key={post.postData.postNumber}
						title={post.postData.postTitle}
						email={post.postData.email}
						isAnswered={post.postData.isAnswered}
						postNumber={post.postData.postNumber}
						timeStamp={post.postData.createdTime}
						content={post.postData.postContent}
						postCategory={post.postData.postCategory}
						imageData={post.imageData}
						onClick={() => handleClickPost(post)}
					/>
				))}
			</ul>
		</div>
	);
}
