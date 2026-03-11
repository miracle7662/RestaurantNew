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
  const { loading, loginWithUsername, redirectUrl, isAuthenticated } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    removeSession();
  }, [removeSession]);

  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError("Username is required");
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validUser = validateUsername(username);
    const validPass = validatePassword(password);

    if (validUser && validPass) {
      loginWithUsername(e, { username, password });
    }
  };

  return (
    <>
      <TitleHelmet title="Admin Login" />

      <AuthLayout>
        <AuthMinmal>
          {isAuthenticated && <Navigate to={redirectUrl} replace />}

          <div className="text-center mb-4">
            <h3 className="fw-bold text-danger">Admin Login</h3>
            <p className="text-muted">Enter your credentials to access admin panel</p>
          </div>

          <Form onSubmit={handleSubmit}>

            {/* Username */}
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                isInvalid={!!usernameError}
              />
              <Form.Control.Feedback type="invalid">
                {usernameError}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-3 position-relative">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                isInvalid={!!passwordError}
              />

              <Form.Control.Feedback type="invalid">
                {passwordError}
              </Form.Control.Feedback>

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
                style={{
                  backgroundColor: "#dc3545",
                  borderColor: "#dc3545",
                }}
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