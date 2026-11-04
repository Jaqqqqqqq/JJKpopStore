import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import { authenticate, authenticateGoogle } from "../../actions/userActions";
import { signInWithGoogle } from "../../firebase";
import { showNotification } from "../../utils/notifications";
import axios from "axios";
import { API } from "../../api";
import {
  loginValidationSchema,
  registerValidationSchema,
} from "../../schemas/formSchemas";

const initialValues = {
  firstName: "",
  lastName: "",
  address: "",
  phoneNumber: "",
  email: "",
  password: "",
};

export default function AuthPage({ mode, onAuth }) {
  const isRegister = mode === "register";
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const previousMode = useRef(isRegister);

  const formik = useFormik({
    initialValues,
    validationSchema: isRegister
      ? registerValidationSchema
      : loginValidationSchema,
    onSubmit: async (values) => {
      setMessage("");
      try {
        const details = {
          ...values,
          name: `${values.firstName} ${values.lastName}`.trim(),
        };
        const authenticatedUser = await dispatch(
          authenticate(isRegister ? "register" : "login", details)
        );

        if (isRegister) {
          navigate("/login", {
            replace: true,
            state: { registered: true },
          });
          return;
        }

        onAuth(authenticatedUser);
        const destination =
          authenticatedUser.role === "admin"
            ? "/dashboard"
            : location.state?.from?.pathname || "/";
        navigate(destination, { replace: true });
      } catch (error) {
        const message = error.message === "Failed to fetch"
            ? "Could not reach the store server. Please make sure the backend is running."
            : error.message;
        setMessage(message);
        showNotification({ title: isRegister ? "Registration failed" : "Login failed", text: message, icon: "error" });
      }
    },
  });

  useEffect(() => {
    if (previousMode.current !== isRegister) {
      formik.resetForm();
      setMessage("");
      previousMode.current = isRegister;
    }
  }, [isRegister]);

  useEffect(() => {
    if (location.state?.registered) {
      formik.resetForm();
      const message = "Account created successfully. Please log in to continue.";
      setMessage(message);
      showNotification({ title: "Account created", text: message });
    }
  }, [location.state]);

  const fieldError = (name) =>
    formik.touched[name] && formik.errors[name] ? (
      <span className="field-error" role="alert">{formik.errors[name]}</span>
    ) : null;

  const handleGoogleLogin = async () => {
    setMessage("");
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const authenticatedUser = await dispatch(authenticateGoogle(idToken));
      onAuth(authenticatedUser);
      const destination = authenticatedUser.role === "admin"
        ? "/dashboard"
        : location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (error) {
      const message = error.message || "Google sign-in failed. Please try again.";
      setMessage(message);
      showNotification({ title: "Google sign-in failed", text: message, icon: "error" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = formik.values.email.trim();
    if (!email) {
      setMessage("Enter your email address first, then choose Forgot password?");
      return;
    }
    setMessage("");
    setResetRequested(false);
    setResetLoading(true);
    try {
      const { data } = await axios.post(`${API}/forgot-password`, { email });
      setMessage(data.message);
      setResetRequested(true);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to send a reset link. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="auth-mark">♡</div>
        <p className="eyebrow centered">WELCOME TO J&amp;J K-POP</p>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">
          {isRegister
            ? "Join our community of K-pop fans."
            : "Log in to continue your collection."}
        </p>

        <form onSubmit={formik.handleSubmit} noValidate>
          {isRegister && (
            <div className="form-row">
              <label>
                First name
                <input
                  {...formik.getFieldProps("firstName")}
                  autoComplete="given-name"
                  placeholder="First name"
                  aria-invalid={Boolean(formik.touched.firstName && formik.errors.firstName)}
                />
                {fieldError("firstName")}
              </label>
              <label>
                Last name
                <input
                  {...formik.getFieldProps("lastName")}
                  autoComplete="family-name"
                  placeholder="Last name"
                  aria-invalid={Boolean(formik.touched.lastName && formik.errors.lastName)}
                />
                {fieldError("lastName")}
              </label>
            </div>
          )}

          {isRegister && (
            <label>
              Address
              <input
                {...formik.getFieldProps("address")}
                autoComplete="street-address"
                placeholder="Street, city, province"
                aria-invalid={Boolean(formik.touched.address && formik.errors.address)}
              />
              {fieldError("address")}
            </label>
          )}

          {isRegister && (
            <label>
              Phone number
              <input
                {...formik.getFieldProps("phoneNumber")}
                type="tel"
                autoComplete="tel"
                placeholder="09XX XXX XXXX"
                aria-invalid={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)}
              />
              {fieldError("phoneNumber")}
            </label>
          )}

          <label>
            Email address
            <input
              {...formik.getFieldProps("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
            />
            {fieldError("email")}
          </label>

          <label>
            Password
            <input
              {...formik.getFieldProps("password")}
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="At least 6 characters"
              aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
            />
            {fieldError("password")}
          </label>

          {!isRegister && (
            <button className="auth-forgot" type="button" onClick={handleForgotPassword} disabled={formik.isSubmitting || resetLoading}>
              {resetLoading ? "Sending reset email..." : "Forgot password?"}
            </button>
          )}

          {message && <p className={`form-message${resetRequested ? " form-message-success" : ""}`} role="status">{message}</p>}

          <button className="auth-submit" disabled={formik.isSubmitting || googleLoading}>
            {formik.isSubmitting
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <button
          className="google-auth-button"
          type="button"
          onClick={handleGoogleLogin}
          disabled={formik.isSubmitting || googleLoading}
        >
          <span className="google-auth-mark" aria-hidden="true">G</span>
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to J&J K-POP?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Log in" : "Sign up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
