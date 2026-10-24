export class FrameScheduler {
  private callback: () => void
  private handle: number | null = null

  constructor(callback: () => void) {
    this.callback = callback
  }

  request() {
    if (this.handle !== null) return
    this.handle = requestAnimationFrame(() => {
      this.handle = null
      this.callback()
    })
  }

  cancel() {
    if (this.handle !== null) {
      cancelAnimationFrame(this.handle)
      this.handle = null
    }
  }
}
