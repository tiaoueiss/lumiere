import { createContext, useContext, useState, useCallback } from 'react'
import * as api from '../api'
import { removeUserJson } from '../utils/userStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Lazy initializer — localStorage is synchronous so no effect needed
  const [user, setUser] = useState(() => {
    const token  = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try { return JSON.parse(stored) } catch { /* ignore bad JSON */ }
    }
    return null
  })
  const [loading] = useState(false)

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const requestSignupOtp = useCallback(async (name, email, password) => {
    const res = await api.requestSignupOtp(name, email, password)
    return res.data
  }, [])

  const verifySignupOtp = useCallback(async (email, otp) => {
    const res = await api.verifySignupOtp(email, otp)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const deleteAccount = useCallback(async (password) => {
    const userToDelete = user
    await api.deleteAccount(password)

    if (userToDelete) {
      removeUserJson('wishlist', userToDelete)
      removeUserJson('lumiere_style_results', userToDelete)
    }

    localStorage.removeItem('wishlist')
    localStorage.removeItem('lumiere_style_results')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, requestSignupOtp, verifySignupOtp, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
