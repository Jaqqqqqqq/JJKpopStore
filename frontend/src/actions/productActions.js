import axios from "axios";
import { API } from "../api";

export const PRODUCTS_REQUEST = "PRODUCTS_REQUEST";
export const PRODUCTS_SUCCESS = "PRODUCTS_SUCCESS";
export const PRODUCTS_FAILURE = "PRODUCTS_FAILURE";
export const ADMIN_PRODUCTS_REQUEST = "ADMIN_PRODUCTS_REQUEST";
export const ADMIN_PRODUCTS_SUCCESS = "ADMIN_PRODUCTS_SUCCESS";
export const ADMIN_PRODUCTS_FAILURE = "ADMIN_PRODUCTS_FAILURE";
export const ADMIN_PRODUCT_REMOVE = "ADMIN_PRODUCT_REMOVE";
export const ADMIN_PRODUCTS_REMOVE_MANY = "ADMIN_PRODUCTS_REMOVE_MANY";
export const PRODUCT_DETAILS_REQUEST = "PRODUCT_DETAILS_REQUEST";
export const PRODUCT_DETAILS_SUCCESS = "PRODUCT_DETAILS_SUCCESS";
export const PRODUCT_DETAILS_FAILURE = "PRODUCT_DETAILS_FAILURE";
export const PRODUCT_DETAILS_CLEAR = "PRODUCT_DETAILS_CLEAR";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const fetchProducts = (filters, append = false) => async (dispatch) => {
  const requestId = `${Date.now()}-${Math.random()}`;
  dispatch({ type: PRODUCTS_REQUEST, payload: { requestId } });
  try {
    const params = new URLSearchParams(filters);
    const { data } = await axios.get(`${API}/products?${params}`);
    dispatch({ type: PRODUCTS_SUCCESS, payload: { ...data, append, requestId } });
    return data;
  } catch (error) {
    const message = getErrorMessage(error, "Unable to load products.");
    dispatch({ type: PRODUCTS_FAILURE, payload: { message, requestId } });
    throw new Error(message, { cause: error });
  }
};

export const fetchAdminProducts = () => async (dispatch) => {
  dispatch({ type: ADMIN_PRODUCTS_REQUEST });
  try {
    const { data } = await axios.get(`${API}/admin/products`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    dispatch({ type: ADMIN_PRODUCTS_SUCCESS, payload: data.products || [] });
    return data.products || [];
  } catch (error) {
    const message = getErrorMessage(error, "Unable to load admin products.");
    dispatch({ type: ADMIN_PRODUCTS_FAILURE, payload: message });
    throw new Error(message, { cause: error });
  }
};

export const removeAdminProduct = (productId) => ({
  type: ADMIN_PRODUCT_REMOVE,
  payload: productId,
});

export const removeAdminProducts = (productIds) => ({
  type: ADMIN_PRODUCTS_REMOVE_MANY,
  payload: productIds,
});

export const fetchProductDetails = (productId) => async (dispatch) => {
  const requestId = `${Date.now()}-${Math.random()}`;
  dispatch({ type: PRODUCT_DETAILS_REQUEST, payload: { requestId } });
  try {
    const { data } = await axios.get(`${API}/product/${productId}`);
    const product = data.product || data;
    dispatch({ type: PRODUCT_DETAILS_SUCCESS, payload: { product, requestId } });
    return product;
  } catch (error) {
    const message = getErrorMessage(error, "Unable to load this product.");
    dispatch({ type: PRODUCT_DETAILS_FAILURE, payload: { message, requestId } });
    throw new Error(message, { cause: error });
  }
};

export const updateProductDetails = (product) => ({
  type: PRODUCT_DETAILS_SUCCESS,
  payload: { product },
});

export const clearProductDetails = () => ({ type: PRODUCT_DETAILS_CLEAR });
