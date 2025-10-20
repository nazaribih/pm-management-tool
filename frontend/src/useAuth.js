
import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

export function useAuth() {
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  const loadUser = useCallback(async (tok = token) => {
    if (!tok) {
      setUser(null)
      return null
    }
    setLoadingUser(true)
    try {
      const profile = await api('/auth/me', { token: tok })
      setUser(profile)
      setAuthError(null)
      return profile
    } catch (err) {
      setAuthError('Session expired, please sign in again.')
      setTokenState(null)
      throw err
    } finally {
      setLoadingUser(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadUser(token).catch(() => {})
    }
  }, [token, loadUser])

  return {
    token,
    setToken: setTokenState,
    user,
    setUser,
    loadingUser,
    authError,
    refreshUser: loadUser
  }
}
