import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import UserAvatar from './UserAvatar'
import { useEffect } from 'react';

export default function Nav() {
  const [isScrollDown,setIsScrollDown]=useState(false);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        setIsScrollDown(true);
      } else {
        setIsScrollDown(false);
      }
    });

    return () => {
      window.removeEventListener("scroll", () => {});
    };
  }, []);
  return (
    <div className={`${isScrollDown ? 'bg-blue-200/50': 'bg-transparent'} flex justify-between gap-2 w-screen   p-3 fixed `}>
        <img className='pl-6' src="https://matchingimage.s3.ap-northeast-2.amazonaws.com/logo2.png" alt="Logo" />
        <nav className='flex items-center'>
          <ul className='flex gap-10 text-xl'>
          <li>
            <NavLink
              to="/admin/service-center"
              className={({ isActive }) => (isActive ? 'text-black text-2xl font-bold' : 'text-black')}
            >
              고객센터
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/user-management"
              className={({ isActive }) => (isActive ? 'text-black text-2xl font-bold' : 'text-black')}
            >
              회원 관리
            </NavLink>
          </li>
          </ul>
        </nav>
        <UserAvatar/>
    </div>
  )
}
