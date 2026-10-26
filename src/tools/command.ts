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
  private sammlung: Command[] | null = null

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
    if (this.sammlung) this.sammlung.push(command)
    else {
      this.undoStack.push(command)
      this.redoStack = []
    }
    this.notify()
    return true
  }

  push(command: Command) {
    if (this.istGesperrt(command)) {
      command.undo()
      return
    }
    if (this.sammlung) this.sammlung.push(command)
    else {
      this.undoStack.push(command)
      this.redoStack = []
    }
    this.notify()
  }

  undo() {
    if (this.sammlung) {
      this.sammlung.pop()?.undo()
      this.notify()
      return
    }
    const command = this.undoStack.pop()
    if (!command) return
    command.undo()
    this.redoStack.push(command)
    this.notify()
  }

  redo() {
    if (this.sammlung) return
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

  beginneSammlung() {
    if (this.sammlung) throw new Error('Es laeuft bereits eine Sammlung.')
    this.sammlung = []
  }

  beendeSammlung(label: string): Command | null {
    const gesammelt = this.sammlung
    this.sammlung = null
    if (!gesammelt || gesammelt.length === 0) return null
    const command = new CompositeCommand(label, gesammelt)
    this.undoStack.push(command)
    this.redoStack = []
    this.notify()
    return command
  }

  verwirfSammlung() {
    const gesammelt = this.sammlung
    this.sammlung = null
    if (!gesammelt) return
    for (let i = gesammelt.length - 1; i >= 0; i--) gesammelt[i].undo()
    this.notify()
  }

  sammeltGerade(): boolean {
    return this.sammlung !== null
  }

  clear() {
    this.sammlung = null
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
