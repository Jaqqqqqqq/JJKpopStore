
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../App.css";
import CustomModal from "../Components/Common/CustomModal";

const API =
  import.meta.env.VITE_API || "http://localhost:5000/api/v1";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Custom popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [popupConfirmText, setPopupConfirmText] = useState("OK");
  const [popupShowCancel, setPopupShowCancel] = useState(false);
  const [popupAction, setPopupAction] = useState(null);

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const currentUserId = currentUser?._id || currentUser?.id;

  // Get all registered users
  const getUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(`${API}/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setUsers(data.users || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  // Show custom popup
  const showPopup = ({
    title,
    message,
    type = "info",
    confirmText = "OK",
    showCancel = false,
    onConfirm = null,
  }) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupConfirmText(confirmText);
    setPopupShowCancel(showCancel);
    setPopupAction(() => onConfirm);
    setPopupOpen(true);
  };

  // Close popup without performing the action
  const closePopup = () => {
    setPopupOpen(false);
    setPopupAction(null);
  };

  // Run the action only after confirmation
  const handlePopupConfirm = () => {
    const action = popupAction;

    closePopup();

    if (action) {
      action();
    }
  };

  // Activate or deactivate a user
  const updateUserStatus = (user) => {
    const newStatus = user.isActive === false;
    const action = newStatus ? "activate" : "deactivate";
    const displayName = user.name || user.email;

    showPopup({
      title: newStatus
        ? "Confirm Account Activation"
        : "Confirm Account Deactivation",
      message: `Are you sure you want to ${action} the account for ${displayName}?`,
      type: "warning",
      confirmText: newStatus
        ? "Activate Account"
        : "Deactivate Account",
      showCancel: true,

      onConfirm: async () => {
        try {
          const { data } = await axios.put(
            `${API}/admin/user/${user._id}/status`,
            { isActive: newStatus },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          setUsers((currentUsers) =>
            currentUsers.map((item) =>
              item._id === user._id
                ? {
                    ...item,
                    isActive: data.user.isActive,
                  }
                : item
            )
          );

          showPopup({
            title: "Account Status Updated!",
            message:
              data.message ||
              `The account has been ${
                newStatus ? "activated" : "deactivated"
              } successfully.`,
            type: "success",
          });
        } catch (error) {
          showPopup({
            title: "Update Failed",
            message:
              error.response?.data?.message ||
              "Failed to update account status.",
            type: "error",
          });
        }
      },
    });
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&J K-POP</h2>
        <p>Admin Panel</p>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/users">Users</Link>
        </nav>

        <Link to="/" className="admin-logout">
          Back to Store
        </Link>
      </aside>

      <main className="admin-main">
        <div className="admin-products">
          <h1>Users Management</h1>
          <p>View and manage registered customer accounts.</p>

          {loading && <p>Loading users...</p>}

          {error && (
            <div>
              <p>{error}</p>
              <button type="button" onClick={getUsers}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div
              style={{
                overflowX: "auto",
                marginTop: "24px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "white",
                }}
              >
                <thead>
                  <tr>
                    <th style={cellStyle}>Name</th>
                    <th style={cellStyle}>Email</th>
                    <th style={cellStyle}>Role</th>
                    <th style={cellStyle}>Status</th>
                    <th style={cellStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const isCurrentUser =
                      String(user._id) === String(currentUserId);

                    const isActive = user.isActive !== false;

                    return (
                      <tr key={user._id}>
                        <td style={cellStyle}>
                          {user.name ||
                            `${user.firstName || ""} ${
                              user.lastName || ""
                            }`.trim() ||
                            "Unnamed"}
                        </td>

                        <td style={cellStyle}>{user.email}</td>
                        <td style={cellStyle}>{user.role}</td>

                        <td style={cellStyle}>
                          <span
                            style={{
                              color: isActive ? "green" : "crimson",
                              fontWeight: "bold",
                            }}
                          >
                            {isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>

                        <td style={cellStyle}>
                          {isCurrentUser ? (
                            <button type="button" disabled>
                              Your Account
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateUserStatus(user)}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={cellStyle}>
                        No registered users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <CustomModal
        isOpen={popupOpen}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        confirmText={popupConfirmText}
        showCancel={popupShowCancel}
        onConfirm={handlePopupConfirm}
        onCancel={closePopup}
      />
    </div>
  );
};

const cellStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #eadde3",
};

export default UsersList;
