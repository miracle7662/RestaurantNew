import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthContext } from '@/common'
import AuthLayout from '@/Layouts/AuthLayout'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { Button, Form, Stack } from 'react-bootstrap'
import useLogin from '../useAuth/useLogin'
import AuthMinmal from './AuthMinmal'

const Login = () => {
  const { removeSession } = useAuthContext()
  const { loading, loginWithEmail, loginWithUsername, redirectUrl, isAuthenticated } = useLogin()
  const [loginType, setLoginType] = useState<'superadmin' | 'hoteladmin'>('superadmin')
  const [email, setEmail] = useState<string>('superadmin@miracle.com')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('superadmin123')
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    removeSession()
  }, [removeSession])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const validateEmail = (input: string) => {
    if (!input) {
      setEmailError('Email is required')
      return false
    } else {
      setEmailError(null)
      return true
    }
  }

  const validateUsername = (input: string) => {
    if (!input) {
      setUsernameError('Username is required')
      return false
    } else {
      setUsernameError(null)
      return true
    }
  }

  const validatePassword = (input: string) => {
    if (!input) {
      setPasswordError('Password is required')
      return false
    } else {
      setPasswordError(null)
      return true
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (loginType === 'superadmin') {
      const isEmailValid = validateEmail(email)
      const isPasswordValid = validatePassword(password)

      if (isEmailValid && isPasswordValid) {
        loginWithEmail(e, { email, password })
      }
    } else {
      const isUsernameValid = validateUsername(username)
      const isPasswordValid = validatePassword(password)

      if (isUsernameValid && isPasswordValid) {
        loginWithUsername(e, { username, password })
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Login" />
      <AuthLayout>
        <AuthMinmal>
          {isAuthenticated && <Navigate to={redirectUrl} replace />}
          <div className="mb-12">
            <h4 className="fw-bold mb-3">Login to your account</h4>
            <p className="fs-16 lead">Hey, Enter your details to get login to your account.</p>
          </div>

          {/* Login Type Toggle */}
          <div className="mb-4">
            <div className="btn-group w-100" role="group">
              <input
                type="radio"
                className="btn-check"
                name="loginType"
                id="superadmin"
                checked={loginType === 'superadmin'}
                onChange={() => setLoginType('superadmin')}
              />
              <label className="btn btn-outline-primary" htmlFor="superadmin">
                SuperAdmin Login
              </label>

              <input
                type="radio"
                className="btn-check"
                name="loginType"
                id="hoteladmin"
                checked={loginType === 'hoteladmin'}
                onChange={() => setLoginType('hoteladmin')}
              />
              <label className="btn btn-outline-primary" htmlFor="hoteladmin">
                Hotel Admin Login
              </label>
            </div>
          </div>

          <Form onSubmit={handleSubmit}>
            {loginType === 'superadmin' ? (
              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateEmail(e.target.value)
                  }}
                  isInvalid={!!emailError}
                  required
                />
                <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    validateUsername(e.target.value)
                  }}
                  isInvalid={!!usernameError}
                  required
                />
                <Form.Control.Feedback type="invalid">{usernameError}</Form.Control.Feedback>
              </Form.Group>
            )}
            <Form.Group className="mb-3 position-relative">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validatePassword(e.target.value)
                }}
                isInvalid={!!passwordError}
                required
              />
              <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback>
              <span
                className="btn btn-icon position-absolute translate-middle top-50"
                style={{ right: '-1rem' }}
                onClick={togglePasswordVisibility}
              >
                <i className={`fi ${showPassword ? 'fi-rr-eye-crossed' : 'fi-rr-eye'}`}></i>
              </span>
            </Form.Group>
            <Stack direction="horizontal">
              <Form.Check type="checkbox" id="check-api-checkbox">
                <Form.Check.Input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <Form.Check.Label>Remember me</Form.Check.Label>
              </Form.Check>
              <Link to="/auth/minimal/forgot-password" className="link-primary ms-auto">
                Forgot password?
              </Link>
            </Stack>
            <div className="d-grid gap-2 my-4">
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={loading}
                className="text-white"
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Loading...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
            <div>
              Don't have an account? <Link to="/auth/minimal/register">Create an Account</Link>
            </div>
            <div className="mt-12 mb-6 border-bottom position-relative">
              <span className="small py-1 px-3 text-uppercase text-muted bg-body-tertiary rounded position-absolute translate-middle start-50">
                or
              </span>
            </div>
            <div className="d-grid flex-wrap d-sm-flex gap-2">
              <Button variant="neutral" className="px-3 flex-fill">
                <i className="fi fi-brands-google"></i>
                <span className="ms-2">Login with Google</span>
              </Button>
              <Button variant="neutral" className="px-3 flex-fill">
                <i className="fi fi-brands-facebook"></i>
                <span className="ms-2">Login with Facebook</span>
              </Button>
            </div>
          </Form>
        </AuthMinmal>
      </AuthLayout>
    </>
  )
}

export default Login
