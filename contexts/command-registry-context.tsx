"use client"

import * as React from "react"

export interface CommandItemDef {
  id: string
  title: string
  category: string
  action: () => void
  icon?: React.ElementType
  shortcut?: string
  keywords?: string[]
  isFavorite?: boolean
}

interface CommandRegistryContextType {
  commands: CommandItemDef[]
  recentCommandIds: string[]
  registerCommand: (command: CommandItemDef) => void
  unregisterCommand: (commandId: string) => void
  executeCommand: (command: CommandItemDef) => void
  toggleFavorite: (commandId: string) => void
}

const CommandRegistryContext = React.createContext<CommandRegistryContextType | undefined>(
  undefined
)

export function CommandRegistryProvider({ children }: { children: React.ReactNode }) {
  const [commandsMap, setCommandsMap] = React.useState<Map<string, CommandItemDef>>(
    new Map()
  )
  const [recentCommandIds, setRecentCommandIds] = React.useState<string[]>([])

  const registerCommand = React.useCallback((command: CommandItemDef) => {
    setCommandsMap((prev) => {
      const next = new Map(prev)
      next.set(command.id, command)
      return next
    })
  }, [])

  const unregisterCommand = React.useCallback((commandId: string) => {
    setCommandsMap((prev) => {
      const next = new Map(prev)
      next.delete(commandId)
      return next
    })
  }, [])

  const executeCommand = React.useCallback((command: CommandItemDef) => {
    setRecentCommandIds((prev) => {
      const filtered = prev.filter((id) => id !== command.id)
      return [command.id, ...filtered].slice(0, 5) // Keep last 5 recent
    })
    command.action()
  }, [])

  const toggleFavorite = React.useCallback((commandId: string) => {
    setCommandsMap((prev) => {
      const next = new Map(prev)
      const existing = next.get(commandId)
      if (existing) {
        next.set(commandId, { ...existing, isFavorite: !existing.isFavorite })
      }
      return next
    })
  }, [])

  const commands = React.useMemo(
    () => Array.from(commandsMap.values()),
    [commandsMap]
  )

  const value = React.useMemo(
    () => ({
      commands,
      recentCommandIds,
      registerCommand,
      unregisterCommand,
      executeCommand,
      toggleFavorite,
    }),
    [commands, recentCommandIds, registerCommand, unregisterCommand, executeCommand, toggleFavorite]
  )

  return (
    <CommandRegistryContext.Provider value={value}>
      {children}
    </CommandRegistryContext.Provider>
  )
}

export function useCommandRegistry() {
  const context = React.useContext(CommandRegistryContext)
  if (!context) {
    throw new Error("useCommandRegistry must be used within a CommandRegistryProvider")
  }
  return context
}
