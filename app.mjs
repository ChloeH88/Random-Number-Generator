import {
  addOption,
  formatOptionResults,
  generateNumbers,
  InputError,
  MAX_OPTIONS,
  parseIntegerInput,
  removeOptionAt,
  resetOptions,
} from "./random-core.mjs";

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

const integerForm = document.querySelector("#integer-form");
const integerMinimumInput = document.querySelector("#integer-minimum");
const integerMaximumInput = document.querySelector("#integer-maximum");
const integerCountInput = document.querySelector("#integer-count");
const integerAllowDuplicatesInput = document.querySelector("#integer-allow-duplicates");
const integerGenerateButton = document.querySelector("#integer-generate-button");
const integerResultOutput = document.querySelector("#integer-result");
const integerCopyButton = document.querySelector("#integer-copy-button");
const integerErrorOutput = document.querySelector("#integer-error");
const integerStatusOutput = document.querySelector("#integer-status");

const optionForm = document.querySelector("#option-form");
const optionList = document.querySelector("#option-list");
const optionAddButton = document.querySelector("#option-add-button");
const optionResetButton = document.querySelector("#option-reset-button");
const optionCountInput = document.querySelector("#option-count");
const optionAllowDuplicatesInput = document.querySelector("#option-allow-duplicates");
const optionGenerateButton = document.querySelector("#option-generate-button");
const optionResultOutput = document.querySelector("#option-result");
const optionCopyButton = document.querySelector("#option-copy-button");
const optionErrorOutput = document.querySelector("#option-error");
const optionStatusOutput = document.querySelector("#option-status");

let options = [""];
let integerCurrentResult = "";
let optionCurrentResult = "";

function setActiveTab(activeTab, moveFocus = false) {
  for (const tab of tabs) {
    const isActive = tab === activeTab;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    document.querySelector(`#${tab.getAttribute("aria-controls")}`).hidden = !isActive;
  }
  if (moveFocus) activeTab.focus();
}

for (const tab of tabs) {
  tab.addEventListener("click", () => setActiveTab(tab));
  tab.addEventListener("keydown", (event) => {
    const currentIndex = tabs.indexOf(tab);
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    setActiveTab(tabs[nextIndex], true);
  });
}

function showError(errorOutput, statusOutput, message) {
  errorOutput.textContent = message;
  errorOutput.hidden = false;
  statusOutput.textContent = "";
}

function clearError(errorOutput) {
  errorOutput.textContent = "";
  errorOutput.hidden = true;
}

function errorMessage(error, fallback) {
  if (error instanceof InputError || error instanceof Error) return error.message;
  return fallback;
}

function syncOptionButtons() {
  optionResetButton.disabled = options.length === 1 && options[0].length === 0;
  optionAddButton.disabled = options.length >= MAX_OPTIONS;
}

function renderOptions(focusIndex = null) {
  const fragment = document.createDocumentFragment();

  options.forEach((option, index) => {
    const row = document.createElement("div");
    row.className = "option-row";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-option-button";
    removeButton.dataset.index = String(index);
    removeButton.setAttribute("aria-label", `删除选项 ${index + 1}`);
    removeButton.textContent = "−";
    removeButton.disabled = options.length === 1;

    const number = document.createElement("span");
    number.className = "option-number";
    number.textContent = String(index + 1);
    number.setAttribute("aria-hidden", "true");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "option-input";
    input.dataset.index = String(index);
    input.value = option;
    input.autocomplete = "off";
    input.placeholder = `填写选项 ${index + 1}`;
    input.setAttribute("aria-label", `随机选项 ${index + 1}`);

    row.append(removeButton, number, input);
    fragment.append(row);
  });

  optionList.replaceChildren(fragment);
  syncOptionButtons();
  if (focusIndex !== null) {
    optionList.querySelector(`.option-input[data-index="${focusIndex}"]`)?.focus();
  }
}

optionList.addEventListener("input", (event) => {
  const input = event.target.closest(".option-input");
  if (!input) return;
  options[Number(input.dataset.index)] = input.value;
  syncOptionButtons();
});

