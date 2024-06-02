import React from "react";
import axios from "../../api/axios";

export default function ServiceCenterPage() {
  const getServieCenterposts = async () => {
    await axios.get("customerService/readManager").then(function (response) {
      console.log(response);
    })
  }


	return <div>
    고객센터페이지입니다.
    
  </div>;
}
