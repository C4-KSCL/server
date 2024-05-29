import React from 'react'

export default function UserInput({type,placeholder,onChange,value,name}) {
  return (
    <input
    className='text-field'
    type={type}
    placeholder={placeholder}
    onChange={onChange}
    value={value}
    name={name}
    />
  )
}
