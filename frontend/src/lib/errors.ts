import { isAxiosError } from 'axios';

interface ApiErrorBody {
  error?: string;
  code?: string;
  details?: { field: string; message: string }[];
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && !isAxiosError(error)) {
    return error.message;
  }

  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;

    if (data?.details?.length) {
      return data.details.map((d) => `${d.field}: ${d.message}`).join('. ');
    }

    if (data?.error) {
      return data.error;
    }

    if (error.response?.status === 502) {
      return 'A backend service is unavailable. Run npm run dev and try again.';
    }
  }

  return fallback;
}
