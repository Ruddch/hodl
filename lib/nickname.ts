/** Как на бэкенде (Pydantic validator). */
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 30;

export const NICKNAME_ERROR_LENGTH = "Nickname must be between 2 and 30 characters";
export const NICKNAME_ERROR_UNDERSCORE_EDGES = "Nickname cannot start or end with underscore";
export const NICKNAME_ERROR_CONsecutive_UNDERSCORES =
  "Nickname cannot contain consecutive underscores";
export const NICKNAME_ERROR_FORBIDDEN_CHARS = "Nickname contains forbidden characters";

export type NicknameValidationResult =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

/** Буква или цифра в смысле Unicode — эквивалент Python `char.isalnum()` (без `_`). */
function isUnicodeAlnumChar(char: string): boolean {
  return /^[\p{L}\p{N}]$/u.test(char);
}

/** Подпись запрещённого символа для сообщения пользователю. */
function describeForbiddenChar(char: string): string {
  const cp = char.codePointAt(0);
  if (cp === undefined) return char;
  const hex = `U+${cp.toString(16).toUpperCase()}`;

  switch (char) {
    case " ":
      return `space (${hex})`;
    case "\t":
      return `tab (${hex})`;
    case "\n":
    case "\r":
    case "\u2028":
    case "\u2029":
      return `line break (${hex})`;
    default:
      if (cp < 32 || cp === 127) return hex;
      if (char === '"' || char === "`" || char === "\\") return hex;
      return `"${char}" (${hex})`;
  }
}

/** Уникальные запрещённые символы в порядке первого появления. */
function collectForbiddenChars(nickname: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const char of nickname) {
    if (char === "_" || isUnicodeAlnumChar(char)) continue;
    if (seen.has(char)) continue;
    seen.add(char);
    out.push(char);
  }
  return out;
}

function formatForbiddenCharsError(nickname: string): string {
  const chars = collectForbiddenChars(nickname);
  const described = chars.map(describeForbiddenChar);
  return `${NICKNAME_ERROR_FORBIDDEN_CHARS}: ${described.join(", ")}`;
}

/** Удаляет невидимые и управляющие символы в любом месте (бэкенд их отклонит). */
function stripInvisibleAndControlChars(value: string): string {
  return value
    .replace(/\u200B|\uFEFF/gu, "")
    .replace(/\u00AD/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "");
}

/**
 * Очистка при вводе: убирает ZWSP, BOM, soft hyphen, управляющие ASCII.
 * Обычные пробелы и прочие символы не трогаем — их отсекает {@link validateNickname}.
 */
export function sanitizeNicknameInput(value: string): string {
  return stripInvisibleAndControlChars(value);
}

/** @deprecated используйте {@link sanitizeNicknameInput} */
export const stripNicknameWhitespace = sanitizeNicknameInput;

/**
 * Та же логика, что на бэкенде: `strip()`, длина 2–30, края не `_`, нет `__`,
 * только Unicode-буквы/цифры и одиночные `_`.
 */
export function validateNickname(value: string): NicknameValidationResult {
  const nickname = stripInvisibleAndControlChars(value).trim();

  if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
    return { ok: false, error: NICKNAME_ERROR_LENGTH };
  }

  if (nickname[0] === "_" || nickname[nickname.length - 1] === "_") {
    return { ok: false, error: NICKNAME_ERROR_UNDERSCORE_EDGES };
  }

  if (nickname.includes("__")) {
    return { ok: false, error: NICKNAME_ERROR_CONsecutive_UNDERSCORES };
  }

  const forbidden = collectForbiddenChars(nickname);
  if (forbidden.length > 0) {
    return { ok: false, error: formatForbiddenCharsError(nickname) };
  }

  return { ok: true, nickname };
}
