// Mock next/navigation — redirect() for tests
export function redirect(url: string): never {
  throw new Error(`REDIRECT:${url}`);
}

export function notFound(): never {
  throw new Error("NOT_FOUND");
}

export function useRouter() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };
}

export function usePathname() {
  return "/";
}

export function useSearchParams() {
  return new URLSearchParams();
}
