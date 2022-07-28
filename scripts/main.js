const currency = (name) => {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1") + "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
};

import {
  addPercentSymbol,
  calculateProgressValue,
  formatDate,
  debounce,
  formatNumber,
  getAttributeObject,
  getDomNodes,
  getInputAttribute,
  getInputFields,
  getObjectFromArray,
  pluralize,
  roundNumber,
  setInputAttribute,
  setInputValue,
} from "./helpers/main.js";
import AmortizationTable from "../amortizationTable/main.js";
import PaymentChart from "../chart/main.js";

export default class MortgageCalculator {
  activeMortgageCalc = {
    chart: undefined,
    amortizationTable: undefined,
  };

  constructor({
    loanAmount = 0,
    downPayment = 0,
    interestRate = 0,
    loanTerm = 0,
  }) {
    this.loanAmount = loanAmount;
    this.downPayment = downPayment;
    this.interestRate = interestRate;
    this.loanTerm = loanTerm;
    this.minMaxRange = [
      {
        currency: "AED",
        min: 300000,
        max: 50000000,
      },
      {
        currency: "USD",
        min: 750000,
        max: 150000000,
      },
    ];
    this.currency = "USD";
    this.currencyArray = [
      {
        locale: "ar-AE",
        currency: "AED",
        symbol: "AED",
      },
      {
        locale: "de-DE",
        currency: "EUR",
        symbol: "€",
      },
      {
        locale: "en-US",
        currency: "USD",
        symbol: "$",
      },
    ];
    this.locale =
      getObjectFromArray(this.currencyArray, "currency", this.currency)
        .locale || "en-US";
    this.init();
    this.initEventListeners();
  }

  init() {
    this.setLoanAmountMinMaxAttr();
    this.setRangeInputValues();
    this.setInterestRate();
    this.setLoanAmount();
    this.setDownPayment();
    this.setLoanTerm();
    this.addCurrencySymbol();
    this.onValidateInputHandle();
    this.generateChart();
  }

  initEventListeners() {
    document.addEventListener(
      "DOMContentLoaded",
      this.reCalculateOutputPercent
    );
    document.addEventListener("DOMContentLoaded", this.handleCalculations);
    document.addEventListener("DOMContentLoaded", this.onOpenButtonClick);
    document.addEventListener("DOMContentLoaded", this.onLoanAmountChange);
    document.addEventListener("DOMContentLoaded", this.onLoanTermChange);
    document.addEventListener("DOMContentLoaded", this.onInterestRateChange);
    document.addEventListener("DOMContentLoaded", this.onDownPaymentChange);
  }

  setLoanAmountMinMaxAttr = () => {
    const loanAmountRange = document.querySelector("#loanAmountRange");
    const currency = this.currency;
    const { min = 750000, max = 150000000 } = getObjectFromArray(
      this.minMaxRange,
      "currency",
      currency
    );

    switch (currency) {
      case "USD":
        setInputAttribute(loanAmountRange, "min", min);
        setInputAttribute(loanAmountRange, "max", max);
        break;
      case "AED":
        setInputAttribute(loanAmountRange, "min", min);
        setInputAttribute(loanAmountRange, "max", max);
        break;
      default:
        setInputAttribute(loanAmountRange, "min", min);
        setInputAttribute(loanAmountRange, "max", max);
    }
  };

  setLoanAmount = () => {
    const loanAmount = document.querySelector("#loanAmount");
    setInputValue(loanAmount, this.loanAmount);
    this.setLoanAmountMinMax();
  };

  setDownPayment = () => {
    const downPayment = document.querySelector("#downPayment");
    setInputAttribute(downPayment, "value", this.downPayment);
    this.setDownPaymentMinMax();
  };

  setLoanTerm = () => {
    const loanPeriod = document.querySelector("#loanTerm");
    setInputValue(loanPeriod, this.loanTerm);
    this.setLoanTermMinMax();
  };

  setInterestRate = () => {
    const interestRate = document.querySelector("#interestRate");
    setInputValue(interestRate, this.interestRate);
    setInputAttribute(interestRate,'value',this.interestRate);
    this.setInterestRateMinMax();
  };

