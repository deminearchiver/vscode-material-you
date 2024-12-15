import "./ripple.css";

class RippleController {
  public constructor(
    protected readonly host: HTMLElement,
  ) {}

  private _disabled = false;
  private _hovered = false;
  private _pressed = false;

  protected get disabled(): boolean {
    return this._disabled;
  }
  protected set disabled(value: boolean) {
    if(this._disabled != value) {
      this._disabled = value;
      this.host.classList.toggle("disabled", value);
    }
  }

  protected get hovered(): boolean {
    return this._hovered;
  }
  protected set hovered(value: boolean) {
    if(this._hovered != value) {
      this._hovered = value;
      this.host.classList.toggle("hovered", value);
    }
  }

  protected get pressed(): boolean {
    return this._pressed;
  }

  protected set pressed(value: boolean) {
    if(this._pressed != value) {
      this._pressed = value;
      this.host.classList.toggle("pressed", value);
    }
  }
}

const enum RippleState {
  INACTIVE,
  TOUCH_DELAY,
  HOLDING,
  WAITING_FOR_CLICK,
}
const PRESS_GROW_MS = 450;
const MINIMUM_PRESS_MS = 225;
const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_MINIMUM_SIZE = 75;
const SOFT_EDGE_CONTAINER_RATIO = 0.35;
const PRESS_PSEUDO = "::after";
const ANIMATION_FILL = "forwards";
const TOUCH_DELAY_MS = 150;

const FORCED_COLORS = window.matchMedia("(forced-colors: active)");

export class Ripple extends RippleController {
  public constructor(
    private readonly target: HTMLElement,
  ) {
    super(document.createElement("div"));
    this.host.classList.add("ripple");
  }

  private state = RippleState.INACTIVE;
  private rippleStartEvent?: PointerEvent;
  private checkBoundsAfterContextMenu = false;
  private growAnimation?: Animation;
  private rippleSize = "";
  private rippleScale = "";
  private initialSize = 0;
  private listeners?: (() => void)[];

  public attach() {
    this.target.appendChild(this.host);
    this.listeners = [
      this.listen(this.target, "click", this.onClick.bind(this)),
      this.listen(this.target, "pointerdown", this.onPointerDown.bind(this)),
      this.listen(this.target, "pointerup", this.onPointerUp.bind(this)),
      this.listen(this.target, "pointercancel", this.onPointerCancel.bind(this)),
      this.listen(this.target, "pointerenter", this.onPointerEnter.bind(this)),
      this.listen(this.target, "pointerleave", this.onPointerLeave.bind(this)),
      this.listen(this.target, "contextmenu", this.onContextMenu.bind(this)),
    ];
  }
  public detach() {
    this.listeners?.forEach(listener => listener());
    this.host.remove();
  }

