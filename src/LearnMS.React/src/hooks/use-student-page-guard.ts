import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Soft deterrent against casual Inspect/DevTools use on student-facing pages.
 * Skipped in local DEV and on /dashboard (teachers/admins need DevTools).
 * This cannot fully prevent DevTools — it only blocks common shortcuts/right-click.
 */
export function useStudentPageGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (pathname.startsWith("/dashboard")) return;

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (event.key === "F12") {
        event.preventDefault();
        return;
      }

      if (ctrlOrMeta && event.shiftKey && ["i", "j", "c"].includes(key)) {
        event.preventDefault();
        return;
      }

      if (ctrlOrMeta && key === "u") {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pathname]);
}
