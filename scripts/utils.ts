import { resolve } from 'path'

export const r = (...args: string[]) => resolve(__dirname, '..', ...args)
export const isDev = process.env.NODE_ENV !== 'production'
