import React from "react";

export default function PostDetail({
	post,
	inputTitleRef,
	inputContentRef,
	useAnswerServiceCenterPost,
}) {
	return (
		<div className="p-8">
			{post.postData.isAnswered === 1 ? (
				// 답변 완료된 게시물 클릭시 열리는 창
				<div className="flex flex-col">
					<p className="mb-6 text-4xl">문의 내용</p>
					<div className="flex flex-col gap-4 p-4  bg-slate-100 border rounded">
						<p className="text-3xl">{post.postData.postTitle}</p>
						<hr className="border-gray-600" />
						<p>{post.postData.postContent}</p>
						{post.imageData.length !== 0 && (
							<div>
								<p className="my-3 text-xl">
									{"<"}첨부 이미지{">"}
								</p>
								<div className="grid grid-cols-3">
									{post.imageData.map((image) => (
										<img
											src={image.imagePath}
											alt="고객센터 게시물 이미지"
											key={image.imageNumber}
										></img>
									))}
								</div>
							</div>
						)}
					</div>

					<p className="mt-6 mb-6 text-3xl">답변</p>
					<div className="flex flex-col gap-4 p-4  bg-slate-100 border rounded">
						<p className="text-3xl bg-slate-100">
							{post.postData.responseTitle}
						</p>

						<hr className="border-gray-600" />
						<p className="bg-slate-100 whitespace-pre-wrap max-h-full">
							{post.postData.responseContent}
						</p>
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
						<p className="text-3xl">{post.postData.postTitle}</p>
						<hr className="border-gray-600" />
						<p>{post.postData.postContent}</p>
						{post.imageData.length !== 0 && (
							<div>
								<p className="my-3 text-xl">
									{"<"}첨부 이미지{">"}
								</p>
								<div className="grid grid-cols-3">
									{post.imageData.map((image) => (
										<img
											src={image.imagePath}
											alt="고객센터 게시물 이미지"
											key={image.imageNumber}
										></img>
									))}
								</div>
							</div>
						)}
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
							className="text-field h-80 p-2"
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
