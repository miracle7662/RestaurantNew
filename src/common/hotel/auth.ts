import { HttpClient } from '../helpers'

function AuthService() {
  return {
    login: (values: any) => {
      return HttpClient.post('/login', values)
    },
    register: (values: any) => {
      return HttpClient.post('/register', values)
    },
    forgetPassword: (values: any) => {
      return HttpClient.post('/forgot-password', values)
    },
  }
}

export default AuthService()
