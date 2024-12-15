import { Ripple } from "./ripple";


const RIPPLE: unique symbol = Symbol("RIPPLE");

declare global {
  interface HTMLElement {
    [RIPPLE]?: Ripple;
  }
}

const SELECTORS = [
  ".monaco-button",
  ".monaco-list-row",
  ".tabs-container > .tab",
];

const matchesSelector = (element: HTMLElement, selectors: string[]) => {
  return selectors.some(selector => element.matches(selector));
}


export const attachInitialListeners = () => {
  for(const selector of SELECTORS) {
    const elements = document.querySelectorAll(selector);
    for(const element of elements) {
      attachPermanentRipple(element as HTMLElement);
    }
  }
}

export const setupObserver = (): MutationObserver => {

  const mutationObserver = new MutationObserver(
    (mutations) => {
      for(const mutation of mutations) {
        for(const node of mutation.addedNodes) {
          if(
            node instanceof HTMLElement &&
            matchesSelector(node, SELECTORS)
          ) {
            attachPermanentRipple(node);
          }
        }
        // TODO: test and see if this works
        for(const node of mutation.removedNodes) {
          if(
            node instanceof HTMLElement &&
            matchesSelector(node, SELECTORS)
          ) {
            detachPermanentRipple(node);
          }
        }
      }
    },
  );

  mutationObserver.observe(
    document.body,
    {
      attributes: true,
      childList: true,
      subtree: true,
    },
  );

  return mutationObserver;
}

const hasRipple = (element: HTMLElement) => {
  return RIPPLE in element && !!element[RIPPLE];
}

const attachPermanentRipple = (element: HTMLElement) => {
  if(hasRipple(element)) return;

  const ripple = new Ripple(element);
  ripple.attach();

  Object.defineProperty(
    element,
    RIPPLE,
    {
      configurable: true,
      enumerable: false,
      get: () => ripple,
    }
  );

  return ripple;
}

const detachPermanentRipple = (element: HTMLElement) => {
  if(hasRipple(element)) {
    const ripple = element[RIPPLE];
    ripple?.detach();
    delete element[RIPPLE];
  }
}
