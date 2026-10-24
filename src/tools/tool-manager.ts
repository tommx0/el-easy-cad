import type { PointerInfo, Tool, ToolContext, ToolVorgabe } from './tool'

type Listener = () => void

export class ToolManager {
  private tools = new Map<string, Tool>()
  private aktivesToolId: string
  private context: ToolContext
  private listeners = new Set<Listener>()
  private gesperrt: () => boolean = () => false

  constructor(context: ToolContext, standardToolId: string) {
    this.context = context
    this.aktivesToolId = standardToolId
  }

  setzeSperre(gesperrt: () => boolean) {
    this.gesperrt = gesperrt
  }

  registriere(tool: Tool) {
    this.tools.set(tool.id, tool)
  }

  alleTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  getTool(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  getAktivesToolId(): string {
    return this.aktivesToolId
  }

  getAktivesTool(): Tool | undefined {
    return this.tools.get(this.aktivesToolId)
  }

  initialisiere() {
    this.getAktivesTool()?.onActivate?.(this.context)
    this.notify()
  }

  aktiviere(toolId: string, vorgabe?: ToolVorgabe) {
    const laeuftBereits = toolId === this.aktivesToolId && !vorgabe
    if (laeuftBereits && !this.tools.get(toolId)?.erneutAktivierbar) return
    const neuesTool = this.tools.get(toolId)
    if (!neuesTool) return
    const altesTool = this.tools.get(this.aktivesToolId)
    altesTool?.onDeactivate?.(this.context)
    this.aktivesToolId = toolId
    this.context.setStatus(null)
    neuesTool.onActivate?.(this.context, vorgabe)
    this.notify()
  }

  abbrechenUndNeuStarten() {
    const tool = this.getAktivesTool()
    if (!tool) return
    if (tool.onAbbrechen?.(this.context) === true) {
      this.notify()
      return
    }
    tool.onDeactivate?.(this.context)
    this.context.setStatus(null)
    tool.onActivate?.(this.context)
    this.notify()
  }

  handlePointerDown(info: PointerInfo) {
    if (this.gesperrt()) return
    this.getAktivesTool()?.onPointerDown?.(info, this.context)
  }
  handlePointerMove(info: PointerInfo) {
    if (this.gesperrt()) return
    this.getAktivesTool()?.onPointerMove?.(info, this.context)
  }
  handlePointerUp(info: PointerInfo) {
    if (this.gesperrt()) return
    this.getAktivesTool()?.onPointerUp?.(info, this.context)
  }
  handlePointerLeave() {
    this.getAktivesTool()?.onPointerLeave?.(this.context)
  }
  handleDoubleClick(info: PointerInfo) {
    if (this.gesperrt()) return
    this.getAktivesTool()?.onDoubleClick?.(info, this.context)
  }
  handleRightClick(info: PointerInfo): boolean {
    if (this.gesperrt()) return false
    return this.getAktivesTool()?.onRightClick?.(info, this.context) === true
  }
  handleKeyDown(e: KeyboardEvent) {
    if (typeof e.key !== 'string') return
    if (e.key === 'Escape') {
      this.abbrechenUndNeuStarten()
      return
    }
    if (this.gesperrt()) return
    this.getAktivesTool()?.onKeyDown?.(e, this.context)
  }
  handleKeyUp(e: KeyboardEvent) {
    if (typeof e.key !== 'string' || this.gesperrt()) return
    this.getAktivesTool()?.onKeyUp?.(e, this.context)
  }
  drawOverlay(g: CanvasRenderingContext2D) {
    if (this.gesperrt()) return
    this.getAktivesTool()?.drawOverlay?.(g, this.context)
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    for (const l of this.listeners) l()
  }
}
