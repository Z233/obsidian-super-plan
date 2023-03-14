import { forwardRef, useEffect, useRef, type FC, type ForwardedRef } from 'preact/compat'
import type { JSX } from 'preact/jsx-runtime'
import { getIcon } from 'obsidian'
import clsx from 'clsx'

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

export const DefaultButton = forwardRef(
  (props: JSX.HTMLAttributes<HTMLButtonElement>, ref: ForwardedRef<HTMLButtonElement>) => {
    const { ref: unused, ...rest } = props

    return (
      <button
        ref={ref}
        style={{
          all: 'unset',
        }}
        {...rest}
      />
    )
  }
)

export const Icon: FC<
  JSX.HTMLAttributes<HTMLSpanElement> & {
    svg: SVGSVGElement
  }
> = (props) => {
  const { className, ref: _, svg, ...rest } = props
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.appendChild(svg)
    }
  }, [])

  return <span ref={wrapperRef} className={clsx('flex [&>svg]:m-auto', className)} {...rest}></span>
}
