export class CopyAuthorFactory {
  private static keyboardCallback:
    | ((ev: KeyboardEvent, keyOptions: any) => void)
    | null = null;

  static registerRightClickMenuItems() {
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
      id: "zotero-copy-author-separator",
    });

    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-copy-author-authors",
      label: "Copy Authors (Text)",
      commandListener: () => {
        this.copyAuthors();
      },
    });

    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-copy-author-latex",
      label: "Copy LaTeX Citation",
      commandListener: () => {
        this.copyLatexRef();
      },
    });
  }

  static registerKeyboardShortcuts() {
    // Register keyboard shortcuts (avoiding Zotero's built-in Cmd+Shift+C = Copy Bibliography)
    // Cmd+Shift+A (Mac) / Ctrl+Shift+A (Windows) for Copy Authors
    // Cmd+Shift+L (Mac) / Ctrl+Shift+L (Windows) for Copy LaTeX Citation (L for LaTeX)
    this.keyboardCallback = (ev, keyOptions) => {
      const isMac = Zotero.isMac;
      const cmdOrCtrl = isMac ? ev.metaKey : ev.ctrlKey;

      if (cmdOrCtrl && ev.shiftKey) {
        // Copy Authors: Cmd+Shift+A / Ctrl+Shift+A
        if (ev.key === "A" || ev.key === "a") {
          ev.preventDefault();
          ev.stopPropagation();
          this.copyAuthors();
          return;
        }

        // Copy LaTeX Citation: Cmd+Shift+L / Ctrl+Shift+L (L for LaTeX)
        if (ev.key === "L" || ev.key === "l") {
          ev.preventDefault();
          ev.stopPropagation();
          this.copyLatexRef();
          return;
        }
      }
    };

    ztoolkit.Keyboard.register(this.keyboardCallback);
  }

  static unregisterKeyboardShortcuts() {
    if (this.keyboardCallback) {
      ztoolkit.Keyboard.unregister(this.keyboardCallback);
      this.keyboardCallback = null;
    }
  }

  static unregisterAll() {
    // Unregister keyboard shortcuts
    this.unregisterKeyboardShortcuts();

    // Remove menu items from all windows
    const menuIds = [
      "zotero-copy-author-separator",
      "zotero-copy-author-authors",
      "zotero-copy-author-latex",
    ];

    // Remove from all Zotero windows
    for (const win of Zotero.getMainWindows()) {
      for (const id of menuIds) {
        const element = win.document.getElementById(id);
        if (element) {
          element.remove();
        }
      }
    }

    // Also unregister from ztoolkit's tracking
    for (const id of menuIds) {
      try {
        ztoolkit.Menu.unregister(id);
      } catch (e) {
        // Ignore if already unregistered
      }
    }
  }

  static getSelectedItems() {
    return Zotero.getActiveZoteroPane().getSelectedItems();
  }

  static copyToClipboard(text: string) {
    new ztoolkit.Clipboard().addText(text, "text/unicode").copy();
  }

  static copyAuthors() {
    const items = this.getSelectedItems();
    if (!items.length) return;

    const textParts: string[] = [];

    for (const item of items) {
      if (!item.isRegularItem()) continue;

      const creators = item.getCreators();
      let authorString = "";

      if (creators.length > 0) {
        const primaryCreators = creators.filter(
          (c: any) =>
            c.creatorTypeID ===
              Zotero.CreatorTypes.getPrimaryIDForType(item.itemTypeID) || true,
        );

        if (primaryCreators.length === 1) {
          authorString = primaryCreators[0].lastName;
        } else if (primaryCreators.length === 2) {
          authorString =
            primaryCreators[0].lastName + " & " + primaryCreators[1].lastName;
        } else if (primaryCreators.length > 2) {
          authorString = primaryCreators[0].lastName + " et al.";
        }
      } else {
        authorString = "Unknown";
      }
      textParts.push(authorString);
    }

    this.copyToClipboard(textParts.join("; "));
  }

  static copyLatexRef() {
    const items = this.getSelectedItems();
    if (!items.length) return;

    const keys: string[] = [];
    for (const item of items) {
      if (!item.isRegularItem()) continue;

      let key: string | null = null;

      // Method 1: Try BetterBibTeX's getField patch (simplest and most reliable)
      // Better BibTeX monkey-patches Zotero.Item.prototype.getField to support 'citationKey' or 'citekey'
      try {
        // Better BibTeX adds support for 'citationKey' and 'citekey' fields via monkey patch
        const citeKey = item.getField("citationKey") as string | undefined;
        const citekey = item.getField("citekey") as string | undefined;
        key = (citeKey || citekey || null)?.trim() || null;
      } catch (e) {
        // BetterBibTeX might not be installed or getField patch not available
      }

      // Method 2: Fallback to KeyManager API if getField didn't work
      if (!key) {
        try {
          // @ts-expect-error BetterBibTeX is external
          if (Zotero.BetterBibTeX && Zotero.BetterBibTeX.KeyManager) {
            // @ts-expect-error BetterBibTeX is external
            const keyEntry = Zotero.BetterBibTeX.KeyManager.get(item.id);
            if (keyEntry) {
              // The property is 'citationKey' in BBT source code
              key = keyEntry.citationKey || null;
            }
          }
        } catch (e) {
          // BetterBibTeX API might not be available
        }
      }

      // Method 2: Try to get citation key from extra field
      // Better BibTeX stores it as "Citation Key: key" on its own line
      if (!key) {
        try {
          const extra = item.getField("extra") as string;
          if (extra) {
            // Better BibTeX format: "Citation Key: singhSecuringCloudBasedInternet2024"
            // The citation key is typically on its own line or at the start of a line

            // First, try to find it line by line (most reliable)
            const lines = extra.split(/\r?\n/);
            for (const line of lines) {
              // Match "Citation Key:" at start of line (with optional leading whitespace)
              // Capture everything after the colon until end of line
              // Citation keys are typically alphanumeric with possible camelCase
              const trimmedLine = line.trim();
              const lineMatch = trimmedLine.match(
                /^citation\s+key\s*:\s*(.+)$/i,
              );
              if (lineMatch && lineMatch[1]) {
                key = lineMatch[1].trim();
                // Ensure we got a valid key (non-empty, no just whitespace)
                if (key && key.length > 0) {
                  break;
                }
              }
            }

            // If line-by-line didn't work, try multiline regex as fallback
            if (!key) {
              // Match "Citation Key:" followed by key (everything until newline)
              // This handles cases where the key might be on the same line
              const match = extra.match(/citation\s+key\s*:\s*([^\r\n]+)/i);
              if (match && match[1]) {
                key = match[1].trim();
                // Clean up any trailing content that shouldn't be part of the key
                // Citation keys typically don't contain spaces, so stop at first space if found
                const spaceIndex = key.indexOf(" ");
                if (spaceIndex > 0) {
                  key = key.substring(0, spaceIndex);
                }
              }
            }
          }
        } catch (e) {
          // Error parsing extra field
        }
      }

      // Method 3: Try using Zotero's export with Better BibTeX translator
      // This is how Better BibTeX's "Copy BibTeX" works internally
      if (!key) {
        try {
          // @ts-expect-error BetterBibTeX is external
          if (Zotero.BetterBibTeX) {
            // Try to get the citekey through BBT's export mechanism
            // Better BibTeX might expose the citekey through the item's extra data
            const extraField = item.getField("extra") as string;
            if (extraField) {
              // Look for the citation key in various formats
              // Better BibTeX might store it differently in different versions
              const patterns = [
                /citation\s+key\s*:\s*([a-zA-Z0-9_:-]+)/i,
                /citekey\s*:\s*([a-zA-Z0-9_:-]+)/i,
                /bibtex\s+key\s*:\s*([a-zA-Z0-9_:-]+)/i,
              ];

              for (const pattern of patterns) {
                const match = extraField.match(pattern);
                if (match && match[1]) {
                  key = match[1].trim();
                  break;
                }
              }
            }
          }
        } catch (e) {
          // Export method failed
        }
      }

      // Fallback: Generate a key from author and year
      if (!key) {
        const creators = item.getCreators();
        const lastName =
          creators.length > 0
            ? creators[0].lastName.toLowerCase().replace(/\s/g, "")
            : "anon";
        let year = "xxxx";
        if (item.getField("date")) {
          const date = Zotero.Date.strToDate(item.getField("date"));
          if (date.year) year = date.year;
        }
        key = lastName + year;
      }

      keys.push(key);
    }

    if (keys.length > 0) {
      this.copyToClipboard("\\cite{" + keys.join(",") + "}");
    }
  }
}
