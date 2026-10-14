import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../App.css";
import CustomModal from "../Components/Common/CustomModal";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";
const categories = ["Albums", "Photocards", "Lightsticks", "Posters", "Accessories", "Other"];
const MAX_IMAGES = 5, MAX_FILE_SIZE = 5 * 1024 * 1024;

const NewProduct = () => {
  const [name, setName] = useState(""), [artist, setArtist] = useState(""), [price, setPrice] = useState("");
  const [description, setDescription] = useState(""), [category, setCategory] = useState("Albums"), [stock, setStock] = useState("");
  const [files, setFiles] = useState([]), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]), [popupOpen, setPopupOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    if (selectedFiles.length > MAX_IMAGES) {
      setError(`Please select no more than ${MAX_IMAGES} images.`);
      e.target.value = "";
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalidFile = selectedFiles.find(file => !validTypes.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalidFile) {
      setError("Use JPG, PNG, or WEBP images. Each image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setError("");
    setFiles(selectedFiles);
  };

  const submitHandler = async e => {
    e.preventDefault();
    setError("");
    if (!files.length) {
      setError("Please select at least one product image.");
      return;
    }
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("artist", artist.trim());
    formData.append("price", price);
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("stock", stock);
    files.forEach(file => formData.append("images", file));

    try {
      setLoading(true);
      const { data } = await axios.post(`${API}/admin/product/new`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (data.success) setPopupOpen(true);
      else setError(data.message || "Failed to create product.");
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="admin-page">
        <aside className="admin-sidebar">
          <h2>J&J K-POP</h2><p>Admin Panel</p>
          <nav>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/dashboard#admin-products">Products</Link>
          </nav>
          <Link to="/" className="admin-logout">Back to Store</Link>
        </aside>

        <main className="admin-main">
          <div className="admin-products">
            <h1>New Product</h1><p>Add merchandise to your K-pop store.</p>
            <form className="admin-product-form" onSubmit={submitHandler}>
              <h3>Product Information</h3>
              {error && <p className="admin-error" role="alert">{error}</p>}

              <label>Product Name
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. SEVENTEEN Album" />
              </label>

              <label>Artist / Group
                <input type="text" value={artist} onChange={e => setArtist(e.target.value)} required placeholder="e.g. SEVENTEEN" />
              </label>

              <label>Price (₱)
                <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
              </label>

              <label>Category
                <select value={category} onChange={e => setCategory(e.target.value)} required>
                  {categories.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label>Stock
                <input type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} required />
              </label>

              <div className="admin-full-width">
                <label htmlFor="product-images">Product Images (up to 5)</label>
                <input id="product-images" type="file" accept=".jpg,.jpeg,.jpe,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} disabled={loading} />
                <p>Select up to 5 JPG, PNG, or WEBP images. Maximum 5 MB per image.</p>

                {previews.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
                    {previews.map((src, index) => (
                      <div key={src}>
                        <img src={src} alt={`Product preview ${index + 1}`} style={{ width: "120px", height: "120px", objectFit: "contain", border: "1px solid #ccc", borderRadius: "8px" }} />
                        <p>Image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <button type="button" className="admin-cancel-button" onClick={() => {
                    setFiles([]); setError("");
                    const input = document.getElementById("product-images");
                    if (input) input.value = "";
                  }} disabled={loading}>Clear Selected Images</button>
                )}
              </div>

              <label className="admin-full-width">Description
                <textarea rows="5" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe the merchandise" />
              </label>

              <button type="submit" className="admin-add-button" disabled={loading}>
                {loading ? "Uploading Images..." : "CREATE PRODUCT"}
              </button>
              <button type="button" className="admin-cancel-button" onClick={() => navigate("/dashboard")} disabled={loading}>Cancel</button>
            </form>
          </div>
        </main>
      </div>

      <CustomModal isOpen={popupOpen} title="Product Created Successfully!" message="Your new product has been added to the store." type="success" confirmText="Go to Dashboard" onConfirm={() => {
        setPopupOpen(false);
        navigate("/dashboard");
      }} />
    </>
  );
};

export default NewProduct;