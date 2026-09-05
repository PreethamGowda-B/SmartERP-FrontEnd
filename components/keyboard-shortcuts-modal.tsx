"use client"

import { useEffect, useState } from "react"
import { Command, Search, Keyboard, Sparkles, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ShortcutGroup {
  category: string
  items: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Global & Navigation",
    items: [
      { keys: ["⌘", "K"], description: "Open Command Palette / Search" },
      { keys: ["⌘", "I"], description: "Open AI Copilot Operating Assistant" },
      { keys: ["Shift", "?"], description: "Open Keyboard Shortcuts Help Center" },
      { keys: ["Esc"], description: "Close Active Modal / Drawer" },
    ],
  },
  {
    category: "Enterprise Data Tables",
    items: [
      { keys: ["/"], description: "Focus Quick Search Filter" },
      { keys: ["⌘", "E"], description: "Export Selected Table Rows (CSV/PDF)" },
      { keys: ["⌘", "S"], description: "Save Current Table Column Layout" },
      { keys: ["Shift", "D"], description: "Toggle Table Row Density (Compact/Comfortable)" },
    ],
  },
  {
    category: "Actions & Workflows",
    items: [
      { keys: ["⌘", "Enter"], description: "Submit Form / Confirm Approval" },
      { keys: ["⌘", "N"], description: "Create New Entry (Employee / Item / Job)" },
      { keys: ["⌘", "P"], description: "Print Page / Export Executive Summary" },
    ],
  },
]

export function KeyboardShortcutsModal() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger on '?' key (Shift + /) when not inside an input/textarea
      if (
        e.key === "?" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredGroups = SHORTCUT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((group) => group.items.length > 0)

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border border-border shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Keyboard className="h-4 w-4" />
            <span>Power User Shortcuts</span>
          </div>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            Keyboard Shortcuts Guide
            <Badge variant="outline" className="text-xs font-normal">
              Press ? anytime
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Master keyboard navigation to control SmartERP at maximum speed.
          </DialogDescription>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              className="pl-9 text-xs bg-background h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No shortcuts matching "{search}"
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.category}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-foreground">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 text-[10px] font-bold font-mono bg-background border border-border rounded shadow-xs text-foreground"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
