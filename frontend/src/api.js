export const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}
