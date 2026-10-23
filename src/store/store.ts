import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

type CatalogState = { search: string; category: string; sort: string; page: number; inStock: boolean; discounted: boolean; minPrice: string; maxPrice: string; brand: string; tag: string; status: string };
const initialState: CatalogState = { search: "", category: "", sort: "newest", page: 1, inStock: false, discounted: false, minPrice: "", maxPrice: "", brand: "", tag: "", status: "" };
const catalogStorageKey = "naqashcorner.catalog-filters.v1";
const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    restoreCatalog(state, action: PayloadAction<Partial<CatalogState>>) {
      const value = action.payload;
      if (typeof value.search === "string") state.search = value.search;
      if (typeof value.category === "string") state.category = value.category;
      if (["newest", "oldest", "price_asc", "price_desc", "discount_desc", "name_asc", "name_desc"].includes(value.sort || "")) state.sort = value.sort!;
      if (Number.isInteger(value.page) && value.page! > 0) state.page = value.page!;
      if (typeof value.inStock === "boolean") state.inStock = value.inStock;
      if (typeof value.discounted === "boolean") state.discounted = value.discounted;
      if (typeof value.minPrice === "string") state.minPrice = value.minPrice;
      if (typeof value.maxPrice === "string") state.maxPrice = value.maxPrice;
      if (typeof value.brand === "string") state.brand = value.brand;
      if (typeof value.tag === "string") state.tag = value.tag;
      if (["", "draft", "published", "archived"].includes(value.status || "")) state.status = value.status!;
    },
    setSearch(state, action: PayloadAction<string>) { state.search = action.payload; state.page = 1; },
    setCategory(state, action: PayloadAction<string>) { state.category = action.payload; state.page = 1; },
    setSort(state, action: PayloadAction<string>) { state.sort = action.payload; state.page = 1; },
    setPage(state, action: PayloadAction<number>) { state.page = action.payload; },
    setInStock(state, action: PayloadAction<boolean>) { state.inStock = action.payload; state.page = 1; },
    setDiscounted(state, action: PayloadAction<boolean>) { state.discounted = action.payload; state.page = 1; },
    setMinPrice(state, action: PayloadAction<string>) { state.minPrice = action.payload; state.page = 1; },
    setMaxPrice(state, action: PayloadAction<string>) { state.maxPrice = action.payload; state.page = 1; },
    setBrand(state, action: PayloadAction<string>) { state.brand = action.payload; state.page = 1; },
    setTag(state, action: PayloadAction<string>) { state.tag = action.payload; state.page = 1; },
    setStatus(state, action: PayloadAction<string>) { state.status = action.payload; state.page = 1; },
  },
});
export const { restoreCatalog, setSearch, setCategory, setSort, setPage, setInStock, setDiscounted, setMinPrice, setMaxPrice, setBrand, setTag, setStatus } = catalogSlice.actions;
export const store = configureStore({ reducer: { catalog: catalogSlice.reducer } });
export { catalogStorageKey };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
