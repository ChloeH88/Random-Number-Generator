export const MAX_COUNT = 1000;
export const MAX_OPTIONS = 100;

export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputError";
  }
}

function requireSafeInteger(value, label) {
  if (!Number.isSafeInteger(value)) {
    throw new InputError(`${label}必须是安全范围内的整数。`);
  }
}

function requireOptions(options) {
  if (!Array.isArray(options)) {
    throw new TypeError("随机选项必须使用数组。");
  }
  if (options.length < 1) {
    throw new InputError("至少需要保留一个随机选项。");
  }
  if (options.length > MAX_OPTIONS) {
    throw new InputError(`最多只能添加 ${MAX_OPTIONS} 个随机选项。`);
  }
}

function randomBigIntBelow(limit, cryptoProvider) {
  if (limit <= 0n) {
    throw new RangeError("Random limit must be positive.");
  }
  if (!cryptoProvider || typeof cryptoProvider.getRandomValues !== "function") {
    throw new Error("当前浏览器不支持安全随机数生成。");
  }

  const space = 1n << 64n;
  const cutoff = space - (space % limit);
  const words = new Uint32Array(2);

  while (true) {
    cryptoProvider.getRandomValues(words);
    const candidate = (BigInt(words[0]) << 32n) | BigInt(words[1]);
    if (candidate < cutoff) {
      return candidate % limit;
    }
  }
}

export function generateNumbers(
  minimum,
  maximum,
  count,
  allowDuplicates = true,
  cryptoProvider = globalThis.crypto,
) {
  requireSafeInteger(minimum, "最小值");
  requireSafeInteger(maximum, "最大值");
  requireSafeInteger(count, "生成数量");

  if (minimum > maximum) {
    throw new InputError("最小值不能大于最大值。");
  }
  if (count <= 0) {
    throw new InputError("生成数量必须是大于 0 的整数。");
  }
  if (count > MAX_COUNT) {
    throw new InputError(`一次最多生成 ${MAX_COUNT.toLocaleString("zh-CN")} 个数字。`);
  }

  const minimumBigInt = BigInt(minimum);
  const rangeSize = BigInt(maximum) - minimumBigInt + 1n;
  if (!allowDuplicates && BigInt(count) > rangeSize) {
    throw new InputError(
      `不允许重复时，生成数量不能超过区间内的 ${rangeSize.toString()} 个整数。`,
    );
  }

  if (allowDuplicates) {
    return Array.from({ length: count }, () =>
      Number(minimumBigInt + randomBigIntBelow(rangeSize, cryptoProvider)),
    );
  }

  // Partial Fisher-Yates sampling keeps memory use proportional to count.
  const swaps = new Map();
  const results = [];
  for (let index = 0n; index < BigInt(count); index += 1n) {
    const remaining = rangeSize - index;
    const randomIndex = randomBigIntBelow(remaining, cryptoProvider);
    const finalIndex = remaining - 1n;
    const selected = swaps.get(randomIndex) ?? randomIndex;
    const finalValue = swaps.get(finalIndex) ?? finalIndex;
    swaps.set(randomIndex, finalValue);
    swaps.delete(finalIndex);
    results.push(Number(minimumBigInt + selected));
  }
  return results;
}

export function parseIntegerInput(rawValue, label) {
  const value = String(rawValue).trim();
  if (!value) {
    throw new InputError(`请输入${label}。`);
  }
  if (!/^[+-]?\d+$/.test(value)) {
    throw new InputError(`${label}必须是整数。`);
  }

  const parsed = Number(value);
  requireSafeInteger(parsed, label);
  return parsed;
}

export function addOption(options) {
  requireOptions(options);
  if (options.length >= MAX_OPTIONS) {
    throw new InputError(`最多只能添加 ${MAX_OPTIONS} 个随机选项。`);
  }
  return [...options, ""];
}

export function removeOptionAt(options, index) {
  requireOptions(options);
  requireSafeInteger(index, "选项位置");
  if (index < 0 || index >= options.length) {
    throw new InputError("要删除的随机选项不存在。");
  }
  if (options.length === 1) {
    throw new InputError("至少需要保留一个随机选项。");
  }
  return options.filter((_, optionIndex) => optionIndex !== index);
}

export function resetOptions(options) {
  requireOptions(options);
  return [""];
}

export function formatOptionResults(numbers, options) {
  requireOptions(options);
  return numbers
    .map((number) => {
      requireSafeInteger(number, "选项编号");
      if (number < 1 || number > options.length) {
        throw new InputError("生成结果包含不存在的随机选项。");
      }
      const option = String(options[number - 1] ?? "").trim();
      return option ? `${number} — ${option}` : String(number);
    })
    .join("\n");
}
