import React from "react";

export default function Post() {
	return (
		<div className="flex flex-col gap-2 w-full p-2 rounded border border-gray-400 ">
			<div className="flex justify-between ">
				<p className="text-2xl">제목</p>
        <p>2020-01-01</p>
			</div>

			<p>We've combined the power of the Following feed with the For you feed so there’s one place to discover content on GitHub. There’s improved filtering so you can customize your feed exactly how you like it, and a shiny new visual design. </p>
		</div>
	);
}