import React from "react";
import axios from "../../api/axios";
import Post from "../../components/Post";

export default function ServiceCenterPage() {
	// const getServieCenterposts = async () => {
	// 	await axios
	// 		.get("customerService/readManager")
	// 		.then(function (response) {
	// 			console.log(response);
	// 		});
	// };

	return (
		<div className="p-4">
			<p className="mb-6 text-4xl">고객센터</p>
			<Post />
		</div>
	);
}
