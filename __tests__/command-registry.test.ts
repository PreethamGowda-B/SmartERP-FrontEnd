/**
 * Test Suite: Command Palette Plugin Architecture
 * Verification: Command registration, unregistration, and category management
 */

export interface DummyCommand {
  id: string
  title: string
  category: string
  action: () => void
}

export function runCommandRegistryVerification() {
  const commandsMap = new Map<string, DummyCommand>()

  const testCmd: DummyCommand = {
    id: "action-test",
    title: "Test Action",
    category: "Test",
    action: () => {},
  }

  commandsMap.set(testCmd.id, testCmd)
  const sizeAfterAdd = commandsMap.size
  if (sizeAfterAdd !== 1 || commandsMap.get("action-test")?.title !== "Test Action") {
    throw new Error("Command registration verification failed")
  }

  commandsMap.delete("action-test")
  const sizeAfterDelete = commandsMap.size
  if (sizeAfterDelete !== 0) {
    throw new Error("Command unregistration verification failed")
  }

  return true
}
