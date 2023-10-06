import { atom } from 'jotai'
import type { CellPosition } from './types'

export const highlightingRowIdAtom = atom<string>('')
export const focusCellAtom = atom<CellPosition | null>(null)
