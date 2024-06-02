import React from 'react'
import { Link } from 'react-router-dom'
import UserAvatar from './UserAvatar'

export default function Sidebar() {
  return (
    <div className=''>
        <UserAvatar/>
        <nav className='flex flex-col'>
            <Link to="/admin/service-center">고객센터</Link>
            <Link to="/admin/user-management">회원 관리</Link>
        </nav>
        
    </div>
  )
}
