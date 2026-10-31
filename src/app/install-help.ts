import { KEY_PREFIX } from "./channel";
export const INSTALL_HELP_KEY = `${KEY_PREFIX}install-help-dismissed.v1`;

/** A conservative hint gate, not an installed-app inventory. iPad Safari
 * can use a desktop Mac UA; touch support distinguishes that case. */
export function isIOSSafari({
  userAgent,
  maxTouchPoints,
}: Pick<Navigator, "userAgent" | "maxTouchPoints">): boolean {
  const appleTouch =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return (
    appleTouch &&
    /Version\/\d/.test(userAgent) &&
    /Safari\/\d/.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|YaBrowser|FBAN|FBAV|Instagram|MicroMessenger|Line\//i.test(
      userAgent,
    )
  );
}

export function loadInstallHelpDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_HELP_KEY) === "true";
  } catch {
    return false;
  }
}
