import React from 'react'
import UserInput from '../../components/UserInput'

export default function LoginPage() {

    const loginProcess = () =>{
        
    }

  return (
    <div><div className="h-screen flex flex-col justify-center items-center">
    <label htmlFor="user-email" className="text-5xl mb-10">
        SoulMBTI 관리자 페이지입니다.
    </label>
    <div id="id-div">
        <p htmlFor="user-email" className="">
            아이디(이메일)
        </p>
        <UserInput
            type="text"
            placeholder="이메일을 입력하세요."
            name="user-email"
        />
    </div>
    <div id="pw-div">
    <p htmlFor="user-password" className="">
            비밀번호
        </p>
        <UserInput
            type="password"
            placeholder="비밀번호를 입력하세요."
            name="user-password"
        />
    </div>
    <button className="btn-primary">로그인</button>
</div></div>
  )
}
