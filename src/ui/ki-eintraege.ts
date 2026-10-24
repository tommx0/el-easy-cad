import type { KiStatus } from '../document-model'

const SERVER_NAME = 'eleasycad'
const TOKEN_UMGEBUNG = 'EL_EASY_CAD_MCP_TOKEN'

export function claudeCodeBefehl(status: Pick<KiStatus, 'mcpAdresse' | 'token'>): string {
  return `claude mcp add --scope user --transport http ${SERVER_NAME} ${status.mcpAdresse} --header "Authorization: Bearer ${status.token ?? ''}"`
}

export function claudeDesktopKonfiguration(status: Pick<KiStatus, 'stdio' | 'token'>): string {
  return JSON.stringify(
    {
      mcpServers: {
        [SERVER_NAME]: {
          command: status.stdio.befehl,
          args: status.stdio.argumente,
          env: { [TOKEN_UMGEBUNG]: status.token ?? '' },
        },
      },
    },
    null,
    2,
  )
}