  setInterestRateMinMax = () => {
    const nodes = getDomNodes("#interestRateMinMax");
    const interestRateRange = document.querySelector("#interestRateRange");
    const min = getInputAttribute(interestRateRange, "min");
    const max = getInputAttribute(interestRateRange, "max");
    nodes.forEach((node) => {
      node.classList.contains("interestRateMin")
        ? (node.textContent = `${addPercentSymbol(min)}`)
        : "";
      node.classList.contains("interestRateMax")
        ? (node.textContent = `${addPercentSymbol(max)}`)
        : "";
    });
  };

  setLoanTermMinMax = () => {
    const nodes = getDomNodes("#loanTermMinMax");
    const loanPeriodRange = document.querySelector("#loanTermRange");
    const min = getInputAttribute(loanPeriodRange, "min");
    const max = getInputAttribute(loanPeriodRange, "max");
    nodes.forEach((node) => {
      node.classList.contains("loanTermMin")
        ? (node.textContent = pluralize(min, "year"))
        : "";
      node.classList.contains("loanTermMax")
        ? (node.textContent = pluralize(max, "year"))
        : "";
    });
  };

  setLoanAmountMinMax = () => {
    const nodes = getDomNodes("#loanAmountMinMax");
    const loanAmountRange = document.querySelector("#loanAmountRange");
    const min = getInputAttribute(loanAmountRange, "min");
    const max = getInputAttribute(loanAmountRange, "max");
    const options = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
    nodes.forEach((node) => {
      node.classList.contains("loanAmountMin")
        ? (node.textContent = formatNumber(min, this.locale, options))
        : "";
      node.classList.contains("loanAmountMax")
        ? (node.textContent = formatNumber(max, this.locale, options))
        : "";
    });
  };

  setDownPaymentMinMax = () => {
    const nodes = getDomNodes("#downPaymentMinMax");
    const loanAmount = document.querySelector("input[type='text']#loanAmount");
    const downPaymentRange = document.querySelector("#downPaymentRange");
    const loanAmountValue = parseInt(loanAmount.value);
    const max = getInputAttribute(downPaymentRange, "max");
    const min = getInputAttribute(downPaymentRange, "min");
    const options = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
    const downPaymentMinValue = (parseInt(min) * loanAmountValue) / 100;
    const downPaymentMaxValue = (parseInt(max) * loanAmountValue) / 100;
    nodes.forEach((node) => {
      node.classList.contains("downPaymentMin")
        ? (node.textContent = formatNumber(
            downPaymentMinValue,
            this.locale,
            options
          ))
        : "";
      node.classList.contains("downPaymentMax")
        ? (node.textContent = formatNumber(
            downPaymentMaxValue,
            this.locale,
            options
          ))
        : "";
    });
  };

  setRangeInputValues = () => {
    const rangeInputArray = getInputFields("range");
    const textInputArray = getInputFields("text");
    rangeInputArray.forEach((ri) => {
      let ti = textInputArray.find((ti) => ti.name === ri.name);
      setInputValue(ri, ti.value);
      this.calculateProgressBarValue(ri);
    });
  };

  addCurrencySymbol = () => {
    let { currency } = getObjectFromArray(
      this.currencyArray,
      "currency",
      this.currency
    );
    const nodes = document.querySelectorAll(".m-calculator__symbol.currency");
    nodes.forEach((node) => {
      node.textContent = currency;
    });
  };

  reCalculateOutputPercent = () => {
    const downPaymentOutput = document.querySelector(".m-calculator__readings");
    const loanAmount = document.querySelector("input[type='text']#loanAmount");
    const downPayment = document.querySelector(
      "input[type='text']#downPayment"
    );
    const downPaymentRange = document.querySelector(
      "input[type='range']#downPaymentRange"
    );
    let downPaymentRangeCurrent = downPaymentRange.value;

    let textContentValue = "0";
    if (!isNaN(parseFloat(downPaymentRangeCurrent))) {
      textContentValue = `${downPaymentRangeCurrent}`;
    }
    downPaymentOutput.textContent = addPercentSymbol(textContentValue);

    const loanAmountValue = parseFloat(loanAmount.value) || 0;
    const downPaymentValue = (downPaymentRangeCurrent * loanAmountValue) / 100;
    setInputValue(downPayment, downPaymentValue);
  };

  calculateProgressBarValue = (rangeInput) => {
    const progressBar = rangeInput.parentElement.nextElementSibling;
    let progressValue = 0;
    if (!rangeInput) return;
    const { max, min } = [...rangeInput.attributes].reduce((obj, attr) => {
      obj[attr.name] = attr.value;
      return obj;
    }, {});
    progressValue = calculateProgressValue(rangeInput.value, max, min);
    setInputAttribute(progressBar, "value", progressValue);
  };

