import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../../api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [emailVerified, setEmailVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyEmail = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/password/forgot`, { email });
      setEmailVerified(true);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to verify this email address.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.put(`${API}/password/reset`, { email, password, confirmPassword });
      setSuccess(true);
      setMessage(data.message);
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to change password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="auth-mark" aria-hidden="true">♡</div>
        <p className="eyebrow centered">J&amp;J K-POP</p>
        <h1>{emailVerified ? "Choose a new password" : "Forgot password"}</h1>
        <p className="auth-sub">{emailVerified ? `Set a new password for ${email}.` : "Enter your account email to continue."}</p>
        {!emailVerified ? (
          <form onSubmit={verifyEmail}>
            <label>
              Email address
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            {message && <p className="form-message" role="alert">{message}</p>}
            <button className="auth-submit" disabled={loading}>{loading ? "Checking email..." : "Continue"}</button>
          </form>
        ) : (
        <form onSubmit={submit}>
          <label>New password<input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your new password again" /></label>
          {message && <p className={`form-message${success ? " form-message-success" : ""}`} role="status">{message}</p>}
          <button className="auth-submit" disabled={loading || success}>{loading ? "Changing password..." : success ? "Password changed" : "Change password"}</button>
        </form>
        )}
        <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
      </div>
    </main>
  );
}
