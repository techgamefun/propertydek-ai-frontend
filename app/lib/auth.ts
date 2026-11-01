import { notifyToast } from "./toast";

export type RegistrationField = "fullName" | "email" | "password" | "phone" | "avatar";

export type RegistrationValues = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  avatar: File | null;
};

export type LoginField = "email" | "password";

export type LoginValues = {
  email: string;
  password: string;
};

type AuthField = RegistrationField | LoginField;
type AuthFieldErrors = Partial<Record<AuthField, string>>;
type AuthErrorFactory = (
  message: string,
  fields?: AuthFieldErrors,
) => Error;

type AuthResponse = {
  success?: boolean;
  data?: {
    user?: {
      id?: string;
      email?: string;
      fullName?: string;
      phone?: string | null;
      avatarUrl?: string | null;
      createdAt?: string;
    };
  };
  error?: {
    message?: string;
    fields?: AuthFieldErrors;
  };
};

export class RegistrationError extends Error {
  fields: AuthFieldErrors;

  constructor(message: string, fields: AuthFieldErrors = {}) {
    super(message);
    this.name = "RegistrationError";
    this.fields = fields;
  }
}

export class LoginError extends Error {
  fields: AuthFieldErrors;

  constructor(message: string, fields: AuthFieldErrors = {}) {
    super(message);
    this.name = "LoginError";
    this.fields = fields;
  }
}

export async function registerUser(values: RegistrationValues) {
  const body = new FormData();
  body.set("fullName", values.fullName);
  body.set("email", values.email);
  body.set("password", values.password);
  body.set("phone", values.phone);
  if (values.avatar) {
    body.set("avatar", values.avatar);
  }

  const result = await postAuthRequest(
    "/api/auth/register",
    body,
    (message, fields) => new RegistrationError(message, fields),
  );

  if (!result.success || !result.data?.user) {
    notifyToast(
      "error",
      "The authentication service returned an unreadable response. Please try again.",
    );
    throw new RegistrationError(
      "The authentication service returned an unreadable response. Please try again.",
    );
  }

  notifyToast("success", "Your account was created successfully.");
  return result.data.user;
}

export async function loginUser(values: LoginValues) {
  const result = await postAuthRequest(
    "/api/auth/login",
    JSON.stringify(values),
    (message, fields) => new LoginError(message, fields),
  );

  if (!result.success || !result.data?.user) {
    notifyToast(
      "error",
      "The authentication service returned an unreadable response. Please try again.",
    );
    throw new LoginError(
      "The authentication service returned an unreadable response. Please try again.",
    );
  }

  notifyToast("success", "Signed in successfully.");
  return result.data.user;
}

export async function logoutUser() {
  let response: Response;
  try {
    response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    const message =
      "We couldn't connect to the authentication service. Please try again in a moment.";
    notifyToast("error", message);
    throw new LoginError(message);
  }

  if (!response.ok) {
    const message = "We couldn't sign you out. Please try again.";
    notifyToast("error", message);
    throw new LoginError(message);
  }
  notifyToast("success", "Signed out successfully.");
}

async function postAuthRequest(
  url: string,
  body: BodyInit,
  createError: AuthErrorFactory,
) {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      ...(typeof body === "string"
        ? { headers: { "Content-Type": "application/json" } }
        : {}),
      body,
      credentials: "same-origin",
    });
  } catch {
    const message =
      "We couldn't connect to the authentication service. Please try again in a moment.";
    notifyToast("error", message);
    throw createError(message);
  }

  let result: AuthResponse;
  try {
    result = (await response.json()) as AuthResponse;
  } catch {
    const message =
      "The authentication service returned an unreadable response. Please try again.";
    notifyToast("error", message);
    throw createError(message);
  }

  if (!response.ok) {
    const message =
      result.error?.message ?? "The authentication request failed. Please try again.";
    notifyToast("error", message);
    throw createError(message, result.error?.fields);
  }

  return result;
}
