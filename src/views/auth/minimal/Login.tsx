import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/common";
import AuthLayout from "@/Layouts/AuthLayout";
import TitleHelmet from "@/components/Common/TitleHelmet";
import { Button, Form } from "react-bootstrap";
import useLogin from "../useAuth/useLogin";
import AuthMinmal from "./AuthMinmal";

const Login = () => {
  const { removeSession } = useAuthContext();
  const { loading, loginWithEmail, loginWithUsername, redirectUrl, isAuthenticated } = useLogin();

  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    removeSession();
  }, [removeSession]);

  const toggleSuperAdmin = () => {
    setShowSuperAdmin((prev) => !prev);
    setEmail("");
    setUsername("");
    setPassword("");
    setEmailError(null);
    setUsernameError(null);
    setPasswordError(null);
  };

  const validateEmail = (value: string) => {
    if (!value) { setEmailError("Email is required"); return false; }
    setEmailError(null); return true;
  };

  const validateUsername = (value: string) => {
    if (!value) { setUsernameError("Username is required"); return false; }
    setUsernameError(null); return true;
  };

  const validatePassword = (value: string) => {
    if (!value) { setPasswordError("Password is required"); return false; }
    setPasswordError(null); return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (showSuperAdmin) {
      const validEmail = validateEmail(email);
      const validPass = validatePassword(password);
      if (validEmail && validPass) loginWithEmail(e, { email, password });
    } else {
      const validUser = validateUsername(username);
      const validPass = validatePassword(password);
      if (validUser && validPass) loginWithUsername(e, { username, password });
    }
  };

  return (
    <>
      <TitleHelmet title={showSuperAdmin ? "SuperAdmin Login" : "Admin Login"} />

      <AuthLayout>
        {/* Pass toggleSuperAdmin to AuthMinmal so logo click triggers it */}
        <AuthMinmal onLogoClick={toggleSuperAdmin}>
          {isAuthenticated && <Navigate to={redirectUrl} replace />}

          <div className="text-center mb-4">
            <h3 className="fw-bold text-danger">
              {showSuperAdmin ? "SuperAdmin Login" : "Admin Login"}
            </h3>
            <p className="text-muted">
              {showSuperAdmin
                ? "Login with superadmin@miracle.com / superadmin123"
                : "Enter your credentials to access admin panel"}
            </p>
          </div>

          <Form onSubmit={handleSubmit}>

            {/* Email (SuperAdmin) or Username (Admin) */}
            {showSuperAdmin ? (
              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="superadmin@miracle.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                  isInvalid={!!emailError}
                />
                <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); validateUsername(e.target.value); }}
                  isInvalid={!!usernameError}
                />
                <Form.Control.Feedback type="invalid">{usernameError}</Form.Control.Feedback>
              </Form.Group>
            )}

            {/* Password */}
            <Form.Group className="mb-3 position-relative">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                isInvalid={!!passwordError}
              />
              <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback>
              <span
                className="position-absolute top-50 translate-middle-y"
                style={{ right: "15px", cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fi ${showPassword ? "fi-rr-eye-crossed" : "fi-rr-eye"}`}></i>
              </span>
            </Form.Group>

            {/* Login Button */}
            <div className="d-grid mt-4">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                style={{ backgroundColor: "#dc3545", borderColor: "#dc3545" }}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>

          </Form>
        </AuthMinmal>
      </AuthLayout>
    </>
  );
};

export default Login;