export type ToastType = "success" | "error" | "info" | "warning";

export type ToastPayload = {
  type: ToastType;
  message: string;
};

export function notifyToast(type: ToastType, message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastPayload>("propertydek:toast", {
      detail: { type, message },
    }),
  );
}
