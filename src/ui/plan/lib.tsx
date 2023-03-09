import { forwardRef, type ForwardedRef } from 'preact/compat'
import type { JSX } from 'preact/jsx-runtime'

export const DefaultInput = forwardRef(
  (props: JSX.HTMLAttributes<HTMLInputElement>, ref: ForwardedRef<HTMLInputElement>) => {
    const { ref: unused, ...rest } = props

    return (
      <input
        ref={ref}
        style={{
          all: 'unset',
        }}
        {...rest}
      />
    )
  }
)