  onLoanAmountChange = () => {
    const loanAmountRange = document.querySelector("#loanAmountRange");
    const loanAmount = document.querySelector("#loanAmount");
    const controlBox = document.querySelector("#loanAmountControl");
    loanAmountRange.addEventListener(
      "input",
      this.onLoanAmountRangeChangeHandle
    );
    loanAmount.addEventListener("input", this.onLoanAmountTextChangeHandle);
    controlBox.addEventListener("click", this.onLoanAmountControlHandle);
  };

  onLoanAmountControlHandle = (ev) => {
    const targetCtrl = ev.target.closest(
      '.m-calculator__sign[data-name="loanAmount"]'
    );
    if (!targetCtrl) return;
    const { name, operation } = targetCtrl.dataset;
    const direction = operation === "increase" ? 1 : -1;
    const loanAmountRange =
      targetCtrl.parentElement.parentElement.nextElementSibling.querySelector(
        `input[name="${name}"]`
      );
    const loanAmount = document.querySelector(`#${name}`);

    const currValue = loanAmount.value;
    const { step } = getAttributeObject(loanAmountRange);

    let currentValueFloat = parseFloat(currValue);
    const resValue = currentValueFloat + parseFloat(step) * direction;
    setInputValue(loanAmount, resValue);
    const event = new Event("input");
    loanAmount.dispatchEvent(event);
  };

