import React from 'react'
import { Link } from 'react-router-dom'
import UserAvatar from './UserAvatar'

export default function Sidebar() {
  return (
    <div className='h-screen bg-blue-300 p-10 w-80'>
        <UserAvatar/>
        <hr className='my-10'/>
        <nav >
          <ul className='flex flex-col gap-4 text-xl'>
            <li><Link to="/admin/service-center" className=''>고객센터</Link></li>
            <li><Link to="/admin/user-management">회원 관리</Link></li>
          </ul>
        </nav>
        
    </div>
  )
}
