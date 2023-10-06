import { resolve } from 'node:path'

export const r = (...args: string[]) => resolve(__dirname, '..', ...args)
// eslint-disable-next-line node/prefer-global/process
export const isDev = process.env.NODE_ENV !== 'production'
