export let focusTarget = null;
export let focusSize = 1.0;
export let flyingIn = false;
export let flyingToCenter = false;

export function setFocusTarget(target, size = 1.0) { focusTarget = target; focusSize = size; }
export function setFlyingIn(value) { flyingIn = value; }
export function setFlyingToCenter(value) { flyingToCenter = value; }
export function initNavigation(earthRef) { focusTarget = earthRef; }
