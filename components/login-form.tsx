"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn, signUp } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"
import { Building2, Loader2, HardHat, UserPlus } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("owner")
  const [mode, setMode] = useState<"login" | "signup">("signup") // Default to signup mode since no demo accounts
  const [isFlipping, setIsFlipping] = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (mode === "login") {
        const user = await signIn(email, password)
        if (user) {
          setUser(user)
          router.push(user.role === "owner" ? "/owner" : "/employee")
        } else {
          setError("Invalid email or password. Please check your credentials or create an account.")
        }
      } else {
        if (!name.trim()) {
          setError("Full name is required")
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters long")
          setIsLoading(false)
          return
        }

        const userData = {
          email,
          password,
          name: name.trim(),
          role: activeTab as "owner" | "employee",
          phone: phone.trim() || undefined,
          position: activeTab === "employee" ? position.trim() || undefined : undefined,
          department: activeTab === "employee" ? department.trim() || undefined : undefined,
        }

        const user = await signUp(userData)
        if (user) {
          setSuccess("Account created successfully! You can now sign in with your credentials.")
          setMode("login")
          setPassword("")
          setName("")
          setPhone("")
          setPosition("")
          setDepartment("")
        } else {
          setError("Email already exists. Please use a different email or sign in to your existing account.")
        }
      }
    } catch (err) {
      setError(mode === "login" ? "An error occurred during sign in" : "An error occurred during account creation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (value === activeTab) return

    setIsFlipping(true)
    setTimeout(() => {
      setActiveTab(value)
      setError("")
      setSuccess("")
      setEmail("")
      setPassword("")
      if (mode === "signup") {
        setName("")
        setPhone("")
        setPosition("")
        setDepartment("")
      }
      setTimeout(() => setIsFlipping(false), 50)
    }, 150)
  }

  const toggleMode = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setMode(mode === "login" ? "signup" : "login")
      setError("")
      setSuccess("")
      setEmail("")
      setPassword("")
      setName("")
      setPhone("")
      setPosition("")
      setDepartment("")
      setTimeout(() => setIsFlipping(false), 50)
    }, 150)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 animate-fade-in-up">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-pulse-soft"></div>

      <Card className="w-full max-w-md relative z-10 animate-fade-in-up stagger-2 hover-lift border-2 hover:border-primary/20 transition-all duration-500">
        <CardHeader className="text-center animate-fade-in-down stagger-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full animate-scale-in stagger-2 hover-scale animate-float">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in-left stagger-3">
            SmartERP
          </CardTitle>
          <CardDescription className="animate-fade-in-up stagger-4">
            {mode === "login" ? "Sign in to your account" : "Create your crew management account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="animate-fade-in-up stagger-3">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="owner"
                className="flex items-center gap-2 transition-all duration-300 hover-scale data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg animate-press"
              >
                <Building2 className="h-4 w-4 transition-transform duration-300" />
                Owner
              </TabsTrigger>
              <TabsTrigger
                value="employee"
                className="flex items-center gap-2 transition-all duration-300 hover-scale data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg animate-press"
              >
                <HardHat className="h-4 w-4 transition-transform duration-300" />
                Employee
              </TabsTrigger>
            </TabsList>

            <div
              className={`mt-6 transition-all duration-300 ${isFlipping ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
            >
              <TabsContent value="owner" className="animate-fade-in-right stagger-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-2 animate-slide-up stagger-1">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                      />
                    </div>
                  )}

                  <div className="space-y-2 animate-slide-up stagger-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                    />
                  </div>

                  <div className="space-y-2 animate-slide-up stagger-3">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                    />
                  </div>

                  {mode === "signup" && (
                    <div className="space-y-2 animate-slide-up stagger-4">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                      />
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive" className="animate-fade-in-up">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="animate-fade-in-up border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full transition-all duration-300 hover-lift hover-scale animate-press"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "login" ? "Signing in..." : "Creating Account..."}
                      </>
                    ) : mode === "login" ? (
                      "Sign In as Owner"
                    ) : (
                      "Create Owner Account"
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-primary/10 rounded-lg animate-fade-in-up stagger-5 hover:bg-primary/20 transition-colors duration-300 hover-lift">
                  <p className="text-sm text-center text-foreground font-medium">
                    <Building2 className="h-4 w-4 inline mr-1 animate-float text-primary" />
                    Access full business management features
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="employee" className="animate-fade-in-left stagger-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-2 animate-slide-up stagger-1">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                      />
                    </div>
                  )}

                  <div className="space-y-2 animate-slide-up stagger-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                    />
                  </div>

                  <div className="space-y-2 animate-slide-up stagger-3">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                    />
                  </div>

                  {mode === "signup" && (
                    <>
                      <div className="space-y-2 animate-slide-up stagger-4">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number (Optional)
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                        />
                      </div>

                      <div className="space-y-2 animate-slide-up stagger-5">
                        <Label htmlFor="position" className="text-sm font-medium">
                          Position (Optional)
                        </Label>
                        <Input
                          id="position"
                          type="text"
                          placeholder="e.g., Site Supervisor, Foreman"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                        />
                      </div>

                      <div className="space-y-2 animate-slide-up stagger-6">
                        <Label htmlFor="department" className="text-sm font-medium">
                          Department (Optional)
                        </Label>
                        <Input
                          id="department"
                          type="text"
                          placeholder="e.g., Construction, Electrical"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift"
                        />
                      </div>
                    </>
                  )}

                  {error && (
                    <Alert variant="destructive" className="animate-fade-in-up">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="animate-fade-in-up border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 transition-all duration-300 hover-lift hover-scale animate-press"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "login" ? "Signing in..." : "Creating Account..."}
                      </>
                    ) : mode === "login" ? (
                      "Sign In as Employee"
                    ) : (
                      "Create Employee Account"
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-accent/10 rounded-lg animate-fade-in-up stagger-5 hover:bg-accent/20 transition-colors duration-300 hover-lift">
                  <p className="text-sm text-center text-foreground font-medium">
                    <HardHat className="h-4 w-4 inline mr-1 animate-float text-accent" />
                    Access your jobs, time tracking & more
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-6 text-center animate-fade-in-up stagger-6">
            <Button
              variant="ghost"
              onClick={toggleMode}
              className="text-sm hover-scale transition-all duration-300 hover:bg-primary/10 animate-press"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
