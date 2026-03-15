/**
 * Shared navigation state for camera focus and fly animations.
 * Used by raycaster, map, controls, and animation loop.
 */

export const navigation = {
  focusTarget: null,
  focusSize: 1.0,
  flyingIn: false,
  flyingToCenter: false,
};

export function setFocusTarget(target, size = 1.0) {
  navigation.focusTarget = target;
  navigation.focusSize = size;
}

export function setFlyingIn(value) {
  navigation.flyingIn = value;
}

export function setFlyingToCenter(value) {
  navigation.flyingToCenter = value;
}
