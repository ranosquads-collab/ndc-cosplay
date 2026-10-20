import "@testing-library/jest-dom/vitest";

process.env.ADMIN_EMAIL ??= "admin@example.test";
process.env.ADMIN_PASSWORD ??= "test-only-password-123";
process.env.SESSION_SECRET ??= "test-only-session-secret-that-is-at-least-32-characters";

(globalThis as unknown as { __IS_TEST__?: boolean }).__IS_TEST__ = true;

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
