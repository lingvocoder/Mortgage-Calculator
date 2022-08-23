import { formatNumber } from "../../scripts/helpers/main.js";
import amortizationTableHeaderConfig from "./config.js";

export default class AmortizationTable {
  element;
  static activeTable;

  constructor(title = "", { data = [] } = {}) {
    this.headerConfig = amortizationTableHeaderConfig;
    this.title = title;
    this.data = data;
    this.render();
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener("click", this.onCloseBtnClick);
    document.addEventListener("click", this.onMoveUpBtnClick);
    document.addEventListener("click", this.saveAsPdf);
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTable(this.data);
    this.element = element.firstElementChild;
  }

  getTableHeader() {
    return `
                <thead class="payments__t-header">
                    <tr class="payments__t-row">
                        ${this.headerConfig
                          .map((item) => this.getHeaderCell(item))
                          .join("")}    
                    </tr>
                </thead>`;
  }

  getHeaderCell({ id, title }) {
    return `
               <th scope="col" class="payments__t-header-cell" data-id="${id}">${title}</th>
                `;
  }

  getTableRow(paymentObj, idx) {
    const { locale, date, template } = paymentObj;
    const regExp = new RegExp(/\D+/);
    date.replace(regExp, "");
    const counter = idx % 2 === 0 ? "even" : "odd";
    const itemEntries = Object.entries(paymentObj).filter(
      (e) =>
        !e.includes("locale") &&
        !e.includes("template") &&
        !e.includes("totalLoanAmount")
    );
    return `
                <tr data-num="${counter}" data-curryear="${date}" class="payments__t-row">
                    ${itemEntries
                      .map(([key, value]) => {
                        return this.getTableCell([key, value], locale);
                      })
                      .join("")}
                </tr>
                ${template}
            `;
  }

  getTableRows(data) {
    return data
      .map((item, idx) => {
        return `${this.getTableRow(item, idx)}`;
      })
      .join("");
  }

  getTableCell([key, value], locale) {
    const formattedValue = key === "date" ? value : formatNumber(value, locale);
    return `
        <td class="payments__t-body-cell" data-id="${key}">${formattedValue}</td>
        `;
  }

  getTableBody(data) {
    return `
                <tbody class="payments__t-body">
                      ${this.getTableRows(data)}
                </tbody>`;
  }

  saveAsPdf = async () => {
    const body = document.body || document.documentElement;
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
    };

    function waitForElem(selector) {
      const downloadButton = document.querySelector(`${selector}`);
      return new Promise((resolve) => {
        if (downloadButton) {
          return resolve(downloadButton);
        }

        const observer = new MutationObserver(() => {
          if (downloadButton) {
            resolve(downloadButton);
            observer.disconnect();
          }
        });
        observer.observe(body, config);
      });
    }

    document.removeEventListener("click", this.saveAsPdf);
    const download = await waitForElem(".m-calculator__btn_download");
    const downloadMobile = await waitForElem(".payments__button_download");
    download.addEventListener("click", convertToPDF);
    downloadMobile.addEventListener("click", convertToPDF);

