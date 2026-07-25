export type TerminalPhase = 'scripted' | 'idle' | 'pulling' | 'done'

export const terminalState = {
  phase: 'scripted' as TerminalPhase,
  typedBuffer: '',
  submittedModel: '',
  pullProgress: 0,
  scriptedComplete: false,
  pullStartTime: 0,
}
