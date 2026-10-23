export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params: string) => ["products", "list", params] as const,
    adminList: ["products", "admin", "list"] as const,
    details: ["products", "detail"] as const,
    detail: (identifier: string) => ["products", "detail", identifier] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: ["categories", "list"] as const,
  },
};
