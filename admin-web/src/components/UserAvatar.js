import React from 'react'
import { useAuth } from '../api/authContext'

export default function UserAvatar() {
  const {user, logout} = useAuth();
  return (
    <div className='flex justify-between items-center'>
      <p className='text-xl font-bold'>nickname</p>
      <button className='btn-primary' onClick={logout}>로그아웃</button>
    </div>
  )
}
