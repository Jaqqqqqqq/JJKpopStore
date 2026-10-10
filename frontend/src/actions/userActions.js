import axios from "axios";
import { API } from "../api";

export const AUTH_REQUEST = "AUTH_REQUEST";
export const AUTH_SUCCESS = "AUTH_SUCCESS";
export const AUTH_FAILURE = "AUTH_FAILURE";
export const AUTH_LOGOUT = "AUTH_LOGOUT";

export const authenticate = (kind, credentials) => async (dispatch) => {
  dispatch({ type: AUTH_REQUEST });

  try {
    const path = kind === "register" ? "/register" : "/login";
    const { data } = await axios.post(`${API}${path}`, credentials);
    const user = {
      ...data.user,
      role: String(data.user?.role || "user").toLowerCase(),
    };

    if (data.token) localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: AUTH_SUCCESS, payload: user });
    return user;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.request
        ? "Could not reach the store server. Please make sure the backend is running."
        : error.message || "Authentication failed.");
    dispatch({ type: AUTH_FAILURE, payload: message });
    throw new Error(message, { cause: error });
  }
};

export const logout = () => (dispatch) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  dispatch({ type: AUTH_LOGOUT });
};
