import { generateNumbers, InputError, parseIntegerInput } from "./random-core.mjs";

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

let currentResult = "";

function showError(message) {
  errorOutput.textContent = message;
  errorOutput.hidden = false;
  statusOutput.textContent = "";
}

function clearError() {
  errorOutput.textContent = "";
  errorOutput.hidden = true;
}

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

    currentResult = numbers.join(", ");
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
