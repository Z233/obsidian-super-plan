import type { JSX } from 'preact/jsx-runtime'

export const DefaultInput = (props: JSX.HTMLAttributes<HTMLInputElement>) => (
  <input
    style={{
      all: 'unset',
    }}
    {...props}
  />
)
