const API_BASE_URL = "http://localhost:5001/api";
const SERVER_BASE_URL = "http://localhost:5001";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

let onUnauthorized: (() => void) | null = null;

export const registerUnauthorizedHandler = (handler: () => void): void => {
  onUnauthorized = handler;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: BodyInit | null } = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem("token") || "";
  const requestUrl = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  try {
    const response = await fetch(requestUrl, {
      method: options.method || "GET",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body || undefined,
    });
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const data = (await response.json().catch(() => ({
      success: false,
      message: "Invalid server response",
      data: null,
    }))) as ApiResponse<T>;
    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Request failed");
  }
};

export const serverRequest = async <T>(
  endpoint: string,
  options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: BodyInit | null } = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem("token") || "";
  const isFormData = options.body instanceof FormData;
  try {
    const response = await fetch(`${SERVER_BASE_URL}${endpoint}`, {
      method: options.method || "GET",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body || undefined,
    });
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const data = (await response.json().catch(() => ({
      success: false,
      message: "Invalid server response",
      data: null,
    }))) as ApiResponse<T>;
    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Request failed");
  }
};
