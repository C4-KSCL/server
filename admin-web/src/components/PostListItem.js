import React from "react";

export default function PostListItem({
	title,
	timeStamp,
	email,
	isAnswered,
	postCategory,
	onClick,
}) {
	const renderAnswerStatus = () => {
		return isAnswered === 1 ? (
			<span className="text-blue-500">답변 완료</span>
		) : (
			<span className="text-red-500">답변 대기</span>
		);
	};

	return (
		<div className="flex flex-col">
			<div className="flex items-center gap-2 p-1 mb-1 w-full  ">
				
				<p
					className="flex-grow-3 basis-3/5 text-2xl cursor-pointer ml-2"
					onClick={onClick}
				>
					<span className="text-lg">{renderAnswerStatus()} </span><span className=" hover:underline">{`[${postCategory}]`} {title}</span>
				</p>
				<p className="flex flex-grow-1 basis-1/5 justify-center">{email}</p>
				<p className="flex flex-grow-1 basis-1/5 justify-center">{timeStamp}</p>
			</div>
			<hr className="my-2  border-gray-200 w-full" />
		</div>
	);
}
