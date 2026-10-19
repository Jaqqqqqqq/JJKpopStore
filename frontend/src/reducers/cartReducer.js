import {
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_QUANTITY,
  CLEAR_CART,
} from "../actions/cartActions";
import { AUTH_SUCCESS, AUTH_LOGOUT } from "../actions/userActions";

const getUserId = (user) => user?.id || user?._id || null;

const getStoredUserId = () => {
  try {
    return getUserId(JSON.parse(localStorage.getItem("user")));
  } catch {
    return null;
  }
};

const getCartKey = (userId) => `cartItems_${userId}`;

const loadItems = (userId) => {
  if (!userId) return [];

  try {
    const saved = localStorage.getItem(getCartKey(userId));
    if (saved !== null) return JSON.parse(saved) || [];

    // Migrate the old shared cart to the current user's cart.
    const legacy = localStorage.getItem("cartItems");
    if (legacy !== null) {
      localStorage.setItem(getCartKey(userId), legacy);
      localStorage.removeItem("cartItems");
      return JSON.parse(legacy) || [];
    }
  } catch {
    return [];
  }

  return [];
};

const initialUserId = getStoredUserId();
const initialState = {
  items: loadItems(initialUserId),
  ownerId: initialUserId,
};

export default function cartReducer(state = initialState, action) {
  if (action.type === AUTH_SUCCESS) {
    const ownerId = getUserId(action.payload);
    return { items: loadItems(ownerId), ownerId };
  }

  if (action.type === AUTH_LOGOUT) {
    return { items: [], ownerId: null };
  }

  let items;

  switch (action.type) {
    case ADD_TO_CART: {
      if (!state.ownerId) return state;

      const { product, quantity } = action.payload;
      const productId = String(product._id || product.id);
      const existing = state.items.find(
        (item) => String(item.product) === productId
      );

      items = existing
        ? state.items.map((item) =>
            String(item.product) === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [
            ...state.items,
            {
              product: productId,
              name: product.name,
              price: Number(product.price),
              image: product.image || product.images?.[0]?.url || "",
              quantity,
            },
          ];
      break;
    }

    case REMOVE_FROM_CART:
      items = state.items.filter(
        (item) => String(item.product) !== String(action.payload)
      );
      break;

    case UPDATE_CART_QUANTITY:
      items = state.items.map((item) =>
        String(item.product) === String(action.payload.productId)
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );
      break;

    case CLEAR_CART:
      items = [];
      break;

    default:
      return state;
  }

  if (state.ownerId) {
    localStorage.setItem(getCartKey(state.ownerId), JSON.stringify(items));
  }

  return { ...state, items };
}
