import { Suspense, type ReactNode } from "react";
import { AppWindow } from "./AppWindow";
import { PublicTopBar } from "./PublicTopBar";

/** Public frame: the window with the grey top bar, no side menu. */
export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <AppWindow layout="public">
      {/* Sign in's catch-all route only knows its path at request time; it has no top bar anyway. */}
      <Suspense fallback={null}>
        <PublicTopBar />
      </Suspense>
      {children}
    </AppWindow>
  );
}
