// Mock next/headers — cookies() for tests
const cookieStore = new Map<string, string>();

export async function cookies() {
  return {
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
    getAll: () => {
      return Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }));
    },
  };
}

// Test helpers
export function setCookie(name: string, value: string) {
  cookieStore.set(name, value);
}

export function clearCookies() {
  cookieStore.clear();
}
