(function () {
  const REDIRECT_URL = "https://enzora.uz";
  let redirected = false;

  function redirectNow() {
    if (redirected) return;
    redirected = true;
    try { window.location.replace(REDIRECT_URL); } catch (e) {}
    try { window.close(); } catch (e) {}
  }
  
  function detectConsole() {
    let detected = false;
    const element = new Image();
    Object.defineProperty(element, "id", {
      get: function () { detected = true; },
    });
    console.log("%c", element);
    return detected;
  }

  function detectDebuggerPause() {
    const start = performance.now();
    debugger;
    const end = performance.now();
    return end - start > 100;
  }

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.key === "F12") return redirectNow();
    if (ctrl && e.shiftKey && ["i", "j", "c"].includes(key)) return redirectNow();
    if (ctrl && ["u", "s"].includes(key)) return redirectNow();
  }

  setInterval(() => {
    try {
      if (detectConsole() || detectDebuggerPause()) {
        redirectNow();
      }
    } catch (e) {}
  }, 300);

  window.addEventListener("keydown", onKeyDown, true);
})();
