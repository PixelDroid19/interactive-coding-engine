import type React from "react";

/** Moves focus within a horizontally scrollable set of native buttons. */
export function moveFocusInHorizontalTabStrip(
  event: React.KeyboardEvent<HTMLElement>,
): void {
  const direction =
    event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "[data-horizontal-tab]:not(:disabled)",
    ),
  );
  if (controls.length === 0) return;

  const currentIndex = controls.indexOf(
    document.activeElement as HTMLButtonElement,
  );
  if (currentIndex < 0) return;

  if (direction !== 0) {
    event.preventDefault();
    controls[
      (currentIndex + direction + controls.length) % controls.length
    ].focus();
  } else if (event.key === "Home") {
    event.preventDefault();
    controls[0].focus();
  } else if (event.key === "End") {
    event.preventDefault();
    controls.at(-1)?.focus();
  }
}
