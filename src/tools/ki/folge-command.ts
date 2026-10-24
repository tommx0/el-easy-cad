import type { Command } from '../command'

export class KiFolgeCommand implements Command {
  readonly label: string
  readonly ohneBlattsperre = true
  private readonly schritte: readonly (() => Command | null)[]
  private ausgefuehrt: Command[] = []

  constructor(label: string, schritte: readonly (() => Command | null)[]) {
    this.label = label
    this.schritte = schritte
  }

  do() {
    this.ausgefuehrt = []
    try {
      for (const schritt of this.schritte) {
        const command = schritt()
        if (!command) continue
        command.do()
        this.ausgefuehrt.push(command)
      }
    } catch (fehler) {
      this.undo()
      this.ausgefuehrt = []
      throw fehler
    }
  }

  undo() {
    for (let i = this.ausgefuehrt.length - 1; i >= 0; i--) this.ausgefuehrt[i].undo()
  }

  get leer(): boolean {
    return this.ausgefuehrt.length === 0
  }
}
