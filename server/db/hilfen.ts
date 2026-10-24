import type { SQLInputValue, StatementSync } from 'node:sqlite'

export function jetzt(): string {
  return new Date().toISOString()
}

export function ausSqlBoolean(wert: unknown): boolean {
  return wert === 1 || wert === true
}

export function zuSqlBoolean(wert: boolean): number {
  return wert ? 1 : 0
}

export function alleZeilen<T>(stmt: StatementSync, ...werte: SQLInputValue[]): T[] {
  return stmt.all(...werte) as unknown as T[]
}

export function eineZeile<T>(stmt: StatementSync, ...werte: SQLInputValue[]): T | undefined {
  return stmt.get(...werte) as unknown as T | undefined
}
