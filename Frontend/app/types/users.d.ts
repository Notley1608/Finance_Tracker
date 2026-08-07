export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface authPayload {
  email: string;
  password: string;
}

export interface updateUserPayload {
  currentPassword: string;
  newEmail: string | undefined;
  newPassword: string | undefined;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
}
