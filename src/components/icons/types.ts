/** Lets a parent play an animated icon, e.g. when its whole nav item is hovered. */
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}
