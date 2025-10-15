
import { useState, useEffect } from 'react'

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  return { token, setToken, user, setUser }
}