  onLoanAmountRangeChangeHandle = (ev) => {
    const loanAmount = document.querySelector("#loanAmount");
    const textInputArray = getInputFields("text");
    setInputValue(loanAmount, ev.target.value);
    this.reCalculateOutputPercent();
    this.calculateProgressBarValue(ev.target);
    this.setDownPaymentMinMax();
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onLoanAmountTextChangeHandle = (ev) => {
    const loanAmountRange = document.querySelector("#loanAmountRange");
    const increaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="loanAmount"][data-operation="increase"]'
    );
    const decreaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="loanAmount"][data-operation="decrease"]'
    );
    const { min, max } = getAttributeObject(loanAmountRange);

    const textInputArray = getInputFields("text");
    setInputValue(loanAmountRange, ev.target.value);

    if (parseFloat(ev.target.value) <= parseFloat(min)) {
      decreaseBtn.classList.add("m-calculator__sign_disabled");
      decreaseBtn.disabled = !decreaseBtn.disabled;
    } else {
      decreaseBtn.classList.remove("m-calculator__sign_disabled");
      decreaseBtn.disabled = false;
    }
    if (parseFloat(ev.target.value) >= parseFloat(max)) {
      increaseBtn.classList.add("m-calculator__sign_disabled");
      increaseBtn.disabled = !increaseBtn.disabled;
    } else {
      increaseBtn.classList.remove("m-calculator__sign_disabled");
      increaseBtn.disabled = false;
    }
    this.reCalculateOutputPercent();
    this.calculateProgressBarValue(loanAmountRange);
    this.setDownPaymentMinMax();
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onLoanTermChange = () => {
    const loanTermRange = document.querySelector("#loanTermRange");
    const loanTerm = document.querySelector("#loanTerm");
    const controlBox = document.querySelector("#loanTermControl");
    loanTermRange.addEventListener("input", this.onLoanTermRangeChangeHandle);
    loanTerm.addEventListener("input", this.onLoanTermTextChangeHandle);
    controlBox.addEventListener("click", this.onLoanTermControlHandle);
  };

  onLoanTermControlHandle = (ev) => {
    const targetCtrl = ev.target.closest(
      '.m-calculator__sign[data-name="loanTerm"]'
    );
    const increaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="loanTerm"][data-operation="increase"]'
    );
    const decreaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="loanTerm"][data-operation="decrease"]'
    );

    if (!targetCtrl) return;
    const { name, operation } = targetCtrl.dataset;
    const direction = operation === "increase" ? 1 : -1;
    const loanTermRange =
      targetCtrl.parentElement.parentElement.nextElementSibling.querySelector(
        `input[name="${name}"]`
      );
    const loanTerm = document.querySelector(`#${name}`);
    const { min, max, step } = getAttributeObject(loanTermRange);
    const currValue = loanTerm.value;
    let currentValueFloat = parseFloat(currValue);

    const resValue = currentValueFloat + parseFloat(step) * direction;
    setInputValue(loanTerm, resValue);

    if (resValue < min) {
      decreaseBtn.classList.add("m-calculator__sign_disabled");
      decreaseBtn.disabled = !decreaseBtn.disabled;
    } else if (resValue > max) {
      increaseBtn.classList.add("m-calculator__sign_disabled");
      increaseBtn.disabled = !increaseBtn.disabled;
    } else {
      decreaseBtn.classList.remove("m-calculator__sign_disabled");
      decreaseBtn.disabled = false;
      increaseBtn.classList.remove("m-calculator__sign_disabled");
      increaseBtn.disabled = false;
    }
    const event = new Event("input");
    loanTerm.dispatchEvent(event);
  };

  onLoanTermRangeChangeHandle = (ev) => {
    const loanTerm = document.querySelector("#loanTerm");
    const textInputArray = getInputFields("text");
    setInputValue(loanTerm, ev.target.value);
    this.calculateProgressBarValue(ev.target);
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onLoanTermTextChangeHandle = (ev) => {
    const loanTermRange = document.querySelector("#loanTermRange");
    const textInputArray = getInputFields("text");
    const increaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="loanTerm"][data-operation="increase"]'
    );
    const decreaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="loanTerm"][data-operation="decrease"]'
    );
    const { min, max } = getAttributeObject(loanTermRange);
    setInputValue(loanTermRange, ev.target.value);

    if (parseFloat(ev.target.value) <= parseFloat(min)) {
      decreaseBtn.classList.add("m-calculator__sign_disabled");
      decreaseBtn.disabled = !decreaseBtn.disabled;
    } else {
      decreaseBtn.classList.remove("m-calculator__sign_disabled");
      decreaseBtn.disabled = false;
    }
    if (parseFloat(ev.target.value) >= parseFloat(max)) {
      increaseBtn.classList.add("m-calculator__sign_disabled");
      increaseBtn.disabled = !increaseBtn.disabled;
    } else {
      increaseBtn.classList.remove("m-calculator__sign_disabled");
      increaseBtn.disabled = false;
    }
    this.calculateProgressBarValue(loanTermRange);
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onInterestRateChange = () => {
    const interestRateRange = document.querySelector("#interestRateRange");
    const interestRate = document.querySelector("#interestRate");
    const controlBox = document.querySelector("#interestRateControl");

    interestRateRange.addEventListener(
      "input",
      this.onInterestRateRangeChangeHandle
    );
    interestRate.addEventListener(
      "change",
      this.onInterestRateTextChangeHandle
    );
    controlBox.addEventListener("click", this.onInterestRateControlHandle);
  };

  onInterestRateControlHandle = (ev) => {
    const targetCtrl = ev.target.closest(
      '.m-calculator__sign[data-name="interestRate"]'
    );
    if (!targetCtrl) return;
    const { name, operation } = targetCtrl.dataset;
    const direction = operation === "increase" ? 1 : -1;
    const interestRateRange =
      targetCtrl.parentElement.parentElement.nextElementSibling.querySelector(
        `input[name="${name}"]`
      );
    const interestRate = document.querySelector(`#${name}`);

    const { step } = getAttributeObject(interestRateRange);

    let currentValueFloat = parseFloat(interestRate.value);
    const resValue = currentValueFloat + parseFloat(step) * direction;
    setInputValue(interestRate, roundNumber(resValue, 2));
    const event = new Event("change");
    interestRate.dispatchEvent(event);
  };

  onInterestRateRangeChangeHandle = (ev) => {
    const interestRate = document.querySelector("#interestRate");
    const textInputArray = getInputFields("text");
    setInputValue(interestRate, ev.target.value);
    this.calculateProgressBarValue(ev.target);
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onInterestRateTextChangeHandle = (ev) => {
    const interestRateRange = document.querySelector("#interestRateRange");
    const increaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="interestRate"][data-operation="increase"]'
    );
    const decreaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="interestRate"][data-operation="decrease"]'
    );
    const { min, max } = getAttributeObject(interestRateRange);

    const textInputArray = getInputFields("text");
    setInputValue(interestRateRange, ev.target.value);
    if (parseFloat(ev.target.value) <= parseFloat(min)) {
      decreaseBtn.classList.add("m-calculator__sign_disabled");
      decreaseBtn.disabled = !decreaseBtn.disabled;
    } else {
      decreaseBtn.classList.remove("m-calculator__sign_disabled");
      decreaseBtn.disabled = false;
    }
    if (parseFloat(ev.target.value) >= parseFloat(max)) {
      increaseBtn.classList.add("m-calculator__sign_disabled");
      increaseBtn.disabled = !increaseBtn.disabled;
    } else {
      increaseBtn.classList.remove("m-calculator__sign_disabled");
      increaseBtn.disabled = false;
    }
    this.calculateProgressBarValue(interestRateRange);
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onDownPaymentChange = () => {
    const downPaymentRange = document.querySelector("#downPaymentRange");
    const downPayment = document.querySelector("#downPayment");
    const controlBox = document.querySelector("#downPaymentControl");

    downPaymentRange.addEventListener(
      "input",
      this.onDownPaymentRangeChangeHandle
    );
    downPayment.addEventListener("input", this.onDownPaymentTextChangeHandle);
    controlBox.addEventListener("click", this.onDownPaymentControlHandle);
  };

  onDownPaymentControlHandle = (ev) => {
    const targetCtrl = ev.target.closest(
      '.m-calculator__sign[data-name="downPayment"]'
    );
    if (!targetCtrl) return;
    const { name, operation } = targetCtrl.dataset;
    const direction = operation === "increase" ? 1 : -1;
    const downPaymentRange =
      targetCtrl.parentElement.parentElement.nextElementSibling.querySelector(
        `input[name="${name}"]`
      );
    const downPayment = document.querySelector(`#${name}`);
    const loanAmount = document.querySelector("input[type='text']#loanAmount");

    const { step } = getAttributeObject(downPaymentRange);

    let currentValueFloat = parseFloat(downPayment.value);
    const loanAmountValue = parseFloat(loanAmount.value) || 0;
    const downPaymentValue = (step / 100) * loanAmountValue;

    const resValue = currentValueFloat + downPaymentValue * direction;
    setInputValue(downPayment, resValue);
    const event = new Event("input");
    downPayment.dispatchEvent(event);
  };

  onDownPaymentRangeChangeHandle = (ev) => {
    const textInputArray = getInputFields("text");
    this.reCalculateOutputPercent();
    this.calculateProgressBarValue(ev.target);
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onDownPaymentTextChangeHandle = (ev) => {
    const downPaymentOutput = document.querySelector(".m-calculator__readings");
    const loanAmount = document.querySelector("input[type='text']#loanAmount");
    const increaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="downPayment"][data-operation="increase"]'
    );
    const decreaseBtn = document.querySelector(
      '.m-calculator__sign[data-name="downPayment"][data-operation="decrease"]'
    );
    const downPaymentRange = document.querySelector(
      "input[type='range']#downPaymentRange"
    );
    let downPaymentTextCurrent = ev.target.value;
    const loanAmountValue = parseFloat(loanAmount.value) || 0;

    const downPaymentValue = (downPaymentTextCurrent / loanAmountValue) * 100;
    let textContentValue = "0";
    if (!isNaN(parseFloat(downPaymentTextCurrent))) {
      textContentValue = `${downPaymentValue}`;
    }

    setInputValue(downPaymentRange, downPaymentValue);

    downPaymentOutput.textContent = addPercentSymbol(
      roundNumber(parseFloat(textContentValue), 0)
    );

    const textInputArray = getInputFields("text");
    this.calculateProgressBarValue(downPaymentRange);
    this.onInputChangeCalculationsHandle(textInputArray);
  };

  onInputChangeCalculationsHandle = (arr) => {
    const paymentObj = this.createPaymentObject(arr);
    const monthlyPayment = this.calculateMonthlyMortgagePayment(paymentObj);
    const paymentData = this.getPaymentObjects();
    this.insertCalculatedValues(monthlyPayment);
    this.activeMortgageCalc.chart.update(paymentData);
  };

  createPaymentObject = (inputArray) => {
    return [...inputArray].reduce((obj, input) => {
      let inputValueFloat;
      if (input.name === "downPayment") {
        inputValueFloat = document.querySelector("#downPayment").value;
      } else {
        inputValueFloat = parseFloat(input.value);
      }
      obj[input.name] = inputValueFloat;
      obj.locale = this.locale;
      return obj;
    }, {});
  };

  calculateMonthlyMortgagePayment = ({
    locale = "en-US",
    loanAmount = 0,
    interestRate = 0,
    downPayment = 0,
    loanTerm = 0,
  }) => {
    const principal = loanAmount - downPayment;
    const rateDecimal = interestRate / 100;
    const monthlyInterestRate = rateDecimal === 0 ? 0 : rateDecimal / 12;
    const numberOfMonthlyPayments = loanTerm * 12;
    let monthlyPayment = 0;
    if (monthlyInterestRate > 0 && rateDecimal > 0 && loanTerm > 0) {
      monthlyPayment =
        (principal *
          monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, numberOfMonthlyPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfMonthlyPayments) - 1);
    }

    return {
      principal,
      loanTerm,
      interestRate,
      monthlyPayment,
      locale,
    };
  };

  handleCalculations = () => {
    const textInputArray = getInputFields("text");
    const paymentObj = this.createPaymentObject(textInputArray);
    const monthlyPayment = this.calculateMonthlyMortgagePayment(paymentObj);
    this.insertCalculatedValues(monthlyPayment);
  };

  insertCalculatedValues = (paymentObject) => {
    const outputNodes = [
      ...document.querySelectorAll(".m-calculator__output[data-type]"),
    ];
    outputNodes.forEach((node) => {
      const { type } = node.dataset;
      for (const [key, value] of Object.entries(paymentObject)) {
        if (type === key) {
          switch (type) {
            case "principal":
              node.textContent = formatNumber(value, this.locale);
              break;
            case "monthlyPayment":
              node.textContent = formatNumber(value, this.locale);
              break;
            case "interestRate":
              node.textContent = addPercentSymbol(value);
              break;
            case "loanTerm":
              node.textContent = pluralize(value, "year");
              break;
          }
        }
      }
    });
  };

  onValidateInputHandle = () => {
    const textInputArray = getInputFields("text");

    textInputArray.forEach((ti) =>
      ti.addEventListener("change", this.validateInput)
    );
    textInputArray.forEach((ti) =>
      ti.addEventListener("paste", (ev) => ev.preventDefault())
    );
  };

  validateInput(ev) {
    const target = ev.target;
    const ti = target.closest(".m-calculator__input");
    const ri = getInputFields("range").find((ri) => ri.name === ti.name);

    let key = ev.keyCode || ev.which;
    key = String.fromCharCode(key);
    const regExp = /\d|\./;
    if (!regExp.test(key)) {
      ev.preventDefault();
    }

    if (ti.name === "interestRate") {
      let isValid = false;
      let currValue = ti.value;
      let currentValueFloat = parseFloat(currValue);

      if (currValue.length > 0 && currValue.charAt(0) === "0") {
        currValue = currValue.substring(1);
      }

      if (isNaN(currentValueFloat) || currentValueFloat <= parseFloat(ri.min)) {
        setInputValue(ti, ri.min);
      } else if (currentValueFloat > parseFloat(ri.max)) {
        setInputValue(ti, ri.max);
      } else {
        let dotIdx = currValue.indexOf(".") === -1 ? 0 : currValue.indexOf(".");
        if (dotIdx > 0 && dotIdx < currValue.length - 2) {
          currentValueFloat = currentValueFloat
            .toString(10)
            .slice(0, dotIdx + 3);
          setInputValue(ti, currentValueFloat);
        } else {
          isValid = true;
          setInputValue(ti, currValue);
        }
      }
      return isValid;
    }

    if (ti.name === "loanAmount") {
      let isValid = false;
      let currValue = ti.value;
      let currentValueFloat = parseFloat(currValue);

      if (currValue.length > 0 && currValue.charAt(0) === "0") {
        currValue = currValue.substring(1);
      }

      if (isNaN(currentValueFloat) || currentValueFloat < 0) {
        setInputValue(ti, 0);
      } else if (currentValueFloat > parseFloat(ri.max)) {
        setInputValue(ti, ri.max);
      } else {
        let dotIdx = currValue.indexOf(".") === -1 ? 0 : currValue.indexOf(".");
        if (dotIdx > 0) {
          currentValueFloat = currentValueFloat.toFixed(0);
          setInputValue(ti, currentValueFloat);
        } else {
          isValid = true;
          setInputValue(ti, currValue);
        }
      }
      return isValid;
    }

    if (ti.name === "downPayment") {
      const downPaymentRange = document.querySelector("#downPaymentRange");
      const loanAmount = document.querySelector(
        "input[type='text']#loanAmount"
      );
      const loanAmountValue = parseInt(loanAmount.value);
      const max = getInputAttribute(downPaymentRange, "max");
      const downPaymentMaxValue = (parseInt(max) * loanAmountValue) / 100;

      let currValue = ti.value;
      let currentValueFloat = parseFloat(currValue);
      let isValid = false;

      if (currValue.length > 0 && currValue.charAt(0) === "0") {
        currValue = currValue.substring(1);
      }

      if (isNaN(currentValueFloat) || currentValueFloat < 0) {
        setInputValue(ti, 0);
      } else if (currentValueFloat > downPaymentMaxValue) {
        setInputValue(ti, downPaymentMaxValue);
      } else {
        let dotIdx = currValue.indexOf(".") === -1 ? 0 : currValue.indexOf(".");
        if (dotIdx > 0) {
          currentValueFloat = currentValueFloat.toFixed(0);
          setInputValue(ti, currentValueFloat);
        } else {
          let isValid = false;
          setInputValue(ti, currValue);
        }
      }
      return isValid;
    }

    if (ti.name === "loanTerm") {
      let currValue = ti.value;
      let currentValueFloat = parseFloat(currValue);
      let isValid = false;

      if (currValue.length > 0 && currValue.charAt(0) === "0") {
        currValue = currValue.substring(1);
      }

      if (isNaN(currentValueFloat) || currentValueFloat < 0) {
        setInputValue(ti, 0);
      } else if (currentValueFloat > parseFloat(ri.max)) {
        setInputValue(ti, ri.max);
      } else {
        let dotIdx = currValue.indexOf(".") === -1 ? 0 : currValue.indexOf(".");
        if (dotIdx > 0) {
          currentValueFloat = currentValueFloat.toFixed(0);
          setInputValue(ti, currentValueFloat);
        } else {
          let isValid = true;
          setInputValue(ti, currValue);
        }
      }
      return isValid;
    }
  }

  onOpenButtonClick = () => {
    const openBtn = document.querySelector(".m-calculator__btn_schedule");
    openBtn.addEventListener("click", () => {
      const paymentData = this.getPaymentObjects();
      const amortizationTable = new AmortizationTable(
        "Monthly Amortization Schedule",
        { data: paymentData }
      );
      document.body.append(amortizationTable.element);
    });
  };

  generateChart = () => {
    const paymentData = this.getPaymentObjects();
    const chartContainer = document.querySelector("#paymentChart");
    if (this.activeMortgageCalc.chart) return;
    const chart = new PaymentChart("Monthly Amortization Schedule", {
      data: paymentData,
    });
    chartContainer.append(chart.element);
    this.activeMortgageCalc.chart = chart;
  };

  getPaymentObjects = () => {
    const textInputArray = getInputFields("text");
    const paymentObjArray = [];
    const paymentObj = this.createPaymentObject(textInputArray);
    const monthlyPayment = this.calculateMonthlyMortgagePayment(paymentObj);

    function generatePaymentObjArray(paymentObj) {
      const { principal, monthlyPayment, interestRate, loanTerm, locale } =
        paymentObj;
      let currBalance = principal;
      let currDate = new Date();
      let monthCounter = 1;
      let numberOfMonths = loanTerm * 12;

      while (numberOfMonths > 0) {
        let payment = {
          date: 0,
          monthlyPayment: 0,
          principal: 0,
          interestPaid: 0,
          balance: 0,
          locale: locale,
        };

        const interestsPaid = (interestRate / 12 / 100) * currBalance;
        const principal = monthlyPayment - interestsPaid;
        currBalance -= principal;
        if (currBalance < 0) currBalance = 0;

        for (let key of Object.keys(payment)) {
          switch (key) {
            case "date":
              payment[key] = formatDate(currDate, monthCounter);
              break;
            case "monthlyPayment":
              payment[key] = roundNumber(monthlyPayment, 5);
              break;
            case "principal":
              payment[key] = roundNumber(principal, 5);
              break;
            case "interestPaid":
              payment[key] = roundNumber(interestsPaid, 5);
              break;
            case "balance":
              payment[key] = roundNumber(currBalance, 5);
              break;
          }
        }
        paymentObjArray.push(payment);
        numberOfMonths--;
        monthCounter++;
      }
      return paymentObjArray;
    }

    return generatePaymentObjArray(monthlyPayment);
  };
}

// if (currentValueFloat > 1) {
//   currValue = currValue.substring(1);
// } else {
//   currValue = "0" + currValue.substring(1);
// }
