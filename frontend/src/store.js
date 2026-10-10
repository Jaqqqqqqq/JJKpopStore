import { applyMiddleware, legacy_createStore as createStore } from "redux";
import { thunk } from "redux-thunk";
import authReducer from "./reducers/authReducer";

const store = createStore(authReducer, applyMiddleware(thunk));

export default store;