    function convertToPDF() {
      const doc = new jsPDF();
      const totalPagesExp = "{total_pages_count_string}";
      doc.text("Amortization Table", 18, 14);

      doc.autoTable({
        html: ".payments__details",
        theme: "plain",
        startY: 25,
        tableWidth: 80,
        valign: "middle",

        bodyStyles: {
          fillColor: [249, 250, 251],

          cellPadding: {
            left: 4,
            top: 3,
            bottom: 3,
          },
        },
      });

      doc.autoTable({
        didParseCell: function (data) {
          if (data.row.section === "body" && data.cell.colSpan === 5) {
            data.cell.styles.fillColor = [14, 36, 48];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.halign = "center";
            data.cell.styles.cellPadding = {
              left: 4,
              top: 2,
              bottom: 2,
              right: 4,
            };
          }
        },

        didDrawPage: function (data) {
          let str = "Page " + doc.internal.getNumberOfPages();
          if (typeof doc.putTotalPages === "function") {
            str = str + " of " + totalPagesExp;
          }
          doc.setFontSize(9);

          let pageSize = doc.internal.pageSize;
          let pageHeight = pageSize.height
            ? pageSize.height
            : pageSize.getHeight();
          doc.text(str, data.settings.margin.left, pageHeight - 10);

          if (typeof doc.putTotalPages === "function") {
            doc.putTotalPages(totalPagesExp);
          }
        },

        html: ".payments__table",
        startY: 80,
        headStyles: {
          cellPadding: 4,
          fillColor: [2, 178, 238],
        },
        bodyStyles: {
          cellPadding: 4,
        },
        styles: {
          font: "helvetica",
          fontStyle: "normal",
          fontSize: 10,
          halign: "left",
        },
      });
      doc.save("table.pdf");
    }
  };

  getDoughnut(data) {
    const interestPaid = "interestPaid";
    const monthlyPayment = "monthlyPayment";
    const localeName = "locale";
    const totalAmount = "totalLoanAmount";
    const circumference = Math.PI * 2 * 12;
    const locale = data[data.length - 1][localeName];
    const totalLoanAmount = data[data.length - 1][totalAmount];
    const totalInterest = data
      .map((item) => item[interestPaid])
      .reduce((curr, next) => curr + next);
    const totalPayments = data
      .map((item) => item[monthlyPayment])
      .reduce((curr, next) => curr + next);
    const percentageFilledInterest = totalInterest / totalPayments;
    const percentageFilledTotalPayments =
      (totalPayments - totalInterest) / totalPayments;
    let absoluteFieldInterest = circumference * percentageFilledInterest;
    let absoluteFieldTotalPayments =
      circumference * percentageFilledTotalPayments;

    return `
            <figure class="payments__doughnut">
                 <div class="payments__doughnut-wrapper">
                    <svg aria-label="Amortization schedule chart" class="payments__doughnut-chart" role="img" viewBox="0 0 36 36" aria-labelledby="chart-title chart-desc">
                        <title id="chart-title">Amortization schedule doughnut chart</title>
                        <desc id="chart-desc">Doghnut chart showing 2 segments. The one with ID principal stands for total loan amount, the one with ID interest stands for total interest paid.</desc>
                        <circle  cx="18" cy="18" id="principal" r="12" fill="transparent" stroke="#02B2EEFF" stroke-dasharray="${absoluteFieldTotalPayments} ${circumference}" stroke-dashoffset="-${absoluteFieldInterest}" stroke-width="8"></circle>
                        <circle  cx="18" cy="18" id="interest" r="12" fill="transparent" stroke="#06D6A0FF" stroke-dasharray="${absoluteFieldInterest} ${circumference}" stroke-dashoffset="0" stroke-width="8"></circle>
                        </svg>
                 </div>
                 <figcaption class="payments__doughnut-details" role="presentation">
                    <div class="payments__doughnut-row payments__doughnut-row_principal">
                        <span class="payments__term">Total Loan Amount</span>
                        <span class="payments__definition">${formatNumber(
                          totalLoanAmount,
                          locale
                        )}</span>
                    </div>
                    <div class="payments__doughnut-row payments__doughnut-row_interest">
                        <span class="payments__term">Total Interest Paid</span>
                        <span class="payments__definition">${formatNumber(
                          totalInterest,
                          locale
                        )}</span>
                    </div>   
                 </figcaption>
            </figure>
    `;
  }

  getResTable(data) {
    const locale = data[data.length - 1]["locale"];
    const date = data[data.length - 1]["date"];
    const totalInterest = data
      .map((item) => item["interestPaid"])
      .reduce((curr, next) => curr + next);
    const totalPayments = data
      .map((item) => item["monthlyPayment"])
      .reduce((curr, next) => curr + next);
    const monthlyPayment = data[data.length - 1]["monthlyPayment"];

    return `
                <table class="payments__details">
                    <tbody>
                        <tr class="payments__point-wrapper">
                            <td class="payments__term">Loan Payoff Date:</td>
                            <td class="payments__definition">${date}</td>
                        </tr>
                        <tr class="payments__point-wrapper">
                             <td class="payments__term">Monthly Payment Amount:</td>
                             <td class="payments__definition">${formatNumber(
                               monthlyPayment,
                               locale
                             )}</td>
                        </tr>
                        <tr class="payments__point-wrapper">
                              <td class="payments__term">Total Interest Paid:</td>
                              <td class="payments__definition">${formatNumber(
                                totalInterest,
                                locale
                              )}</td>
                        </tr>
                        <tr class="payments__point-wrapper">
                               <td class="payments__term">Total of ${
                                 data.length
                               } Payments:</td>
                               <td class="payments__definition">${formatNumber(
                                 totalPayments,
                                 locale
                               )}</td>
                        </tr>
                    </tbody>
                </table>
                `;
  }

  getTable(data) {
    return `
                      <div class="payments__modal" role="dialog">
                        <div class="payments__modal_inner">
                            <div class="payments__underlay"></div>
                                <div class="payments__modal_bg">
                                <h2 class="payments__title">${this.title}</h2>
                                <div class="payments__visual">
                                    ${this.getResTable(data)}
                                    ${this.getDoughnut(data)}
                                </div>
                                <div class="m-calculator__btn-group">
                                    <button class="m-calculator__btn m-calculator__btn_download" type="button" value="Download file">
                                        <span class="m-calculator__icon-wrapper">
                                            <img class="m-calculator__icon" src="../../assets/icons/download.svg" alt="download">
                                        </span>
                                        <span class="m-calculator__btn-text m-calculator__btn-text">Download Schedule</span>
                                    </button>
                                </div>
                                    <div class="payments__row payments__row_close">
                                        <button type="button" class="payments__button payments__button_close">
                                            <svg class="payments__icon payments__icon_close" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2 12L12 2M2 2L12 12" stroke="#0e2430" stroke-width="1.5" stroke-linecap="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div class="payments__content">
                                        <table class="payments__table">
                                            ${this.getTableHeader()}
                                            ${this.getTableBody(data)}
                                        </table>
                                    </div>
                                    <div class="payments__row payments__row_up">
                                        <span class="payments__disclaimer">&ast;The above calculation is approximate, for more accurate information, please contact the Bank</span>
                                        <button type="button" class="payments__button payments__button_download"  value="Download file">
                                            <svg class="payments__icon payments__icon_download" xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 384 512">
                                                <path d="M384 128h-128V0L384 128zM256 160H384v304c0 26.51-21.49 48-48 48h-288C21.49 512 0 490.5 0 464v-416C0 21.49 21.49 0 48 0H224l.0039 128C224 145.7 238.3 160 256 160zM255 295L216 334.1V232c0-13.25-10.75-24-24-24S168 218.8 168 232v102.1L128.1 295C124.3 290.3 118.2 288 112 288S99.72 290.3 95.03 295c-9.375 9.375-9.375 24.56 0 33.94l80 80c9.375 9.375 24.56 9.375 33.94 0l80-80c9.375-9.375 9.375-24.56 0-33.94S264.4 285.7 255 295z"/>
                                            </svg>
                                        </button>
                                        <button type="button" class="payments__button payments__button_up" value="Move up">
                                            <svg class="payments__icon payments__icon_up" xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 1024 1024">
                                                <path d="m877.254 402.746-320-320c-24.992-24.994-65.514-24.994-90.508 0l-320 320c-24.994 24.994-24.994 65.516 0 90.51 24.994 24.996 65.516 24.996 90.51 0L448 282.51V896c0 35.346 28.654 64 64 64s64-28.654 64-64V282.51l210.746 210.746C799.242 505.752 815.622 512 832 512s32.758-6.248 45.254-18.746c24.994-24.994 24.994-65.514 0-90.508z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </div>
                    `;
  }

  onCloseBtnClick = (ev) => {
    const target = ev.target;
    const closeBtn = target.closest(".payments__button_close");
    if (!closeBtn) return;
    this.destroy();
  };

  onMoveUpBtnClick = (ev) => {
    const target = ev.target;
    const closeBtn = target.closest(".payments__button_up");
    const tableTop = document.querySelector(".payments__modal");
    if (!closeBtn) return;
    tableTop.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    AmortizationTable.activeTable = null;
  }
}
