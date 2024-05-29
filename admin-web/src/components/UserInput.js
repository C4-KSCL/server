import React from 'react'

export default function UserInput({type,placeholder,onChange}) {
  return (
    <input
    className='text-field'
    type={type}
    placeholder={placeholder}
    onChange={onChange}
    />
  )
}
