export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const isValidUsername = (value: string): boolean =>
	USERNAME_PATTERN.test(value);