optionList.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-option-button");
  if (!button || button.disabled) return;

  clearError(optionErrorOutput);
  try {
    const removedIndex = Number(button.dataset.index);
    options = removeOptionAt(options, removedIndex);
    renderOptions(Math.min(removedIndex, options.length - 1));
    optionStatusOutput.textContent = `已删除选项，当前共 ${options.length} 个`;
  } catch (error) {
    showError(optionErrorOutput, optionStatusOutput, errorMessage(error, "无法删除选项。"));
  }
});

optionAddButton.addEventListener("click", () => {
  clearError(optionErrorOutput);
  try {
    options = addOption(options);
    renderOptions(options.length - 1);
    optionStatusOutput.textContent = `已添加选项，当前共 ${options.length} 个`;
  } catch (error) {
    showError(optionErrorOutput, optionStatusOutput, errorMessage(error, "无法添加选项。"));
  }
});

optionResetButton.addEventListener("click", () => {
  if (optionResetButton.disabled) return;
  if (!window.confirm("确定要重置为一个空白选项吗？")) return;

  options = resetOptions(options);
  renderOptions();
  clearError(optionErrorOutput);
  optionStatusOutput.textContent = "随机选项已重置";
});

integerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError(integerErrorOutput);
  integerGenerateButton.disabled = true;

  try {
    const minimum = parseIntegerInput(integerMinimumInput.value, "最小值");
    const maximum = parseIntegerInput(integerMaximumInput.value, "最大值");
    const count = parseIntegerInput(integerCountInput.value, "生成数量");
    const numbers = generateNumbers(
      minimum,
      maximum,
      count,
      integerAllowDuplicatesInput.checked,
    );

    integerCurrentResult = numbers.join("\n");
    integerResultOutput.textContent = integerCurrentResult;
    integerResultOutput.classList.remove("empty");
    integerCopyButton.disabled = false;
    integerStatusOutput.textContent = `已生成 ${numbers.length} 个随机整数`;
  } catch (error) {
    showError(integerErrorOutput, integerStatusOutput, errorMessage(error, "生成时发生未知错误。"));
  } finally {
    integerGenerateButton.disabled = false;
  }
});

optionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError(optionErrorOutput);
  optionGenerateButton.disabled = true;

  try {
    const count = parseIntegerInput(optionCountInput.value, "生成数量");
    const allowDuplicates = optionAllowDuplicatesInput.checked;
    if (!allowDuplicates && count > options.length) {
      throw new InputError(`不允许重复时，生成数量不能超过当前的 ${options.length} 个选项。`);
    }
    const numbers = generateNumbers(1, options.length, count, allowDuplicates);

    optionCurrentResult = formatOptionResults(numbers, options);
    optionResultOutput.textContent = optionCurrentResult;
    optionResultOutput.classList.remove("empty");
    optionCopyButton.disabled = false;
    optionStatusOutput.textContent = `已生成 ${numbers.length} 个随机选项`;
  } catch (error) {
    showError(optionErrorOutput, optionStatusOutput, errorMessage(error, "生成时发生未知错误。"));
  } finally {
    optionGenerateButton.disabled = false;
  }
});

async function copyWithFallback(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporary = document.createElement("textarea");
  temporary.value = text;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.opacity = "0";
  document.body.append(temporary);
  temporary.select();
  const copied = document.execCommand("copy");
  temporary.remove();
  if (!copied) throw new Error("无法访问剪贴板。");
}

function bindCopyButton(button, getResult, errorOutput, statusOutput) {
  button.addEventListener("click", async () => {
    const result = getResult();
    if (!result) return;
    clearError(errorOutput);
    try {
      await copyWithFallback(result);
      statusOutput.textContent = "结果已复制到剪贴板";
    } catch {
      showError(errorOutput, statusOutput, "复制失败，请长按结果手动复制。");
    }
  });
}

bindCopyButton(integerCopyButton, () => integerCurrentResult, integerErrorOutput, integerStatusOutput);
bindCopyButton(optionCopyButton, () => optionCurrentResult, optionErrorOutput, optionStatusOutput);

window.addEventListener("online", () => {
  for (const output of [integerStatusOutput, optionStatusOutput]) output.textContent = "已恢复网络连接";
});

window.addEventListener("offline", () => {
  for (const output of [integerStatusOutput, optionStatusOutput]) {
    output.textContent = "已进入离线模式，仍可正常使用";
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works online when service-worker registration fails.
    });
  });
}

renderOptions();
