"use client"

import * as React from "react"
import { useCommandRegistry, type CommandItemDef } from "@/contexts/command-registry-context"

export function useRegisterCommand(command: CommandItemDef | CommandItemDef[]) {
  const { registerCommand, unregisterCommand } = useCommandRegistry()

  // Store command in ref to prevent infinite loops when inline object literals are passed
  const commandRef = React.useRef(command)
  React.useEffect(() => {
    commandRef.current = command
  }, [command])

  // Create a stable string representation of command IDs
  const commandIds = React.useMemo(() => {
    const list = Array.isArray(command) ? command : [command]
    return list.map((c) => c.id).join(",")
  }, [command])

  React.useEffect(() => {
    const list = Array.isArray(commandRef.current) ? commandRef.current : [commandRef.current]

    list.forEach((cmd) => {
      registerCommand(cmd)
    })

    return () => {
      list.forEach((cmd) => {
        unregisterCommand(cmd.id)
      })
    }
  }, [commandIds, registerCommand, unregisterCommand])
}
