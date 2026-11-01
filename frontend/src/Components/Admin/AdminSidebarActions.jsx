import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../actions/userActions";

export default function AdminSidebarActions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logout());
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-sidebar-actions">
      <button type="button" className="admin-logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
