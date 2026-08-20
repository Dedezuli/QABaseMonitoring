import { describeFieldError } from "@/lib/field-labels";

export type ParsedApiError = {
  message: string;
  fieldErrors: Record<string, string>;
};

/**
 * A failed request should never surface a bare status code or `[object Object]`.
 * When the server sends no usable message, these stand in with something the
 * user can act on.
 */
function messageForStatus(status: number) {
  if (status === 401) {
    return "Sesi kamu sudah berakhir. Silakan login ulang lalu coba lagi.";
  }
  if (status === 403) {
    return "Kamu tidak punya akses untuk melakukan tindakan ini.";
  }
  if (status === 404) {
    return "Data yang dituju tidak ditemukan. Mungkin sudah dihapus — coba muat ulang halaman.";
  }
  if (status === 409) {
    return "Data ini bentrok dengan data yang sudah ada. Periksa kembali isian anda.";
  }
  if (status === 413) {
    return "File yang dikirim terlalu besar.";
  }
  if (status === 429) {
    return "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.";
  }
  if (status >= 500) {
    return "Terjadi kesalahan di server. Coba lagi beberapa saat, dan hubungi admin bila tetap gagal.";
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Older routes replied with a raw zod `flatten()`; still handled so nothing regresses. */
function fromZodFlatten(value: Record<string, unknown>): ParsedApiError | null {
  const rawFieldErrors = value.fieldErrors;
  const rawFormErrors = value.formErrors;
  if (!isRecord(rawFieldErrors) && !Array.isArray(rawFormErrors)) return null;

  const fieldErrors: Record<string, string> = {};
  if (isRecord(rawFieldErrors)) {
    for (const [field, messages] of Object.entries(rawFieldErrors)) {
      if (Array.isArray(messages) && messages.length) {
        fieldErrors[field] = String(messages[0]);
      }
    }
  }

  const parts = [
    ...(Array.isArray(rawFormErrors) ? rawFormErrors.map(String) : []),
    ...Object.entries(fieldErrors).map(([field, message]) =>
      describeFieldError(field, message)
    ),
  ];
  if (parts.length === 0) return null;

  return {
    message:
      parts.length === 1
        ? parts[0]
        : `${parts[0]} (dan ${parts.length - 1} isian lain perlu diperbaiki)`,
    fieldErrors,
  };
}

export function parseApiError(
  body: unknown,
  fallback: string,
  status?: number
): ParsedApiError {
  const statusMessage = status ? messageForStatus(status) : null;

  if (isRecord(body)) {
    const fieldErrors: Record<string, string> = {};
    if (isRecord(body.fieldErrors)) {
      for (const [field, message] of Object.entries(body.fieldErrors)) {
        if (typeof message === "string") fieldErrors[field] = message;
      }
    }

    if (typeof body.error === "string" && body.error.trim()) {
      return { message: body.error, fieldErrors };
    }

    if (isRecord(body.error)) {
      const parsed = fromZodFlatten(body.error);
      if (parsed) return parsed;
    }

    if (Object.keys(fieldErrors).length > 0) {
      const parts = Object.entries(fieldErrors).map(([field, message]) =>
        describeFieldError(field, message)
      );
      return {
        message:
          parts.length === 1
            ? parts[0]
            : `${parts[0]} (dan ${parts.length - 1} isian lain perlu diperbaiki)`,
        fieldErrors,
      };
    }
  }

  return { message: statusMessage ?? fallback, fieldErrors: {} };
}

/** Reads a failed Response safely — a non-JSON body must not throw over the real error. */
export async function readApiError(
  res: Response,
  fallback: string
): Promise<ParsedApiError> {
  const body = await res.json().catch(() => null);
  return parseApiError(body, fallback, res.status);
}

/** Network-level failures (offline, DNS, aborted) never reach the server at all. */
export const NETWORK_ERROR_MESSAGE =
  "Tidak bisa terhubung ke server. Periksa koneksi internet anda lalu coba lagi.";
