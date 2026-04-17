import {
  DAMLiveDataResponse,
  LiveDataResponse,
  SimulationControlPayload,
} from "../types/predictions";

interface ApiErrorResponse {
  detail?: string;
}

const resolveApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const apiError = parsedBody as ApiErrorResponse;
    const detail = apiError?.detail ? String(apiError.detail) : `Request failed (${response.status})`;
    throw new Error(detail);
  }

  return parsedBody as T;
};

export const getLiveData = (): Promise<LiveDataResponse> => apiRequest<LiveDataResponse>("/live-data");

export const startSimulation = (payload: SimulationControlPayload): Promise<unknown> =>
  apiRequest<unknown>("/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const stopSimulation = (): Promise<unknown> =>
  apiRequest<unknown>("/stop-simulation", {
    method: "POST",
  });

export const getDamLiveData = (): Promise<DAMLiveDataResponse> =>
  apiRequest<DAMLiveDataResponse>("/dam-live-data");

export const startDamSimulation = (payload: SimulationControlPayload): Promise<unknown> =>
  apiRequest<unknown>("/simulate-dam", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const stopDamSimulation = (): Promise<unknown> =>
  apiRequest<unknown>("/stop-dam-simulation", {
    method: "POST",
  });
