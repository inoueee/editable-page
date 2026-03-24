const MENU_ID = "toggle-editable";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "編集モードON",
    contexts: ["all"]
  });
});

// Toolbar button click
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  toggleEditable(tab.id);
});

// Context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id) {
    toggleEditable(tab.id);
  }
});

// Shared toggle logic
async function toggleEditable(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const body = document.body;
      if (!body) return { isEditable: false };

      const isEditable = body.isContentEditable;

      if (isEditable) {
        body.removeAttribute("contenteditable");
        removeTopBar();
        removeFocusStyle();
        showToast("編集モード OFF");
        return { isEditable: false };
      } else {
        body.setAttribute("contenteditable", "true");
        body.focus();
        addTopBar();
        addFocusStyle();
        showToast("編集モード ON");
        return { isEditable: true };
      }

      // ===== UI Helpers =====
      function showToast(message) {
        let toast = document.getElementById("editable-toast");
        if (!toast) {
          toast = document.createElement("div");
          toast.id = "editable-toast";
          Object.assign(toast.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "10px 16px",
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            fontSize: "14px",
            borderRadius: "8px",
            zIndex: 999999,
            transform: "translateY(20px)",
            opacity: "0",
            transition: "all 0.3s ease"
          });
          document.body.appendChild(toast);
        }

        toast.textContent = message;
        requestAnimationFrame(() => {
          toast.style.opacity = "1";
          toast.style.transform = "translateY(0)";
        });

        setTimeout(() => {
          toast.style.opacity = "0";
          toast.style.transform = "translateY(20px)";
        }, 1500);
      }

      function addTopBar() {
        if (document.getElementById("editable-topbar")) return;
        const bar = document.createElement("div");
        bar.id = "editable-topbar";
        bar.textContent = "編集モード中";
        Object.assign(bar.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          padding: "8px",
          background: "#ff4d4f",
          color: "#fff",
          textAlign: "center",
          fontWeight: "bold",
          zIndex: 999999
        });
        document.body.appendChild(bar);
      }

      function removeTopBar() {
        const bar = document.getElementById("editable-topbar");
        if (bar) bar.remove();
      }

      function addFocusStyle() {
        let style = document.getElementById("editable-focus-style");
        if (!style) {
          style = document.createElement("style");
          style.id = "editable-focus-style";
          style.textContent = `
            *:focus {
              outline: 2px solid #1890ff !important;
              outline-offset: 2px;
            }
          `;
          document.head.appendChild(style);
        }
      }

      function removeFocusStyle() {
        const style = document.getElementById("editable-focus-style");
        if (style) style.remove();
      }
    }
  });

  // Update context menu title dynamically
  chrome.contextMenus.update(MENU_ID, {
    title: result.isEditable ? "編集モードOFF" : "編集モードON"
  });
}

// ===== Optional: content.css =====
/*
body[contenteditable="true"] {
  outline: 3px dashed red;
}
*/
