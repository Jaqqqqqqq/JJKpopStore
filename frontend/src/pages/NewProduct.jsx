import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import axios from "axios";
import "../App.css";
import CustomModal from "../Components/Common/CustomModal";
import { newProductValidationSchema } from "../schemas/formSchemas";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";
const categories = ["Albums", "Photocards", "Lightsticks", "Posters", "Accessories", "Other"];

const NewProduct = () => {
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: { name: "", artist: "", price: "", description: "", category: "Albums", stock: "", images: [] },
    validationSchema: newProductValidationSchema,
    onSubmit: async (values) => {
      setError("");
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("artist", values.artist.trim());
      formData.append("price", values.price);
      formData.append("description", values.description.trim());
      formData.append("category", values.category);
      formData.append("stock", values.stock);
      values.images.forEach((file) => formData.append("images", file));

      try {
        const { data } = await axios.post(`${API}/admin/product/new`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (data.success) setPopupOpen(true);
        else setError(data.message || "Failed to create product.");
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || "Failed to create product.");
      }
    },
  });
  const files = formik.values.images;
  const loading = formik.isSubmitting;

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    setError("");
    formik.setFieldValue("images", selectedFiles);
    formik.setFieldTouched("images", true, false);
  };

  const fieldError = (name) => formik.touched[name] && formik.errors[name]
    ? <span className="field-error" role="alert">{formik.errors[name]}</span>
    : null;

  return (
    <>
      <div className="admin-page">
        <aside className="admin-sidebar">
          <h2>J&J K-POP</h2><p>Admin Panel</p>
          <nav>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/admin/charts">Charts</Link>
            <Link to="/dashboard#admin-products">Products</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/reviews">Reviews</Link>
            <Link to="/admin/users">Users</Link>
          </nav>
          <Link to="/" className="admin-logout">Back to Store</Link>
        </aside>

        <main className="admin-main">
          <div className="admin-products">
            <h1>New Product</h1><p>Add merchandise to your K-pop store.</p>
            <form className="admin-product-form" onSubmit={formik.handleSubmit} noValidate>
              <h3>Product Information</h3>
              {error && <p className="admin-error" role="alert">{error}</p>}

              <label>Product Name
                <input {...formik.getFieldProps("name")} placeholder="e.g. SEVENTEEN Album" aria-invalid={Boolean(formik.touched.name && formik.errors.name)} />
                {fieldError("name")}
              </label>

              <label>Artist / Group
                <input {...formik.getFieldProps("artist")} placeholder="e.g. SEVENTEEN" aria-invalid={Boolean(formik.touched.artist && formik.errors.artist)} />
                {fieldError("artist")}
              </label>

              <label>Price (₱)
                <input {...formik.getFieldProps("price")} type="number" min="0.01" step="0.01" aria-invalid={Boolean(formik.touched.price && formik.errors.price)} />
                {fieldError("price")}
              </label>

              <label>Category
                <select {...formik.getFieldProps("category")} aria-invalid={Boolean(formik.touched.category && formik.errors.category)}>
                  {categories.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                {fieldError("category")}
              </label>

              <label>Stock
                <input {...formik.getFieldProps("stock")} type="number" min="0" step="1" aria-invalid={Boolean(formik.touched.stock && formik.errors.stock)} />
                {fieldError("stock")}
              </label>

              <div className="admin-full-width">
                <label htmlFor="product-images">Product Images (up to 5)</label>
                <input id="product-images" type="file" accept=".jpg,.jpeg,.jpe,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} onBlur={() => formik.setFieldTouched("images", true)} disabled={loading} />
                {fieldError("images")}
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
                    formik.setFieldValue("images", []); setError("");
                    const input = document.getElementById("product-images");
                    if (input) input.value = "";
                  }} disabled={loading}>Clear Selected Images</button>
                )}
              </div>

              <label className="admin-full-width">Description
                <textarea {...formik.getFieldProps("description")} rows="5" placeholder="Describe the merchandise" aria-invalid={Boolean(formik.touched.description && formik.errors.description)} />
                {fieldError("description")}
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
