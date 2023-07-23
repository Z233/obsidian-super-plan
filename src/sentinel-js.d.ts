/**
 * @source https://github.com/pionxzh/chatgpt-exporter/blob/master/packages/userscript/src/sentinel-js.d.ts
 */
declare module 'sentinel-js' {
  export function on<T = HTMLElement>(
    cssSelectors: string | string[],
    callback: (el: T) => void
  ): void
  export function off<T = HTMLElement>(event: string | string[], callback: (el: T) => void): void
  export function reset(): void
}
