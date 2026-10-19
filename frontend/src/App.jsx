import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AUTH_SUCCESS } from "./actions/userActions";
import ProtectedRoute from "./Components/Route/ProtectedRoute";
import Home from "./Components/Home";
import AuthPage from "./Components/User/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import NewProduct from "./pages/NewProduct";
import EditProduct from "./pages/EditProduct";
import UsersList from "./pages/UsersList";
import "./App.css";
import Cart from "./Components/Cart/Cart";
import Checkout from "./Components/Cart/Checkout";
import OrdersList from "./pages/OrdersList";

function StoreApp() {
  const auth = useSelector((state) => state.user);
  const user = auth.user;
  const dispatch = useDispatch();
  const saveUser = (authenticatedUser) => {
    dispatch({ type: AUTH_SUCCESS, payload: authenticatedUser });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/register" replace />
          ) : user.role === "admin" ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Home user={user} />
          )
        }
      />
      <Route
        path="/login"
        element={<AuthPage mode="login" onAuth={saveUser} />}
      />
      <Route
        path="/register"
        element={<AuthPage mode="register" onAuth={saveUser} />}
      />
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<OrdersList />} />
        <Route path="/admin/product/new" element={<NewProduct />} />
        <Route path="/admin/users" element={<UsersList />} />
        <Route
          path="/admin/product/:id/edit"
          element={<EditProduct />}
        />
      </Route>
      <Route
        path="/cart"
        element={
          user ? (
            user.role === "admin" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Cart />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/checkout"
        element={
          user && user.role !== "admin" ? (
            <Checkout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<OrdersList />} />
        <Route path="/admin/product/new" element={<NewProduct />} />
        <Route path="/admin/users" element={<UsersList />} />
        <Route
          path="/admin/product/:id/edit"
          element={<EditProduct />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

  );
}



export default function App() {
  return (
    <BrowserRouter>
      <StoreApp />
    </BrowserRouter>
  );
}

