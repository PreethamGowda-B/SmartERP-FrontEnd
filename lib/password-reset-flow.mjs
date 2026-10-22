const OTP_ERROR = "The verification code is incorrect or expired. Please check it or request a new code.";

export function validateStaffPasswordResetForm({ otp, password, confirmation, resetToken = "" }) {
  if (!resetToken && !/^\d{6}$/.test(String(otp || "").trim())) {
    return "Please enter the 6-digit verification code sent to your email.";
  }
  if (String(password || "").length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Password must include uppercase and lowercase letters, a number, and a symbol.";
  }
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

/** Run the custom SmartERP recovery flow in the required order. */
export async function completeStaffPasswordReset({
  request,
  email,
  otp,
  password,
  resetToken = "",
  onVerified = () => {},
}) {
  let authorization = resetToken;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!authorization) {
    const verification = await request("/api/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, otp: String(otp || "").trim() }),
    });
    if (!verification?.verified || !verification?.reset_token) {
      throw new Error(OTP_ERROR);
    }
    authorization = verification.reset_token;
    onVerified(authorization);
  }

  const result = await request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      reset_token: authorization,
      new_password: password,
    }),
  });
  if (!result?.success) {
    throw new Error(result?.message || "Password update was not confirmed. Please retry.");
  }
  return result;
}
