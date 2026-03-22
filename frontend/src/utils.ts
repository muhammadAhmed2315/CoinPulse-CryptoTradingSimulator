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

function isLetter(char: string) {
  return (char.length === 1 && isUppercase(char)) || isLowercase(char);
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

export function validatePasswordRule(password: string, rule: string) {
  return PASSWORD_RULES.some((x) => x.label === rule && x.test(password));
}

//=====
export const USERNAME_RULES = [
  { label: "At least 3 characters", test: (p: string) => p.length >= 3 },
  {
    label: "No more than 20 characters",
    test: (p: string) => p.length > 0 && p.length <= 20,
  },
  {
    label: "First character must be a letter",
    test: (p: string) => (p.length > 0 ? isLetter(p.at(0)!) : false),
  },
  {
    label: "Only letters and numbers",
    test: (p: string) =>
      p.length > 0 && [...p].every((c) => isLetter(c) || isDigit(c)),
  },
];

export function validateUsername(username: string) {
  return USERNAME_RULES.filter((rule) => !rule.test(username)).map(
    (rule) => rule.label,
  );
}

export function validateUsernameRule(username: string, rule: string) {
  return USERNAME_RULES.some((x) => x.label === rule && x.test(username));
}
