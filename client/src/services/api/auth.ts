import { apiRequest, serverRequest } from "./client";
import type { AuthUser } from "../../types/app";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const loginUser = async (
  email: string,
  password: string,
  role: "student" | "company"
): Promise<LoginResponse> => {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.data.user.role !== role) {
    throw new Error("Selected role does not match account role");
  }
  return response.data;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: "student" | "company"
): Promise<void> => {
  await apiRequest<null>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
};

export const loginAdmin = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await serverRequest<LoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.data.user.role !== "admin") {
    throw new Error("Invalid admin account");
  }
  return response.data;
};
