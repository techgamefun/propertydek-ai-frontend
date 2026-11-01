"use client";

import { useEffect, useState } from "react";
import {
  ApiRequestError,
  uploadPropertyDocument,
} from "../../lib/onboarding";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const GOOGLE_API_SCRIPT = "https://apis.google.com/js/api.js";
const GOOGLE_EXPORT_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.google-apps.spreadsheet":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.google-apps.presentation":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.google-apps.drawing": "image/png",
};
const MIME_EXTENSIONS: Record<string, string> = {
  "application/msword": "doc",
  "application/pdf": "pdf",
  "application/rtf": "rtf",
  "application/vnd.ms-excel": "xls",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/zip": "zip",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "text/csv": "csv",
  "text/plain": "txt",
};

type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GooglePickerDocument = {
  id: string;
  name: string;
};

type GooglePickerResponse = Record<string, unknown>;

type GooglePickerBuilder = {
  addView(view: unknown): GooglePickerBuilder;
  enableFeature(feature: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setCallback(callback: (response: GooglePickerResponse) => void): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setOrigin(origin: string): GooglePickerBuilder;
  build(): { setVisible(visible: boolean): void };
};

type GooglePickerNamespace = {
  Action: { CANCEL: string; PICKED: string };
  DocsView: new (viewId: string) => unknown;
  Document: { ID: string; NAME: string };
  Feature: { MULTISELECT_ENABLED: string };
  PickerBuilder: new () => GooglePickerBuilder;
  Response: { ACTION: string; DOCUMENTS: string };
  ViewId: { DOCS: string };
};

type GoogleApi = {
  load(api: string, options: { callback: () => void }): void;
};

type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient(options: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback: (error: { type: string }) => void;
      }): { requestAccessToken(): void };
    };
  };
  picker: GooglePickerNamespace;
};

declare global {
  interface Window {
    gapi?: GoogleApi;
    google?: GoogleIdentity;
  }
}

type Props = {
  propertyId: string;
  onImported: () => void;
};

