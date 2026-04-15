export const partialNameValidator = (name: string) => /^[A-Za-z]+$/.test(name);

// Email address format validator: handle -> literal @ -> domain name -> literal '.' -> TLD:
export const emailAddressFormatValidator = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Username validator: at least 3 chars, at least one letter. No other character types apart from letters, numbers, and underscores:
export const usernameValidator = (username: string) =>
  /^(?=.*[a-zA-Z])[a-zA-Z0-9_]{3,}$/.test(username);

// Password validator: min 8 characters, at least one lowercase letter, at least one uppercase letter, at least one number, at least one special character: !, @, #, $, %, ^, &, *, (, ), _
export const passwordValidator = (password: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

// Organization name validator: Only letters, numbers, apostrophes, hyphens, and periods allowed. At least one letter mandatory. No consecutive special characters:
export const organizationNameValidator = (orgName: string) =>
  /^(?=.*[A-Za-z])[A-Za-z0-9](?:[A-Za-z0-9]|[.'-](?=[A-Za-z0-9]))*$/.test(orgName);
