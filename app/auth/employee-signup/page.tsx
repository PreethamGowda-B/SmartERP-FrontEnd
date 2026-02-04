"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function EmployeeSignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        position: "",
        department: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    role: "user", // Employees get 'user' role
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Signup failed");

            alert("Account created successfully! Please log in.");
            router.push("/auth/login");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Employee Registration</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        Create your employee account to access the portal
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Full Name *</label>
                            <Input
                                name="name"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Email *</label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="john.doe@company.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Password *</label>
                            <Input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Phone Number *</label>
                            <Input
                                name="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={form.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Position *</label>
                            <Select
                                value={form.position}
                                onValueChange={(value) => setForm({ ...form, position: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your position" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Foreman">Foreman</SelectItem>
                                    <SelectItem value="Construction Worker">Construction Worker</SelectItem>
                                    <SelectItem value="Equipment Operator">Equipment Operator</SelectItem>
                                    <SelectItem value="Safety Inspector">Safety Inspector</SelectItem>
                                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                                    <SelectItem value="Site Supervisor">Site Supervisor</SelectItem>
                                    <SelectItem value="Electrician">Electrician</SelectItem>
                                    <SelectItem value="Plumber">Plumber</SelectItem>
                                    <SelectItem value="Carpenter">Carpenter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Department *</label>
                            <Select
                                value={form.department}
                                onValueChange={(value) => setForm({ ...form, department: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Construction">Construction</SelectItem>
                                    <SelectItem value="Engineering">Engineering</SelectItem>
                                    <SelectItem value="Safety">Safety</SelectItem>
                                    <SelectItem value="Operations">Operations</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Creating Account..." : "Create Employee Account"}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <a href="/auth/login" className="text-primary hover:underline font-medium">
                                Login here
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
