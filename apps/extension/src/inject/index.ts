import "./styles/global.css";
import { attachInitialListeners, setupObserver } from "./ripple";


attachInitialListeners();
setupObserver();

type AnyFunction = (...args: any[]) => any

const proxy = <T extends object, K extends keyof T>(
  source: T,
  method: K,
  callback: (this: T, returned: ReturnType<T[K] & AnyFunction>) => void
) => {
  const original = source[method] as AnyFunction
  source[method] = function (this: T, ...args: Parameters<AnyFunction>) {
    const returned = original.apply(this, args)
    callback.call(this, returned)
    return returned
  } as T[K]
}



const contextMenuClass = "context-view";
const contextMenuCss = `.${contextMenuClass} { border-radius: 4px; overflow: hidden; }`;

const styleEditorContextMenu = (shadowRoot: ShadowRoot) => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(contextMenuCss)
  shadowRoot.adoptedStyleSheets = [sheet]
}

proxy(Element.prototype, "attachShadow", (shadowRoot: ShadowRoot) => {
  proxy(shadowRoot, "appendChild", (child: HTMLElement) => {
    // if (child.classList.contains(contextMenuClass)) styleEditorContextMenu(shadowRoot)
  })
})





