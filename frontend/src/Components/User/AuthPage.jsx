import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import { authenticate } from "../../actions/userActions";
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
        setMessage(
          error.message === "Failed to fetch"
            ? "Could not reach the store server. Please make sure the backend is running."
            : error.message
        );
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
      setMessage("Account created successfully. Please log in to continue.");
    }
  }, [location.state]);

  const fieldError = (name) =>
    formik.touched[name] && formik.errors[name] ? (
      <span className="field-error" role="alert">{formik.errors[name]}</span>
    ) : null;

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

          {message && <p className="form-message" role="alert">{message}</p>}

          <button className="auth-submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
          </button>
        </form>

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
