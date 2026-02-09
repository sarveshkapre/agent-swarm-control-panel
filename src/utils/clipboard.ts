export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined") {
    const clipboard = navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      try {
        await clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy path.
      }
    }
  }

  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand?.("copy") ?? false;
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

