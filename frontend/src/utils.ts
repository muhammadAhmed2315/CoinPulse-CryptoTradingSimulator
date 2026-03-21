// =====

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =====
export function formatTime(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}

//=====
// prettier-ignore
const PASSWORD_ALLOWED_SPECIAL_CHARS = [
    "~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", 
    "_", "+", "=", "{", "}", "[", "]", "|", "\\", ";", ":", '"', "<", 
    ">", ",", ".", "/?", "/",
];

function isUppercase(char: string) {
  return (
    char.length === 1 &&
    char === char.toUpperCase() &&
    char !== char.toLowerCase()
  );
}

function isLowercase(char: string) {
  return (
    char.length === 1 &&
    char === char.toLowerCase() &&
    char !== char.toUpperCase()
  );
}

function isDigit(char: string) {
  return char.length === 1 && char >= "0" && char <= "9";
}

function isSpecialChar(char: string) {
  return (
    char.length === 1 && PASSWORD_ALLOWED_SPECIAL_CHARS.some((x) => x === char)
  );
}

export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  {
    label: "At least one uppercase letter",
    test: (p: string) => [...p].some(isUppercase),
  },
  {
    label: "At least one lowercase letter",
    test: (p: string) => [...p].some(isLowercase),
  },
  { label: "At least one number", test: (p: string) => [...p].some(isDigit) },
  {
    label: "At least one special character",
    test: (p: string) => [...p].some(isSpecialChar),
  },
];

export function validatePassword(password: string) {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.label,
  );
}
