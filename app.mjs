import {
  buildNoteNumbers,
  formatResults,
  generateNumbers,
  InputError,
  MAX_NOTE_ITEMS,
  parseIntegerInput,
} from "./random-core.mjs";

const form = document.querySelector("#generator-form");
const minimumInput = document.querySelector("#minimum");
const maximumInput = document.querySelector("#maximum");
const countInput = document.querySelector("#count");
const allowDuplicatesInput = document.querySelector("#allow-duplicates");
const resultOutput = document.querySelector("#result");
const statusOutput = document.querySelector("#status");
const errorOutput = document.querySelector("#error");
const copyButton = document.querySelector("#copy-button");
const generateButton = document.querySelector("#generate-button");
const noteList = document.querySelector("#note-list");
const noteMessage = document.querySelector("#note-message");

let currentResult = "";
const notes = new Map();

function showError(message) {
  errorOutput.textContent = message;
  errorOutput.hidden = false;
  statusOutput.textContent = "";
}

function clearError() {
  errorOutput.textContent = "";
  errorOutput.hidden = true;
}

function showNoteMessage(message) {
  noteList.replaceChildren();
  noteMessage.textContent = message;
  noteMessage.hidden = false;
}

function rebuildNoteInputs() {
  notes.clear();
  noteMessage.hidden = true;
  noteMessage.textContent = "";
  noteList.replaceChildren();

  let minimum;
  let maximum;
  try {
    minimum = parseIntegerInput(minimumInput.value, "最小值");
    maximum = parseIntegerInput(maximumInput.value, "最大值");
  } catch {
    showNoteMessage("输入有效的最小值和最大值后，即可添加备注。");
    return;
  }

  let noteNumbers;
  try {
    noteNumbers = buildNoteNumbers(minimum, maximum);
  } catch (error) {
    showNoteMessage(error instanceof Error ? error.message : "无法创建备注列表。");
    return;
  }

  if (noteNumbers.length === 0) {
    showNoteMessage(
      `备注最多支持 ${MAX_NOTE_ITEMS} 个连续整数。你仍可正常生成纯数字结果。`,
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const number of noteNumbers) {
    const row = document.createElement("label");
    row.className = "note-row";

    const numberLabel = document.createElement("span");
    numberLabel.className = "note-number";
    numberLabel.textContent = String(number);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "note-input";
    input.dataset.number = String(number);
    input.autocomplete = "off";
    input.placeholder = `填写 ${number} 对应的选项`;
    input.setAttribute("aria-label", `数字 ${number} 的备注`);

    row.append(numberLabel, input);
    fragment.append(row);
  }
  noteList.append(fragment);
}

noteList.addEventListener("input", (event) => {
  const input = event.target.closest(".note-input");
  if (!input) return;

  const number = Number(input.dataset.number);
  if (input.value.trim()) {
    notes.set(number, input.value);
  } else {
    notes.delete(number);
  }
});

minimumInput.addEventListener("input", rebuildNoteInputs);
maximumInput.addEventListener("input", rebuildNoteInputs);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();
  generateButton.disabled = true;

  try {
    const minimum = parseIntegerInput(minimumInput.value, "最小值");
    const maximum = parseIntegerInput(maximumInput.value, "最大值");
    const count = parseIntegerInput(countInput.value, "生成数量");
    const numbers = generateNumbers(
      minimum,
      maximum,
      count,
      allowDuplicatesInput.checked,
    );

    currentResult = formatResults(numbers, notes);
    resultOutput.textContent = currentResult;
    resultOutput.classList.remove("empty");
    copyButton.disabled = false;
    statusOutput.textContent = `已生成 ${numbers.length} 个随机整数`;
  } catch (error) {
    if (error instanceof InputError) {
      showError(error.message);
    } else {
      showError(error instanceof Error ? error.message : "生成时发生未知错误。");
    }
  } finally {
    generateButton.disabled = false;
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
  if (!copied) {
    throw new Error("无法访问剪贴板。");
  }
}

copyButton.addEventListener("click", async () => {
  if (!currentResult) return;

  clearError();
  try {
    await copyWithFallback(currentResult);
    statusOutput.textContent = "结果已复制到剪贴板";
  } catch {
    showError("复制失败，请长按结果手动复制。");
  }
});

window.addEventListener("online", () => {
  statusOutput.textContent = "已恢复网络连接";
});

window.addEventListener("offline", () => {
  statusOutput.textContent = "已进入离线模式，仍可正常生成数字";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The generator still works online when service-worker registration fails.
    });
  });
}

rebuildNoteInputs();
