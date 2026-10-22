import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

type CatalogState = { search: string; category: string; sort: string; page: number; inStock: boolean; discounted: boolean; minPrice: string; maxPrice: string; brand: string; tag: string };
const initialState: CatalogState = { search: "", category: "", sort: "newest", page: 1, inStock: false, discounted: false, minPrice: "", maxPrice: "", brand: "", tag: "" };
const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
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
  },
});
export const { setSearch, setCategory, setSort, setPage, setInStock, setDiscounted, setMinPrice, setMaxPrice, setBrand, setTag } = catalogSlice.actions;
export const store = configureStore({ reducer: { catalog: catalogSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
