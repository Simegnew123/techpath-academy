// jest.setup.ts — loaded via setupFiles (BEFORE test framework)
// jest.fn() / jest.mock() ARE available here; expect/describe are NOT.

// ── crypto.randomUUID mock for deterministic IDs ──
if (!globalThis.crypto) {
  globalThis.crypto = {} as any;
}
const mockUUIDs = [
  "test-uuid-0001", "test-uuid-0002", "test-uuid-0003",
  "test-uuid-0004", "test-uuid-0005", "test-uuid-0006",
  "test-uuid-0007", "test-uuid-0008", "test-uuid-0009", "test-uuid-0010",
];
let uuidIndex = 0;
(globalThis.crypto as any).randomUUID = () => mockUUIDs[uuidIndex++ % mockUUIDs.length];

// ── In-memory file system mock for store.ts ──
const mockDB = new Map<string, string>();
let fsVersion = 0; // increments on every write to invalidate store.ts cache

jest.mock("fs", () => ({
  existsSync: jest.fn((p: string) => mockDB.has(p)),
  readFileSync: jest.fn((p: string) => {
    if (!mockDB.has(p)) throw new Error(`ENOENT: ${p}`);
    return mockDB.get(p)!;
  }),
  writeFileSync: jest.fn((p: string, data: string) => {
    mockDB.set(p, data);
    fsVersion++;
  }),
  renameSync: jest.fn((oldPath: string, newPath: string) => {
    if (!mockDB.has(oldPath)) throw new Error(`ENOENT: ${oldPath}`);
    mockDB.set(newPath, mockDB.get(oldPath)!);
    mockDB.delete(oldPath);
    fsVersion++;
  }),
  statSync: jest.fn((p: string) => ({
    mtimeMs: mockDB.has(p) ? fsVersion : 0,
    size: mockDB.get(p)?.length || 0,
    isFile: () => true,
    isDirectory: () => false,
  })),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  unlinkSync: jest.fn((p: string) => { mockDB.delete(p); fsVersion++; }),
}));

jest.mock("path", () => ({
  join: jest.fn((...args: string[]) => args.join("/").replace(/\\/g, "/")),
  dirname: jest.fn((p: string) => p.split("/").slice(0, -1).join("/")),
  resolve: jest.fn((...args: string[]) => args.join("/").replace(/\\/g, "/")),
  extname: jest.fn((p: string) => {
    const parts = p.split(".");
    return parts.length > 1 ? "." + parts.pop() : "";
  }),
  basename: jest.fn((p: string) => p.split("/").pop() || ""),
  sep: "/",
}));

// ── Helper exports for tests ──
const dbPath = process.cwd().split("\\").join("/") + "/data/db.json";

function resetUUID() { uuidIndex = 0; }
function seedMockDB(data: any) {
  mockDB.set(dbPath, JSON.stringify(data));
  fsVersion++; // invalidate store.ts cache
}
function getMockDB(): any {
  const raw = mockDB.get(dbPath);
  return raw ? JSON.parse(raw) : null;
}
function clearMockDB() {
  mockDB.clear();
  fsVersion++; // invalidate store.ts cache
}

// Make available globally
(globalThis as any).__resetUUID = resetUUID;
(globalThis as any).__seedMockDB = seedMockDB;
(globalThis as any).__getMockDB = getMockDB;
(globalThis as any).__clearMockDB = clearMockDB;

// Export for test files that import from this module
export { seedMockDB, clearMockDB, getMockDB, resetUUID };
