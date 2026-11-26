/**
 * Render on a page to make its app window fill the screen with no lavender margin
 * (AppWindow picks this up with a CSS :has() check, so no client code is needed).
 */
export function FlushWindow() {
  return <span data-flush-window hidden />;
}
