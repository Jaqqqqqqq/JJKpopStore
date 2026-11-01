
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import axios from "axios";
import "../../App.css";
import CustomModal from "../Common/CustomModal";
import { editProductValidationSchema } from "../../schemas/formSchemas";
import { showNotification } from "../../utils/notifications";
import AdminSidebarActions from "./AdminSidebarActions";

const API =
  import.meta.env.VITE_API || "http://localhost:5000/api/v1";

const categories = [
  "Albums",
  "Photocards",
  "Lightsticks",
  "Posters",
  "Accessories",
  "Other",
];


const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    artist: "",
    price: "",
    description: "",
    category: "Albums",
    stock: "",
    image: "",
    images: [],
  });

  const [previews, setPreviews] = useState([]);
  const [artists, setArtists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [legacyImage, setLegacyImage] = useState("");
  const [deletingImages, setDeletingImages] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: product.name,
      artist: product.artist,
      customArtist: "",
      price: product.price,
      description: product.description,
      category: product.category,
      stock: product.stock,
      images: [],
    },
    validationSchema: editProductValidationSchema,
    onSubmit: async (values) => {
      setError("");
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("artist", (values.artist === "Other" ? values.customArtist : values.artist).trim());
      formData.append("price", values.price);
      formData.append("description", values.description.trim());
      formData.append("category", values.category);
      formData.append("stock", values.stock);
      values.images.forEach((file) => formData.append("images", file));

      try {
        const { data } = await axios.put(
          `${API}/admin/product/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (data.success) setPopupOpen(true);
        else {
          const message = data.message || "Failed to update product.";
          setError(message);
          showNotification({ title: "Product update failed", text: message, icon: "error" });
        }
      } catch (requestError) {
        const message = requestError.response?.data?.message || requestError.message || "Failed to update product.";
        setError(message);
        showNotification({ title: "Product update failed", text: message, icon: "error" });
      }
    },
  });
  const files = formik.values.images;
  const loading = formik.isSubmitting;

  useEffect(() => {
    let cancelled = false;

    const getProduct = async () => {
      try {
        setLoadingProduct(true);

        const response = await axios.get(`${API}/product/${id}`);
        const item = response.data.product;

        if (cancelled) return;

        setProduct({
          name: item.name || "",
          artist: item.artist || "",
          price: item.price ?? "",
          description: item.description || "",
          category: item.category || "Albums",
          stock: item.stock ?? "",
          image: item.image || "",
          images: Array.isArray(item.images) ? item.images : [],
        });
        setExistingImages(Array.isArray(item.images) ? item.images : []);
        setLegacyImage(item.image || "");
      } catch (error) {
        if (!cancelled) {
          setError(
            error.response?.data?.message ||
              "Failed to load product."
          );
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    };

    getProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    axios.get(`${API}/admin/artists`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(({ data }) => setArtists(data.artists || [])).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API}/categories`)
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const fileChangeHandler = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;
    setError("");
    formik.setFieldValue("images", selectedFiles);
    formik.setFieldTouched("images", true, false);
  };

  const imageKey = (image) => image.publicId || image.url;
  const removeExistingImages = async (imageKeys, removeLegacyImage = false) => {
    if (deletingImages) return;
    setDeletingImages(true);
    const keys = new Set(imageKeys);
    const primaryImageRemoved = existingImages.some(
      (image) => image.url === legacyImage && keys.has(imageKey(image))
    );
    const remainingImages = existingImages.filter(
      (image) => !keys.has(imageKey(image))
    );
    setExistingImages(remainingImages);
    if (removeLegacyImage || primaryImageRemoved) {
      setLegacyImage(remainingImages[0]?.url || "");
    }
    try {
      const { data } = await axios.delete(`${API}/admin/product/${id}/images`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        data: { imageKeys, deleteLegacyImage: removeLegacyImage },
      });
      setExistingImages(data.product.images || []);
      setLegacyImage(data.product.image || "");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to remove product image.";
      showNotification({ title: "Image removal failed", text: message, icon: "error" });
      try {
        const { data } = await axios.get(`${API}/product/${id}`);
        setExistingImages(data.product.images || []);
        setLegacyImage(data.product.image || "");
      } catch {
        // Keep the current form state if the refresh also fails.
      }
    } finally {
      setDeletingImages(false);
    }
  };
  const removeExistingImage = (image, isLegacy = false) => {
    removeExistingImages(isLegacy ? [] : [imageKey(image)], isLegacy);
  };
  const deleteAllExistingImages = () => {
    const legacyImageIsSeparate = Boolean(
      legacyImage && !existingImages.some((image) => image.url === legacyImage)
    );
    removeExistingImages(existingImages.map(imageKey), legacyImageIsSeparate);
  };
  const removeAllNewImages = () => {
    formik.setFieldValue("images", []);
    setError("");
    const input = document.getElementById("edit-product-images");
    if (input) input.value = "";
  };
  const removeSelectedNewImage = (index) => {
    formik.setFieldValue("images", files.filter((_, fileIndex) => fileIndex !== index));
    const input = document.getElementById("edit-product-images");
    if (input) input.value = "";
  };

  const fieldError = (name) => formik.touched[name] && formik.errors[name]
    ? <span className="field-error" role="alert">{formik.errors[name]}</span>
    : null;
  const remainingExistingImages = existingImages;
  const legacyImageVisible = Boolean(
    legacyImage &&
    !existingImages.some((image) => image.url === legacyImage)
  );

  if (loadingProduct) {
    return (
      <div className="admin-page">
        <main className="admin-main">
          <p>Loading product...</p>
        </main>
      </div>
    );
  }

  
  return (
    <>
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
          <div className="admin-products">
            <h1>Edit Product</h1>
            <p>Update your merchandise information.</p>

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <form
              className="admin-product-form"
              onSubmit={formik.handleSubmit}
              noValidate
            >
              <label>
                Product Name
                <input
                  {...formik.getFieldProps("name")}
                  aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
                />
                {fieldError("name")}
              </label>

              <label>
                Artist / Group
                <select
                  {...formik.getFieldProps("artist")}
                  aria-invalid={Boolean(formik.touched.artist && formik.errors.artist)}
                >
                  {product.artist && !artists.some((artist) => artist.name === product.artist) && <option value={product.artist}>{product.artist}</option>}
                  <option value="">Select an artist / group</option>
                  {artists.map((artist) => <option key={artist._id} value={artist.name}>{artist.name}</option>)}
                  <option value="Other">Other</option>
                </select>
                {fieldError("artist")}
              </label>

              {formik.values.artist === "Other" && (
                <label>Artist / Group Name
                  <input {...formik.getFieldProps("customArtist")} placeholder="e.g. BIGBANG and 2NE1" aria-invalid={Boolean(formik.touched.customArtist && formik.errors.customArtist)} />
                  {fieldError("customArtist")}
                </label>
              )}

              <label>
                Price (₱)
                <input
                  {...formik.getFieldProps("price")}
                  type="number"
                  min="0.01"
                  step="0.01"
                  aria-invalid={Boolean(formik.touched.price && formik.errors.price)}
                />
                {fieldError("price")}
              </label>

              <label>
                Category
                <select
                  {...formik.getFieldProps("category")}
                  aria-invalid={Boolean(formik.touched.category && formik.errors.category)}
                >
                  {categories.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {fieldError("category")}
              </label>

              <label>
                Stock
                <input
                  {...formik.getFieldProps("stock")}
                  type="number"
                  min="0"
                  step="1"
                  aria-invalid={Boolean(formik.touched.stock && formik.errors.stock)}
                />
                {fieldError("stock")}
              </label>

              <div className="admin-full-width">
                <p>Current Product Images</p>

                                {remainingExistingImages.length > 0 ? (
                  <div className="product-image-previews">
                    {remainingExistingImages.map((img, index) => (
                      <div className="product-image-preview" key={imageKey(img) || index}>
                        <button type="button" className="image-remove-button" aria-label={`Remove image ${index + 1}`} title="Remove image" onClick={() => removeExistingImage(img)} disabled={loading || deletingImages}>&times;</button>
                        <img src={img.url} alt={`${product.name} ${index + 1}`} />
                        <p>Image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                ) : legacyImageVisible ? (
                  <div className="product-image-preview">
                    <button type="button" className="image-remove-button" aria-label="Remove product image" title="Remove image" onClick={() => removeExistingImage({ url: legacyImage }, true)} disabled={loading || deletingImages}>&times;</button>
                    <img src={legacyImage} alt={product.name} />
                    <p>Product image</p>
                  </div>
                ) : (
                  <p>No existing images.</p>
                )}
                {remainingExistingImages.length > 0 && legacyImageVisible && (
                  <div className="product-image-previews">
                    <div className="product-image-preview">
                      <button type="button" className="image-remove-button" aria-label="Remove additional product image" title="Remove image" onClick={() => removeExistingImage({ url: legacyImage }, true)} disabled={loading || deletingImages}>&times;</button>
                      <img src={legacyImage} alt={`${product.name} additional image`} />
                      <p>Additional image</p>
                    </div>
                  </div>
                )}
                {(remainingExistingImages.length > 0 || legacyImageVisible) && (
                  <div className="image-management-actions">
                    <button type="button" className="admin-cancel-button" onClick={deleteAllExistingImages} disabled={loading || deletingImages}>
                      Remove All Existing Images
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-full-width">
                <label htmlFor="edit-product-images">
                  Add New Images (up to 5 per save)
                </label>

                <input
                  id="edit-product-images"
                  type="file"
                  accept=".jpg,.jpeg,.jpe,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  onChange={fileChangeHandler}
                  onBlur={() => formik.setFieldTouched("images", true)}
                  disabled={loading}
                />
                {fieldError("images")}

                <p>
                  New images will be added to the existing images.
                  JPG, JPEG, JPE, PNG, or WEBP; maximum 5 MB each.
                </p>

                {previews.length > 0 && (
                  <div className="product-image-previews">
                    {previews.map((src, index) => (
                      <div className="product-image-preview" key={src}>
                        <button type="button" className="image-remove-button" aria-label={`Remove new image ${index + 1}`} title="Remove image" onClick={() => removeSelectedNewImage(index)} disabled={loading}>
                          ×
                        </button>
                        <img src={src} alt={`New image preview ${index + 1}`} />
                        <p>New image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={removeAllNewImages}
                    disabled={loading}
                  >
                    Remove All New Images
                  </button>
                )}
              </div>

              <label className="admin-full-width">
                Description
                <textarea
                  {...formik.getFieldProps("description")}
                  rows="5"
                  aria-invalid={Boolean(formik.touched.description && formik.errors.description)}
                />
                {fieldError("description")}
              </label>

              <button
                type="submit"
                className="admin-add-button"
                disabled={loading || loadingProduct}
              >
                {loading ? "Saving..." : "SAVE CHANGES"}
              </button>

              <button
                type="button"
                className="admin-cancel-button"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
            </form>
          </div>
        </main>
      </div>

      <CustomModal
        isOpen={popupOpen}
        title="Product Updated Successfully!"
        message="Your product information has been updated."
        type="success"
        confirmText="Go to Dashboard"
        onConfirm={() => {
          setPopupOpen(false);
          navigate("/dashboard");
        }}
      />
    </>
  );
};

export default EditProduct;
