// Helpers para abrir o command palette de qualquer componente. Mora em
// arquivo separado pra não quebrar o react-refresh do CommandPalette.tsx
// (que só pode exportar componentes pra fast refresh funcionar).

export const COMMAND_PALETTE_OPEN_EVENT = 'open-command-palette'

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
}
