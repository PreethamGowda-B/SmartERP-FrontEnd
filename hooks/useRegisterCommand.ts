"use client"

import * as React from "react"
import { useCommandRegistry, type CommandItemDef } from "@/contexts/command-registry-context"

export function useRegisterCommand(command: CommandItemDef | CommandItemDef[]) {
  const { registerCommand, unregisterCommand } = useCommandRegistry()

  React.useEffect(() => {
    const list = Array.isArray(command) ? command : [command]

    list.forEach((cmd) => {
      registerCommand(cmd)
    })

    return () => {
      list.forEach((cmd) => {
        unregisterCommand(cmd.id)
      })
    }
  }, [command, registerCommand, unregisterCommand])
}
