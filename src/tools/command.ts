export interface Command {
  readonly label: string
  do(): void
  undo(): void
  readonly ohneBlattsperre?: boolean
}

export function ohneBlattsperre<T extends Command>(command: T): T {
  return Object.assign(command, { ohneBlattsperre: true })
}

type StackListener = () => void

export class CommandStack {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private listeners = new Set<StackListener>()
  private sperre: { pruefe: () => string | null; melde: (grund: string) => void } | null = null

  setzeSperre(pruefe: () => string | null, melde: (grund: string) => void) {
    this.sperre = { pruefe, melde }
  }

  private istGesperrt(command: Command): boolean {
    if (!this.sperre || command.ohneBlattsperre) return false
    const grund = this.sperre.pruefe()
    if (grund === null) return false
    this.sperre.melde(grund)
    return true
  }

  execute(command: Command): boolean {
    if (this.istGesperrt(command)) return false
    command.do()
    this.undoStack.push(command)
    this.redoStack = []
    this.notify()
    return true
  }

  push(command: Command) {
    if (this.istGesperrt(command)) {
      command.undo()
      return
    }
    this.undoStack.push(command)
    this.redoStack = []
    this.notify()
  }

  undo() {
    const command = this.undoStack.pop()
    if (!command) return
    command.undo()
    this.redoStack.push(command)
    this.notify()
  }

  redo() {
    const command = this.redoStack.pop()
    if (!command) return
    command.do()
    this.undoStack.push(command)
    this.notify()
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  peekUndoLabel(): string | null {
    return this.undoStack.length ? this.undoStack[this.undoStack.length - 1].label : null
  }

  peekRedoLabel(): string | null {
    return this.redoStack.length ? this.redoStack[this.redoStack.length - 1].label : null
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
    this.notify()
  }

  subscribe = (listener: StackListener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    for (const listener of this.listeners) listener()
  }
}

export class CompositeCommand implements Command {
  readonly label: string
  private commands: Command[]

  constructor(label: string, commands: Command[]) {
    this.label = label
    this.commands = commands
  }

  do() {
    for (const c of this.commands) c.do()
  }

  undo() {
    for (let i = this.commands.length - 1; i >= 0; i--) this.commands[i].undo()
  }
}
