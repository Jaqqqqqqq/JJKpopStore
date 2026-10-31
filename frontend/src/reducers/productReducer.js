import {
  ADMIN_PRODUCTS_FAILURE,
  ADMIN_PRODUCT_REMOVE,
  ADMIN_PRODUCTS_REQUEST,
  ADMIN_PRODUCTS_REMOVE_MANY,
  ADMIN_PRODUCTS_SUCCESS,
  PRODUCT_DETAILS_CLEAR,
  PRODUCT_DETAILS_FAILURE,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCTS_FAILURE,
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
} from "../actions/productActions";

const initialState = {
  items: [],
  productsCount: 0,
  filteredProductsCount: 0,
  resPerPage: 12,
  currentPage: 1,
  hasMore: false,
  loading: false,
  error: null,
  activeListRequest: null,
  adminItems: [],
  adminLoading: false,
  adminError: null,
  current: null,
  detailsLoading: false,
  detailsError: null,
  activeDetailsRequest: null,
};

export default function productReducer(state = initialState, action) {
  switch (action.type) {
    case PRODUCTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        activeListRequest: action.payload.requestId,
      };
    case PRODUCTS_SUCCESS: {
      if (action.payload.requestId !== state.activeListRequest) return state;
      const { append, products = [] } = action.payload;
      return {
        ...state,
        items: append ? [...state.items, ...products] : products,
        productsCount: action.payload.productsCount ?? action.payload.count ?? products.length,
        filteredProductsCount: action.payload.filteredProductsCount ?? action.payload.count ?? products.length,
        resPerPage: action.payload.resPerPage ?? 12,
        currentPage: action.payload.currentPage ?? 1,
        hasMore: Boolean(action.payload.hasMore),
        loading: false,
        error: null,
        activeListRequest: null,
      };
    }
    case PRODUCTS_FAILURE:
      if (action.payload.requestId !== state.activeListRequest) return state;
      return { ...state, loading: false, error: action.payload.message, activeListRequest: null };
    case ADMIN_PRODUCTS_REQUEST:
      return { ...state, adminLoading: true, adminError: null };
    case ADMIN_PRODUCTS_SUCCESS:
      return { ...state, adminItems: action.payload, adminLoading: false, adminError: null };
    case ADMIN_PRODUCTS_FAILURE:
      return { ...state, adminLoading: false, adminError: action.payload };
    case ADMIN_PRODUCT_REMOVE:
      return { ...state, adminItems: state.adminItems.filter((product) => product._id !== action.payload) };
    case ADMIN_PRODUCTS_REMOVE_MANY:
      return { ...state, adminItems: state.adminItems.filter((product) => !action.payload.includes(product._id)) };
    case PRODUCT_DETAILS_REQUEST:
      return { ...state, current: null, detailsLoading: true, detailsError: null, activeDetailsRequest: action.payload.requestId };
    case PRODUCT_DETAILS_SUCCESS:
      if (action.payload.requestId && action.payload.requestId !== state.activeDetailsRequest) return state;
      return { ...state, current: action.payload.product, detailsLoading: false, detailsError: null, activeDetailsRequest: null };
    case PRODUCT_DETAILS_FAILURE:
      if (action.payload.requestId !== state.activeDetailsRequest) return state;
      return { ...state, current: null, detailsLoading: false, detailsError: action.payload.message, activeDetailsRequest: null };
    case PRODUCT_DETAILS_CLEAR:
      return { ...state, current: null, detailsLoading: false, detailsError: null, activeDetailsRequest: null };
    default:
      return state;
  }
}
