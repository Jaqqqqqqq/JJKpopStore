import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../../api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const { data } = await axios.post(`${API}/reset-password`, { token, password });
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
        <h1>Choose a new password</h1>
        <p className="auth-sub">Set a new password for your account.</p>
        <form onSubmit={submit}>
          <label>
            New password
            <input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" />
          </label>
          <label>
            Confirm new password
            <input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your new password again" />
          </label>
          {message && <p className={`form-message${success ? " form-message-success" : ""}`} role="status">{message}</p>}
          <button className="auth-submit" disabled={loading || success}>{loading ? "Changing password..." : success ? "Password changed" : "Change password"}</button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
      </div>
    </main>
  );
}
