"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  CalendarCheck,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  Plus,
  Clock,
  LogOut,
  Building,
  Star,
  History,
} from "lucide-react"

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command"
import { useAuth } from "@/contexts/auth-context"
import { useCommandRegistry, type CommandItemDef } from "@/contexts/command-registry-context"

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { commands, recentCommandIds, executeCommand } = useCommandRegistry()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback(
    (commandDef: CommandItemDef) => {
      setOpen(false)
      executeCommand(commandDef)
    },
    [executeCommand]
  )

  if (!user) return null

  const isOwner = user.role === "owner" || user.role === "super_admin"
  const isHR = user.role === "hr"
  const prefix = isOwner ? "/owner" : isHR ? "/hr" : "/employee"

  // Base fallback navigation commands
  const defaultCommands: CommandItemDef[] = [
    {
      id: "nav-dashboard",
      title: "Dashboard Overview",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "⌘D",
      action: () => router.push(prefix),
    },
    {
      id: "nav-jobs",
      title: "Jobs & Task Tracking",
      category: "Navigation",
      icon: Briefcase,
      action: () => router.push(`${prefix}/jobs`),
    },
    {
      id: "nav-employees",
      title: "Employees & Staff",
      category: "Navigation",
      icon: Users,
      action: () => router.push(`${prefix}/employees`),
    },
    {
      id: "nav-inventory",
      title: "Inventory & Stock",
      category: "Navigation",
      icon: Package,
      action: () => router.push(`${prefix}/inventory`),
    },
    {
      id: "nav-attendance",
      title: "Attendance & Clock-In",
      category: "Navigation",
      icon: CalendarCheck,
      action: () => router.push(`${prefix}/attendance`),
    },
    {
      id: "nav-payroll",
      title: "Payroll & Payslips",
      category: "Navigation",
      icon: CreditCard,
      action: () => router.push(`${prefix}/payroll`),
    },
    {
      id: "nav-messages",
      title: "Team Chat & Messages",
      category: "Navigation",
      icon: MessageSquare,
      action: () => router.push(`${prefix}/messages`),
    },
    {
      id: "nav-reports",
      title: "Reports & Analytics",
      category: "Navigation",
      icon: FileText,
      action: () => router.push(`${prefix}/reports`),
    },
    {
      id: "nav-settings",
      title: "Account Settings",
      category: "Account",
      icon: Settings,
      action: () => router.push(`${prefix}/settings`),
    },
    {
      id: "action-logout",
      title: "Sign Out",
      category: "Account",
      icon: LogOut,
      action: () => signOut(),
    },
  ]

  // Combine dynamic registered plugin commands with fallback defaults
  const allCommands = [...commands, ...defaultCommands.filter((dc) => !commands.some((c) => c.id === dc.id))]

  // Group commands by category
  const categories = Array.from(new Set(allCommands.map((c) => c.category)))

  // Recent commands list
  const recentCommands = recentCommandIds
    .map((id) => allCommands.find((c) => c.id === id))
    .filter(Boolean) as CommandItemDef[]

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="SmartERP Quick Search" description="Type a command or search modules">
      <CommandInput placeholder="Type a command or search modules... (⌘K)" />
      <CommandList className="max-h-[350px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Commands Group */}
        {recentCommands.length > 0 && (
          <CommandGroup heading="Recent Commands">
            {recentCommands.map((cmd) => {
              const Icon = cmd.icon || History
              return (
                <CommandItem key={`recent-${cmd.id}`} onSelect={() => runCommand(cmd)}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{cmd.title}</span>
                  {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Grouped Dynamic Commands */}
        {categories.map((category) => {
          const categoryCmds = allCommands.filter((c) => c.category === category)

          return (
            <CommandGroup key={category} heading={category}>
              {categoryCmds.map((cmd) => {
                const Icon = cmd.icon || SparklesIcon
                return (
                  <CommandItem key={cmd.id} onSelect={() => runCommand(cmd)}>
                    <Icon className="mr-2 h-4 w-4 text-primary" />
                    <span>{cmd.title}</span>
                    {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  )
}
