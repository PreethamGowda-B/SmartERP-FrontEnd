type ApiRequest = (path: string, options: RequestInit) => Promise<any>;

export function validateStaffPasswordResetForm(options: {
  otp: string;
  password: string;
  confirmation: string;
  resetToken?: string;
}): string | null;

export function completeStaffPasswordReset(options: {
  request: ApiRequest;
  email: string;
  otp: string;
  password: string;
  resetToken?: string;
  onVerified?: (token: string) => void;
}): Promise<{ success: boolean; message?: string }>;
