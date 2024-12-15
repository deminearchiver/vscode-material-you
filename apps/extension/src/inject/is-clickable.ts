/**
 * @license
 * Copyright (c) OpenJS Foundation and other contributors
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// https://github.com/webdriverio/webdriverio/blob/480bc18b7d106e49e73dfadf6b30bb7ebe3ccf10/packages/webdriverio/src/scripts/isElementClickable.ts


/**
 * check if element is within the viewport or is overlapped by another element or disabled
 */
export const isElementClickable = (element: HTMLElement) => {
  if (!element.getBoundingClientRect || !element.scrollIntoView || !element.contains || !element.getClientRects || !document.elementFromPoint) {
      return false
  }

  // Edge before switching to Chromium
  const isOldEdge = !!(window as any).StyleMedia
  // returns true for Chrome and Firefox and false for Safari, Edge and IE
  const scrollIntoViewFullSupport = !((window as any).safari || isOldEdge)

  // get overlapping element
  const getOverlappingElement = (element: HTMLElement, context?: Document) => {
      context = context || document
      const elemDimension = element.getBoundingClientRect()
      const x = elemDimension.left + (element.clientWidth / 2)
      const y = elemDimension.top + (element.clientHeight / 2)
      return context.elementFromPoint(x, y)
  }

  // get overlapping element rects (currently only the first)
  // applicable if element's text is multiline.
  const getOverlappingRects = (element: HTMLElement, context?: Document) => {
      context = context || document

      const rects = element.getClientRects()
      // webdriver clicks on center of the first element's rect (line of text), it might change in future
      const rect = rects[0]
      const x = rect.left + (rect.width / 2)
      const y = rect.top + (rect.height / 2)
      return [context.elementFromPoint(x, y)]
  }

  // get overlapping elements
  const getOverlappingElements = (element: HTMLElement, context?: Document) => {
      return [getOverlappingElement(element, context)].concat(getOverlappingRects(element, context))
  }

  // is a node a descendant of a given node
  const nodeContains = (element: HTMLElement, otherNode: HTMLElement) => {
      // Edge doesn't support neither Shadow Dom nor contains if ShadowRoot polyfill is used
      if (isOldEdge) {
          let tmpElement = otherNode as HTMLElement | ShadowRoot | Element
          while (tmpElement) {
              if (tmpElement === element) {
                  return true
              }

              tmpElement = tmpElement.parentNode as ShadowRoot
              // DocumentFragment / ShadowRoot polyfill like ShadyRoot
              if (tmpElement && tmpElement.nodeType === 11 && tmpElement.host) {
                  tmpElement = tmpElement.host
              }
          }
          return false
      }

      return element.contains(otherNode)
  }

  // is one of overlapping elements the `elem` or one of its child
  const isOverlappingElementMatch = (elementsFromPoint: HTMLElement[], element: HTMLElement): boolean => {
      if (elementsFromPoint.some(function (elementFromPoint) {
          return elementFromPoint === element || nodeContains(element, elementFromPoint)
      })) {
          return true
      }

      // shadow root
      // filter unique elements with shadowRoot
      // @ts-ignore
      let elemsWithShadowRoot = [].concat(elementsFromPoint)
      elemsWithShadowRoot = elemsWithShadowRoot.filter(function (x: HTMLElement) {
          return x && x.shadowRoot && (x.shadowRoot as any).elementFromPoint
      })

      // getOverlappingElements of every element with shadowRoot
      let shadowElementsFromPoint: HTMLElement[] = []
      for (let i = 0; i < elemsWithShadowRoot.length; ++i) {
          const shadowElement = elemsWithShadowRoot[i]
          shadowElementsFromPoint = shadowElementsFromPoint.concat(
              getOverlappingElements(element, (shadowElement as HTMLElement).shadowRoot as any) as any
          )
      }
      // remove duplicates and parents
      // @ts-ignore
      shadowElementsFromPoint = [].concat(shadowElementsFromPoint)
      shadowElementsFromPoint = shadowElementsFromPoint.filter(function (x) {
          return !elementsFromPoint.includes(x)
      })

      if (shadowElementsFromPoint.length === 0) {
          return false
      }

      return isOverlappingElementMatch(shadowElementsFromPoint, element)
  }

  // copied from `isElementInViewport.js`
  const isElementInViewport = (element: HTMLElement) => {
      if (!element.getBoundingClientRect) {
          return false
      }

      const rect = element.getBoundingClientRect()

      const windowHeight = (window.innerHeight || document.documentElement.clientHeight)
      const windowWidth = (window.innerWidth || document.documentElement.clientWidth)

      const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) > 0)
      const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) > 0)

      return (vertInView && horInView)
  }

  const isEnabled = (element: HTMLFormElement) => {
      return element.disabled !== true
  }

  const hasOverlaps = (element: HTMLElement) => {
      return !isOverlappingElementMatch(getOverlappingElements(element) as any as HTMLElement[], element)
  }

  const isFullyDisplayedInViewport = (element: HTMLElement) => {
      return isElementInViewport(element) && !hasOverlaps(element)
  }

  // TODO: do something about scrolling

  // scroll the element to the center of the viewport when
  // it is not fully displayed in the viewport or is overlapped by another element
  // to check if it still overlapped/not in the viewport
  // afterwards we scroll back to the original position
  let _isFullyDisplayedInViewport = isFullyDisplayedInViewport(element)
  if (!_isFullyDisplayedInViewport) {
      const { x: originalX, y: originalY } = element.getBoundingClientRect()

      element.scrollIntoView(scrollIntoViewFullSupport ? { block: 'center', inline: 'center' } : false)

      _isFullyDisplayedInViewport = isFullyDisplayedInViewport(element)

      const { x, y } = element.getBoundingClientRect()
      if (x !== originalX || y !== originalY) {
          element.scroll(scrollX, scrollY)
      }
  }

  return _isFullyDisplayedInViewport && isEnabled(element as HTMLFormElement)
}
