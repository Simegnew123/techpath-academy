// store.ts — re-exports from split modules
// The original store.ts was split into 3 files to work within proxy size limits.
// All exports are re-exported here so existing imports (import { ... } from "@/lib/store")
// continue to work without any changes.
export * from "./store-base";
export * from "./store-crud-a";
export * from "./store-crud-b";
