import { formatNumber, roundNumber } from "../../scripts/helpers/main.js";
import Tooltip from "../toolTip/main.js";

export class PaymentChart {
  chartHeight = 200;
  subElements = {};

  constructor(title = "", { data = [] } = {}) {
    this.data = data;
    this.title = title;
    this.render();
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener("DOMContentLoaded", this.removeLoadingClass);
  }

  removeLoadingClass = async () => {
    const body = document.body || document.documentElement;
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
    };

    function waitForElem(selector) {
      const chartContainer = document.querySelector(`${selector}`);

      const observer = new MutationObserver(() => {
        if (chartContainer) {
          observer.disconnect();
        }
      });
      observer.observe(body, config);
      return chartContainer;
    }

    const chartContainer = waitForElem(".payments-chart__container");
    chartContainer.classList.remove("payments-chart_loading");
  };

  ontoggleLoadingClass(data) {
    const chartContainer = document.querySelector(".payments-chart__container");
    const isDataAvailable =
      data.filter((o) => o.monthlyPayment !== 0).length !== 0;

    if (isDataAvailable) {
      chartContainer.classList.remove("payments-chart_loading");
    } else {
      chartContainer.classList.add("payments-chart_loading");
    }
  }

  get template() {
    return `
            <div class="m-calculator__inner">
                <div class="payments-chart_loading payments-chart__container" style="--chart-height: ${
                  this.chartHeight
                }">
                    <div class="payments-chart__title">${this.title}</div>
                        <div class="payments-chart__inner">
                            <div data-element="body" class="payments-chart__body">${this.getColumnBody(
                              this.data
                            )}</div>
                        </div>
                    </div>
                    <div class="payments-chart__details">
                        <div class="payments-chart__point-wrapper">
                            <span class="payments-chart__term">
                                Interest
                            </span>
                            <span class="payments-chart__definition payments-chart__definition_interest"></span>
                            <span class="payments-chart__term">
                                Principal
                            </span>
                            <span class="payments-chart__definition payments-chart__definition_principal"></span>
                        </div>
                    </div>
                </div>
            </div>
            `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);
  }

  getColumnBody(data) {
    const toolTip = new Tooltip();
    const paymentData = data;
    toolTip.initialize();
    setTimeout(() => this.ontoggleLoadingClass(paymentData), 0);

    const maxValue = Math.max(...data.map((o) => o.principal + o.interestPaid));
    const scale = this.chartHeight / maxValue;
    return data
      .map(({ date, interestPaid, principal, locale, monthlyPayment }) => {
        return `
                <div data-tooltip="true" class="payments-chart__bar-wrapper" data-date="${date}" data-principal="${formatNumber(
          principal,
          locale
        )}" data-interest="${formatNumber(
          interestPaid,
          locale
        )}" data-monthly-payment="${formatNumber(monthlyPayment, locale)}">
                            <div class="payments-chart__bar payments-chart__bar_interest" style="--value: 
                                    ${roundNumber(
                                      interestPaid * scale,
                                      2
                                    )}" data-value="${interestPaid}">
                            </div>
                            <div class="payments-chart__bar payments-chart__bar_principal" style="--value: 
                                    ${roundNumber(
                                      principal * scale,
                                      2
                                    )}" data-value="${principal}">        
                            </div>
                        </div>
                        `;
      })
      .join("");
  }

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll("[data-element]");

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }
    return result;
  }

  update(data) {
    this.subElements.body.innerHTML = this.getColumnBody(data);
  }

  remove() {
    this.element.remove();
  }
}
