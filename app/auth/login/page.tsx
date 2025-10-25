"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isLoading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const loggedInUser = await signIn(email, password);

    if (!loggedInUser) {
      setError("Invalid email or password");
      return;
    }

    if (loggedInUser.role === "owner") router.push("/dashboard");
    else router.push("/employee");
  };

  if (user) {
    if (user.role === "owner") router.push("/dashboard");
    else router.push("/employee");
    return null;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          SmartERP Login
        </h1>

        <div className="mb-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </div>
  );
}
