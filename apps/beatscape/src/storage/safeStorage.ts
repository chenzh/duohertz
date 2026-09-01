/**
 * localStorage / sessionStorage 的安全包装。
 *
 * 为什么要单独一层：Storage API 在好几种真实场景下都会抛异常 ——
 *   · Safari 隐私模式（以及 iOS 上的无痕标签页）setItem 直接抛 QuotaExceededError
 *   · 磁盘紧张 / 配额用满
 *   · 用户在浏览器设置里禁用了本站数据（此时访问 localStorage 本身就抛 SecurityError）
 *   · 第三方 iframe 里被策略拒绝
 *
 * 改造前代码里读的地方大多包了 try/catch，写的地方却基本裸奔（15 处 setItem）。
 * 最要命的一处在结算流程：`writeLastRun()` 里任何一次 setItem 抛异常，整段存档
 * 逻辑就断在半路 —— 玩家刚打完的成绩直接丢失，界面上还看不到任何提示。
 *
 * 这里的策略是：写入失败静默返回 false，让调用方继续走完流程；读取失败回退到
 * 默认值。存档丢失是遗憾，但把整页炸掉更糟。
 */

type Store = "local" | "session";

function store(kind: Store): Storage | null {
  try {
    // 仅仅是"访问"这个属性就可能抛（站点数据被禁用时），所以每次都兜住。
    return kind === "local" ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

export function readItem(key: string, kind: Store = "local"): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** 写入；返回是否成功。失败时静默 —— 调用方不需要因此中断流程。 */
export function writeItem(key: string, value: string, kind: Store = "local"): boolean {
  try {
    store(kind)?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string, kind: Store = "local"): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * 读 JSON。`validate` 用来把"能解析但结构不对"的数据挡在门外 —— 手改坏的
 * localStorage、或者旧版本留下的结构，都会走到这里回退成默认值。
 */
export function readJSON<T>(
  key: string,
  fallback: T,
  validate?: (v: unknown) => T | null,
  kind: Store = "local",
): T {
  const raw = readItem(key, kind);
  if (raw == null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate) return validate(parsed) ?? fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** 写 JSON；JSON.stringify 自身也可能抛（循环引用），所以一并兜住。 */
export function writeJSON(key: string, value: unknown, kind: Store = "local"): boolean {
  try {
    return writeItem(key, JSON.stringify(value), kind);
  } catch {
    return false;
  }
}

/** 是有限数字（挡掉 NaN / Infinity / 字符串 / undefined）。 */
export function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** 只接受字符串数组；结构不符就回退（避免后面 .includes() 炸掉）。 */
export function stringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string") out.push(item);
  }
  return out;
}
