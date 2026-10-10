export const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

export const categories = [
  "All",
  "Albums",
  "Photocards",
  "Lightsticks",
  "Posters",
  "Accessories",
];

export const sampleProducts = [
  {
    _id: "a",
    name: "Born Pink — Special Edition",
    artist: "BLACKPINK",
    category: "Albums",
    price: 1899,
    image: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?auto=format&fit=crop&w=700&q=85",
  },
  {
    _id: "b",
    name: "Idol Photocard Set",
    artist: "Stray Kids",
    category: "Photocards",
    price: 399,
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=700&q=85",
  },
  {
    _id: "c",
    name: "Official Lightstick",
    artist: "BTS",
    category: "Lightsticks",
    price: 2499,
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=85",
  },
  {
    _id: "d",
    name: "World Tour Poster",
    artist: "SEVENTEEN",
    category: "Posters",
    price: 250,
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=85",
  },
  {
    _id: "e",
    name: "Character Keychain",
    artist: "BT21",
    category: "Accessories",
    price: 299,
    image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=700&q=85",
  },
];
