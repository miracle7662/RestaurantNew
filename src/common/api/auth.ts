import HttpClient from '@/common/helpers/httpClient'

// Login user with email (for SuperAdmin)
export const loginUserWithEmail = async (email: string, password: string) => {
  try {
    const response = await HttpClient.post<any>('/auth/login', {
      email,
      password
    })
    return response
  } catch (error: any) {
    throw new Error(error.message || 'Login failed')
  }
}

// Login user with username (for Hotel Admin)
export const loginUserWithUsername = async (username: string, password: string) => {
  try {
    const response = await HttpClient.post<any>('/auth/login', {
      username,
      password
    })
    return response
  } catch (error: any) {
    throw new Error(error.message || 'Login failed')
  }
}

// Login user (backward compatibility)
export const loginUser = async (email: string, password: string) => {
  return loginUserWithEmail(email, password)
}

// Get current user info
export const getCurrentUser = async (token: string) => {
  try {
    const response = await HttpClient.get<any>('/auth/me')
    return response
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get user info')
  }
}

// Logout user (client-side only)
export const logoutUser = () => {
  localStorage.removeItem('WINDOW_AUTH_SESSION')
}
