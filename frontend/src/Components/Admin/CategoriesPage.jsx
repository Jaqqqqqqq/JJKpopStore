import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { DataGrid } from "@mui/x-data-grid";
import "../../App.css";
import { confirmAction, showNotification } from "../../utils/notifications";
import AdminSidebarActions from "./AdminSidebarActions";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingArtist, setEditingArtist] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [artistError, setArtistError] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [artistMessage, setArtistMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const requestOptions = useCallback((method = "GET", body) => ({
    method,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), []);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryResponse, artistResponse] = await Promise.all([
        fetch(`${API}/admin/categories`, requestOptions()),
        fetch(`${API}/admin/artists`, requestOptions()),
      ]);
      const [categoryData, artistData] = await Promise.all([
        categoryResponse.json(), artistResponse.json(),
      ]);
      if (!categoryResponse.ok) throw new Error(categoryData.message || "Unable to load categories.");
      if (!artistResponse.ok) throw new Error(artistData.message || "Unable to load artist / group list.");
      setCategories(categoryData.categories || []);
      setArtists(artistData.artists || []);
    } catch (error) {
      setCategoryError(error.message);
      showNotification({ title: "Unable to load lists", text: error.message, icon: "error" });
    } finally {
      setLoading(false);
    }
  }, [requestOptions]);

  useEffect(() => { loadLists(); }, [loadLists]);

  async function saveEntry(kind) {
    const isCategory = kind === "category";
    const name = (isCategory ? categoryName : artistName).trim();
    const editing = isCategory ? editingCategory : editingArtist;
    const setError = isCategory ? setCategoryError : setArtistError;
    const setMessage = isCategory ? setCategoryMessage : setArtistMessage;
    if (name.length < 2 || name.length > (isCategory ? 50 : 80)) {
      setError(`Enter a name between 2 and ${isCategory ? 50 : 80} characters.`);
      showNotification({ title: "Check the name", text: `Enter a name between 2 and ${isCategory ? 50 : 80} characters.`, icon: "warning" });
      return;
    }

    setError("");
    setMessage("");
    try {
      const endpoint = isCategory ? "categories" : "artists";
      const url = editing
        ? `${API}/admin/${endpoint}/${editing._id}`
        : `${API}/admin/${endpoint}`;
      const response = await fetch(url, requestOptions(editing ? "PUT" : "POST", { name }));
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to save ${kind}.`);

      setMessage(editing ? `${name} updated.` : `${name} added.`);
      showNotification({ title: editing ? "Updated successfully" : "Added successfully", text: `${name} ${editing ? "updated" : "added"}.` });
      if (isCategory) {
        setCategoryName("");
        setEditingCategory(null);
      } else {
        setArtistName("");
        setEditingArtist(null);
      }
      await loadLists();
    } catch (error) {
      setError(error.message);
      showNotification({ title: `Unable to save ${kind}`, text: error.message, icon: "error" });
    }
  }

  async function deleteEntry(kind, entry) {
    const confirmation = await confirmAction({
      title: `Delete ${entry.name}?`,
      text: "This action cannot be undone.",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!confirmation.isConfirmed) return;
    const isCategory = kind === "category";
    const setError = isCategory ? setCategoryError : setArtistError;
    const setMessage = isCategory ? setCategoryMessage : setArtistMessage;
    setError("");
    setMessage("");
    try {
      const endpoint = isCategory ? "categories" : "artists";
      const response = await fetch(`${API}/admin/${endpoint}/${entry._id}`, requestOptions("DELETE"));
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to delete ${kind}.`);
      setMessage(`${entry.name} deleted.`);
      showNotification({ title: "Deleted successfully", text: `${entry.name} was deleted.` });
      await loadLists();
    } catch (error) {
      setError(error.message);
      showNotification({ title: `Unable to delete ${kind}`, text: error.message, icon: "error" });
    }
  }

  const categoryRows = categories.map((category) => ({ ...category, id: category._id }));
  const artistRows = artists.map((artist) => ({ ...artist, id: artist._id }));
  const makeColumns = (kind) => {
    const isCategory = kind === "category";
    return [
      { field: "name", headerName: isCategory ? "Category" : "Artist / Group", flex: 1, minWidth: 180 },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <div className="catalog-row-actions">
            <Button
              size="small"
              onClick={() => {
                if (isCategory) {
                  setEditingCategory(row);
                  setCategoryName(row.name);
                } else {
                  setEditingArtist(row);
                  setArtistName(row.name);
                }
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => deleteEntry(kind, row)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ];
  };

  const gridSx = {
    border: "1px solid #f1dce5",
    borderRadius: "10px",
    backgroundColor: "#fff",
    "& .MuiDataGrid-columnHeaders": { backgroundColor: "#fff7fa" },
    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#806b79" },
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&J K-POP</h2>
        <p>Admin Panel</p>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin/charts">Charts</Link>
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
            <h1>Categories</h1>
            <p>Manage product categories and artist / group options.</p>
          </div>
          <span className="admin-badge">Administrator</span>
        </header>

        {loading && <p>Loading category lists...</p>}
        <div className="catalog-management-grid">
          <section className="admin-products catalog-management-card">
            <h2>Product Categories</h2>
            <p>Add, rename, or remove product categories.</p>
            <form className="catalog-entry-form" onSubmit={(event) => { event.preventDefault(); saveEntry("category"); }}>
              <label htmlFor="category-name">Category name</label>
              <input id="category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={50} placeholder="e.g. DVDs" required />
              <div className="catalog-form-actions">
                <button type="submit" className="admin-add-button">{editingCategory ? "Save Category" : "Add Category"}</button>
                {editingCategory && <button type="button" className="admin-cancel-button" onClick={() => { setEditingCategory(null); setCategoryName(""); }}>Cancel</button>}
              </div>
            </form>
            {categoryError && <p className="admin-error" role="alert">{categoryError}</p>}
            {categoryMessage && <p className="catalog-success" role="status">{categoryMessage}</p>}
            <DataGrid
              rows={categoryRows}
              columns={makeColumns("category")}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              showToolbar
              sx={gridSx}
            />
          </section>

          <section className="admin-products catalog-management-card">
            <h2>Artists / Groups</h2>
            <p>Manage the artist / group choices available on products.</p>
            <form className="catalog-entry-form" onSubmit={(event) => { event.preventDefault(); saveEntry("artist"); }}>
              <label htmlFor="artist-name">Artist / group name</label>
              <input id="artist-name" value={artistName} onChange={(event) => setArtistName(event.target.value)} maxLength={80} placeholder="e.g. BIGBANG" required />
              <div className="catalog-form-actions">
                <button type="submit" className="admin-add-button">{editingArtist ? "Save Artist / Group" : "Add Artist / Group"}</button>
                {editingArtist && <button type="button" className="admin-cancel-button" onClick={() => { setEditingArtist(null); setArtistName(""); }}>Cancel</button>}
              </div>
            </form>
            {artistError && <p className="admin-error" role="alert">{artistError}</p>}
            {artistMessage && <p className="catalog-success" role="status">{artistMessage}</p>}
            <DataGrid
              rows={artistRows}
              columns={makeColumns("artist")}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              showToolbar
              sx={gridSx}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