  private listen<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    callback: (this: HTMLElement, event: HTMLElementEventMap[K]) => void
  ) {
    element.addEventListener(event, callback);
    return () => element.removeEventListener(event, callback);
  }

  private shouldReactToEvent(event: PointerEvent) {
    if (this.disabled || FORCED_COLORS.matches || !event.isPrimary) return false;

    if (
      this.rippleStartEvent &&
      this.rippleStartEvent.pointerId !== event.pointerId
    ) return false;

    if (event.type === "pointerenter" || event.type === "pointerleave") {
      return !this.isTouch(event);
    }

    const isPrimaryButton = event.buttons === 1;
    return this.isTouch(event) || isPrimaryButton;
  }

  private inBounds({ x, y }: PointerEvent) {
    const { top, left, bottom, right } = this.host.getBoundingClientRect();
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  private isTouch({ pointerType }: PointerEvent) {
    return pointerType === "touch";
  }

  private determineRippleSize() {
    const {height, width} = this.host.getBoundingClientRect();
    const maxDim = Math.max(height, width);
    const softEdgeSize = Math.max(
      SOFT_EDGE_CONTAINER_RATIO * maxDim,
      SOFT_EDGE_MINIMUM_SIZE,
    );

    const initialSize = Math.floor(maxDim * INITIAL_ORIGIN_SCALE);
    const hypotenuse = Math.sqrt(width ** 2 + height ** 2);
    const maxRadius = hypotenuse + PADDING;

    this.initialSize = initialSize;
    this.rippleScale = `${(maxRadius + softEdgeSize) / initialSize}`;
    this.rippleSize = `${initialSize}px`;
  }

  private getNormalizedPointerEventCoords(pointerEvent: PointerEvent): {
    x: number;
    y: number;
  } {
    const {scrollX, scrollY} = window;
    const {left, top} = this.host.getBoundingClientRect();
    const documentX = scrollX + left;
    const documentY = scrollY + top;
    const {pageX, pageY} = pointerEvent;
    return {x: pageX - documentX, y: pageY - documentY};
  }

  private getTranslationCoordinates(positionEvent?: Event) {
    const {height, width} = this.host.getBoundingClientRect();
    // end in the center
    const endPoint = {
      x: (width - this.initialSize) / 2,
      y: (height - this.initialSize) / 2,
    };

    let startPoint;
    if (positionEvent instanceof PointerEvent) {
      startPoint = this.getNormalizedPointerEventCoords(positionEvent);
    } else {
      startPoint = {
        x: width / 2,
        y: height / 2,
      };
    }

    // center around start point
    startPoint = {
      x: startPoint.x - this.initialSize / 2,
      y: startPoint.y - this.initialSize / 2,
    };

    return {startPoint, endPoint};
  }

  private startPressAnimation(positionEvent?: Event) {
    this.pressed = true;
    this.growAnimation?.cancel();
    this.determineRippleSize();
    const {startPoint, endPoint} =
      this.getTranslationCoordinates(positionEvent);
    const translateStart = `${startPoint.x}px, ${startPoint.y}px`;
    const translateEnd = `${endPoint.x}px, ${endPoint.y}px`;

    this.growAnimation = this.host.animate(
      {
        top: [0, 0],
        left: [0, 0],
        height: [this.rippleSize, this.rippleSize],
        width: [this.rippleSize, this.rippleSize],
        transform: [
          `translate(${translateStart}) scale(1)`,
          `translate(${translateEnd}) scale(${this.rippleScale})`,
        ],
      },
      {
        pseudoElement: PRESS_PSEUDO,
        duration: PRESS_GROW_MS,
        // easing: EASING.STANDARD,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
        fill: ANIMATION_FILL,
      },
    );
  }

  private async endPressAnimation() {
    this.rippleStartEvent = undefined;
    this.state = RippleState.INACTIVE;
    const animation = this.growAnimation;
    let pressAnimationPlayState = Infinity;
    if (typeof animation?.currentTime === "number") {
      pressAnimationPlayState = animation.currentTime;
    } else if (animation?.currentTime) {
      pressAnimationPlayState = animation.currentTime.to("ms").value;
    }

    if (pressAnimationPlayState >= MINIMUM_PRESS_MS) {
      this.pressed = false;
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, MINIMUM_PRESS_MS - pressAnimationPlayState);
    });

    if (this.growAnimation !== animation) {
      // A new press animation was started. The old animation was canceled and
      // should not finish the pressed state.
      return;
    }

    this.pressed = false;
  }


  private onClick() {
    // Click is a MouseEvent in Firefox and Safari, so we cannot use
    // `shouldReactToEvent`
    if (this.disabled) return;

    if (this.state === RippleState.WAITING_FOR_CLICK) {
      this.endPressAnimation();
    } else if(this.state === RippleState.INACTIVE) {
      this.startPressAnimation();
      this.endPressAnimation();
    }
  }

  private async onPointerDown(event: PointerEvent) {
    if(!this.shouldReactToEvent(event)) return;

    this.rippleStartEvent = event;
    if (!this.isTouch(event)) {
      this.state = RippleState.WAITING_FOR_CLICK;
      this.startPressAnimation(event);
      return;
    }

    if (this.checkBoundsAfterContextMenu && !this.inBounds(event)) {
      return;
    }

    this.checkBoundsAfterContextMenu = false;

    // Wait for a hold after touch delay
    this.state = RippleState.TOUCH_DELAY;
    await new Promise((resolve) => {
      setTimeout(resolve, TOUCH_DELAY_MS);
    });

    if (this.state !== RippleState.TOUCH_DELAY) {
      return;
    }

    this.state = RippleState.HOLDING;
    this.startPressAnimation(event);
  }

  private onPointerUp(event: PointerEvent) {
    if(!this.shouldReactToEvent(event)) return;

    if(this.state === RippleState.HOLDING) {
      this.state = RippleState.WAITING_FOR_CLICK;
    } else if(this.state === RippleState.TOUCH_DELAY) {
      this.state = RippleState.WAITING_FOR_CLICK;
      this.startPressAnimation(this.rippleStartEvent);
    }
  }

  private onPointerCancel(event: PointerEvent) {
    if(!this.shouldReactToEvent(event)) return;
    this.endPressAnimation();
  }

  private onPointerEnter(event: PointerEvent) {
    if(!this.shouldReactToEvent(event)) return;
    this.hovered = true;
  }

  private onPointerLeave(event: PointerEvent) {
    if(!this.shouldReactToEvent(event)) return;

    this.hovered = false;
    if (this.state !== RippleState.INACTIVE) {
      this.endPressAnimation();
    }
  }

  private onContextMenu() {
    if (this.disabled) return;
    this.checkBoundsAfterContextMenu = true;
    this.endPressAnimation();
  }
}
