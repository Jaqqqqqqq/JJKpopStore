import { Link } from "react-router-dom";
import SalesChart from "./SalesChart";
import "../../App.css";
import AdminSidebarActions from "./AdminSidebarActions";

export default function ChartsPage() {
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&amp;J K-POP</h2>
        <p>Admin Panel</p>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin/charts" aria-current="page">Charts</Link>
          <Link to="/dashboard#admin-products">Products</Link>
          <Link to="/admin/categories">Categories</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/reviews">Reviews</Link>
          <Link to="/admin/users">Users</Link>
        </nav>
        <AdminSidebarActions />
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Sales Charts</h1>
            <p>Review completed transaction sales over a selected date range.</p>
          </div>
          <span className="admin-badge">Administrator</span>
        </header>
        <SalesChart />
      </main>
    </div>
  );
}