export default function GoogleDriveImportButton({
  propertyId,
  onImported,
}: Props) {
  const [librariesReady, setLibrariesReady] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
  const isConfigured = Boolean(clientId && apiKey && appId);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    let active = true;
    void loadGoogleLibraries()
      .then(() => {
        if (active) {
          setLibrariesReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setSetupError(
            "Google Drive could not be loaded. Check your connection and try again.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [isConfigured]);

  function openDrivePicker() {
    if (
      !clientId ||
      !apiKey ||
      !appId ||
      !window.google ||
      !window.gapi
    ) {
      return;
    }

    const googleClientId = clientId ?? "";
    const googleApiKey = apiKey ?? "";
    const googleAppId = appId ?? "";
    setBusy(true);
    setError("");
    setNotice("");

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        const accessToken = response.access_token;
        if (!accessToken) {
          setBusy(false);
          setError("Google Drive access was not granted. Please try again.");
          return;
        }

        const google = window.google;
        if (!google) {
          setBusy(false);
          setError("Google Drive could not be opened. Please try again.");
          return;
        }

        const picker = new google.picker.PickerBuilder()
          .addView(new google.picker.DocsView(google.picker.ViewId.DOCS))
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .setAppId(googleAppId)
          .setDeveloperKey(googleApiKey)
          .setOAuthToken(accessToken)
          .setOrigin(window.location.origin)
          .setCallback((pickerResponse) => {
            const action = pickerResponse[google.picker.Response.ACTION];
            if (action === google.picker.Action.CANCEL) {
              setBusy(false);
              return;
            }
            if (action !== google.picker.Action.PICKED) {
              return;
            }

            const documents = pickerResponse[
              google.picker.Response.DOCUMENTS
            ];
            if (!Array.isArray(documents)) {
              setBusy(false);
              setError("Google Drive returned an invalid file selection.");
              return;
            }

            const selectedFiles = documents.filter(
              (document): document is GooglePickerDocument => {
                return isGooglePickerDocument(
                  document,
                  google.picker.Document.ID,
                  google.picker.Document.NAME,
                );
              },
            );
            if (selectedFiles.length !== documents.length) {
              setBusy(false);
              setError("Google Drive returned an invalid file selection.");
              return;
            }

            void importSelectedFiles(accessToken, selectedFiles);
          })
          .build();
        picker.setVisible(true);
      },
      error_callback: () => {
        setBusy(false);
        setError("Google Drive authorization was cancelled or failed.");
      },
    });

    tokenClient.requestAccessToken();
  }

  async function importSelectedFiles(
    accessToken: string,
    selectedFiles: GooglePickerDocument[],
  ) {
    let imported = 0;
    const failures: string[] = [];

    for (const selectedFile of selectedFiles) {
      try {
        const file = await downloadDriveFile(accessToken, selectedFile.id);
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error("Files must be 15 MB or smaller.");
        }
        await uploadPropertyDocument(propertyId, file);
        imported += 1;
      } catch (importError) {
        const message =
          importError instanceof ApiRequestError || importError instanceof Error
            ? importError.message
            : "Import failed.";
        failures.push(`${selectedFile.name}: ${message}`);
      }
    }

    if (imported > 0) {
      onImported();
    }
    setBusy(false);

    if (failures.length > 0) {
      setError(
        `${imported} file${imported === 1 ? "" : "s"} imported. ${failures.length} could not be imported: ${failures
          .slice(0, 3)
          .join(" ")}${failures.length > 3 ? ` And ${failures.length - 3} more.` : ""}`,
      );
      return;
    }

    setNotice(
      `${imported} file${imported === 1 ? "" : "s"} imported from Google Drive.`,
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce3de] bg-white px-4 text-sm font-semibold text-[#25342e] transition hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!isConfigured || !librariesReady || busy}
        onClick={openDrivePicker}
        type="button"
      >
        {busy ? "Importing from Drive..." : "Import from Google Drive"}
      </button>
      {!isConfigured && (
        <p className="text-xs text-[#738078]">
          Configure the Google Drive client ID, API key, and project number to
          enable imports.
        </p>
      )}
      {setupError && (
        <p className="text-sm text-[#a12a21]" role="alert">
          {setupError}
        </p>
      )}
      {error && (
        <p className="text-sm text-[#a12a21]" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm text-[#28583b]" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}

async function loadGoogleLibraries() {
  await Promise.all([
    loadScript(GOOGLE_IDENTITY_SCRIPT),
    loadScript(GOOGLE_API_SCRIPT),
  ]);

  if (!window.google || !window.gapi) {
    throw new Error("Google libraries did not initialize.");
  }

  await new Promise<void>((resolve) => {
    window.gapi?.load("picker", { callback: resolve });
  });
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Google library could not be loaded.")),
      { once: true },
    );
    if (!existing) {
      script.async = true;
      script.src = src;
      document.head.appendChild(script);
    }
  });
}

async function downloadDriveFile(accessToken: string, fileId: string) {
  const metadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${new URLSearchParams(
      { fields: "name,mimeType,size", supportsAllDrives: "true" },
    )}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!metadataResponse.ok) {
    throw new Error("Google Drive could not read this file.");
  }

  const metadata = (await metadataResponse.json()) as GoogleDriveFile;
  if (!metadata.name || !metadata.mimeType) {
    throw new Error("Google Drive returned incomplete file information.");
  }
  if (metadata.size && Number(metadata.size) > MAX_FILE_SIZE_BYTES) {
    throw new Error("Files must be 15 MB or smaller.");
  }

  const exportMimeType = GOOGLE_EXPORT_TYPES[metadata.mimeType];
  if (
    metadata.mimeType.startsWith("application/vnd.google-apps.") &&
    !exportMimeType
  ) {
    throw new Error("This Google file type cannot be exported.");
  }

  const url = exportMimeType
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?${new URLSearchParams({ mimeType: exportMimeType })}`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${new URLSearchParams({ alt: "media", supportsAllDrives: "true" })}`;
  const fileResponse = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!fileResponse.ok) {
    throw new Error("Google Drive could not download this file.");
  }

  const blob = await readDriveFile(fileResponse);

  const mimeType = exportMimeType ?? metadata.mimeType;
  const fileName = exportMimeType
    ? withExportExtension(metadata.name, exportMimeType)
    : withFileExtension(metadata.name, mimeType);
  return new File([blob], fileName, { type: mimeType });
}

async function readDriveFile(response: Response) {
  if (!response.body) {
    throw new Error("Google Drive returned an unreadable file.");
  }

  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let totalSize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    totalSize += value.byteLength;
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      await reader.cancel();
      throw new Error("Files must be 15 MB or smaller.");
    }
    const chunk = new ArrayBuffer(value.byteLength);
    new Uint8Array(chunk).set(value);
    chunks.push(chunk);
  }

  if (totalSize === 0) {
    throw new Error("Google Drive returned an empty file.");
  }

  return new Blob(chunks, {
    type: response.headers.get("content-type") ?? "application/octet-stream",
  });
}

function withExportExtension(name: string, mimeType: string) {
  const extension = MIME_EXTENSIONS[mimeType];
  if (!extension) {
    throw new Error("This Google file type cannot be exported.");
  }

  const baseName = name.replace(/\.[^.]+$/u, "");
  return `${baseName}.${extension}`;
}

function withFileExtension(name: string, mimeType: string) {
  if (/\.[a-z0-9]{1,10}$/iu.test(name)) {
    return name;
  }

  const extension = MIME_EXTENSIONS[mimeType] ?? "bin";
  return `${name}.${extension}`;
}

function isGooglePickerDocument(
  value: unknown,
  idField: string,
  nameField: string,
): value is GooglePickerDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const id = record[idField];
  const name = record[nameField];
  return (
    typeof id === "string" &&
    id.length > 0 &&
    typeof name === "string" &&
    name.length > 0
  );
}
