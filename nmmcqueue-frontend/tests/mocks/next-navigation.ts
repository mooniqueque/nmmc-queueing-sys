import { vi } from "vitest";

export const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

export function useRouter() {
  return mockRouter;
}
