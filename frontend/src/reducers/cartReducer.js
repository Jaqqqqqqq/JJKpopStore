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
const GUEST_CART_KEY = "cartItems_guest";

const loadGuestItems = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
  } catch {
    return [];
  }
};

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
  items: initialUserId ? loadItems(initialUserId) : loadGuestItems(),
  ownerId: initialUserId,
};

const mergeItems = (savedItems, guestItems) => {
  const merged = [...savedItems];
  guestItems.forEach((guestItem) => {
    const existing = merged.find(
      (item) => String(item.product) === String(guestItem.product)
    );
    if (existing) {
      existing.quantity = Math.min(
        Number(existing.stock ?? Infinity),
        existing.quantity + guestItem.quantity
      );
    } else {
      merged.push(guestItem);
    }
  });
  return merged;
};

export default function cartReducer(state = initialState, action) {
  if (action.type === AUTH_SUCCESS) {
    const ownerId = getUserId(action.payload);
    const items = mergeItems(loadItems(ownerId), loadGuestItems());
    localStorage.setItem(getCartKey(ownerId), JSON.stringify(items));
    localStorage.removeItem(GUEST_CART_KEY);
    return { items, ownerId };
  }

  if (action.type === AUTH_LOGOUT) {
    return { items: [], ownerId: null };
  }

  let items;

  switch (action.type) {
    case ADD_TO_CART: {
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
  stock: Number(product.stock ?? 0),
  quantity,
}
          ];
      break;
    }

    case REMOVE_FROM_CART:
      items = state.items.filter(
        (item) => String(item.product) !== String(action.payload)
      );
      break;

   case UPDATE_CART_QUANTITY:
  items = state.items.map((item) => {
    if (
      String(item.product) !==
      String(action.payload.productId)
    ) {
      return item;
    }

    const requestedQuantity = Number(
      action.payload.quantity
    );

    const maxStock = Number(item.stock ?? 0);

    return {
      ...item,
      quantity: Math.max(
        1,
        Math.min(requestedQuantity, maxStock)
      ),
    };
  });
  break;

    case CLEAR_CART:
      items = [];
      break;

    default:
      return state;
  }

  localStorage.setItem(
    state.ownerId ? getCartKey(state.ownerId) : GUEST_CART_KEY,
    JSON.stringify(items)
  );

  return { ...state, items };
}
