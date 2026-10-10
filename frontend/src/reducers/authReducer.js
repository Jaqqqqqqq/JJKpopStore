import {
  AUTH_FAILURE,
  AUTH_LOGOUT,
  AUTH_REQUEST,
  AUTH_SUCCESS,
} from "../actions/userActions";
import { getStoredUser } from "../api";

const initialState = {
  user: getStoredUser(),
  loading: false,
  error: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case AUTH_REQUEST:
      return { ...state, loading: true, error: null };
    case AUTH_SUCCESS:
      return { user: action.payload, loading: false, error: null };
    case AUTH_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case AUTH_LOGOUT:
      return { user: null, loading: false, error: null };
    default:
      return state;
  }
}
