export const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

// Start each app load as a guest. A login remains active while navigating the
// current SPA session, but stale browser credentials must not auto-login users.
localStorage.removeItem("user");
localStorage.removeItem("token");

export function getStoredUser() {
  return null;
}
