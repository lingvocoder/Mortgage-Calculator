export default class Tooltip {
  static instance;
  element;

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }
    Tooltip.instance = this;
  }

  initEventListeners() {
    document.addEventListener("pointerover", this.onMouseOver);
    document.addEventListener("pointerout", this.onMouseOut);
  }

  removeEventListeners() {
    document.body.removeEventListener("pointerout", this.onMouseOut);
    document.body.removeEventListener("pointerover", this.onMouseOver);
  }

  initialize() {
    this.initEventListeners();
  }

  render(targetElem) {
    this.element = document.createElement("div");
    this.element.className = "m-tooltip";
    this.element.innerHTML = this.getTooltipTemplate(targetElem.dataset);
    document.body.append(this.element);
  }

  getTooltipTemplate({ date, principal, interest, monthlyPayment }) {
    return `<div>
                    <div class="m-tooltip__row">
                        <span class="m-tooltip__cell m-tooltip__cell_date">${date}</span>
                    </div>
                    <div class="m-tooltip__row">
                        <span class="m-tooltip__cell m-tooltip__cell_payment">Monthly payment:&nbsp;${monthlyPayment}</span>
                    </div>
                    <div class="m-tooltip__content">
                        <div class="m-tooltip__row">
                            <span class="m-tooltip__cell m-tooltip__cell_interest">Interest:&nbsp;${interest}</span>
                        </div>
                        <div class="m-tooltip__row">
                            <span class="m-tooltip__cell m-tooltip__cell_principal">Principal:&nbsp;${principal}</span>
                        </div>
                    </div>
                </div>
                `;
  }

  moveTooltip(event) {
    const left = event.clientX + 5;
    const top = event.clientY + 5;
    const chartBody = document.querySelector(".m-calculator__inner");
    const chartInner = document.querySelector(".payments-chart__inner");
    const chartBodyRect = chartBody.getBoundingClientRect();
    const chartInnerRect = chartInner.getBoundingClientRect();
    const tooltipRect = this.element.getBoundingClientRect();

    if (left + tooltipRect.width >= chartBodyRect.left + chartBodyRect.width) {
      this.element.style.top = `${top}px`;
      this.element.style.left = `${left - (tooltipRect.width + 10)}px`;
    } else {
      this.element.style.left = `${left}px`;
      this.element.style.top = `${top}px`;
    }
    if (
      top + tooltipRect.height >=
      chartInnerRect.top + chartInnerRect.height
    ) {
      this.element.style.top = `${top - (tooltipRect.height - 10)}px`;
    }
  }

  onMouseOver = (event) => {
    const targetElem = event.target.closest('[data-tooltip="true"]');

    if (targetElem) {
      this.render(targetElem);
      this.moveTooltip(event);
      targetElem.classList.add("is-hovered");
      targetElem.parentElement.classList.add("has-hovered");
      document.addEventListener("pointermove", this.onMouseMove);
    }
  };

  onMouseMove = (event) => {
    this.moveTooltip(event);
  };

  onMouseOut = (event) => {
    this.removeTooltip(event);
  };

  removeTooltip(event) {
    const targetElem = event.target.closest('[data-tooltip="true"]');
    if (targetElem) {
      if (targetElem.classList.contains("is-hovered")) {
        targetElem.classList.remove("is-hovered");
        targetElem.parentElement.classList.remove("has-hovered");
      }
    }
    if (this.element) {
      this.element.remove();
      this.element = null;

      document.removeEventListener("pointermove", this.onMouseMove);
    }
  }

  remove() {
    this.element.remove();
    this.removeEventListeners();
  }
}
