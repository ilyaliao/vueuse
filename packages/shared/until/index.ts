import type { WatchOptions, WatchSource } from 'vue'
import type { ElementOf, MaybeRefOrGetter, ShallowUnwrapRef } from '../utils'
import { isRef, nextTick, toValue, watch } from 'vue'
import { promiseTimeout } from '../utils'

export interface UntilToMatchOptions {
  /**
   * Milliseconds timeout for promise to resolve/reject if the when condition does not meet.
   * 0 for never timed out
   *
   * @default 0
   */
  timeout?: number

  /**
   * Reject the promise when timeout
   *
   * @default false
   */
  throwOnTimeout?: boolean

  /**
   * `flush` option for internal watch
   *
   * @default 'sync'
   */
  flush?: WatchOptions['flush']

  /**
   * `deep` option for internal watch
   *
   * @default 'false'
   */
  deep?: WatchOptions['deep']
}

export interface UntilBaseInstance<T, Not extends boolean = false> {
  toMatch: (<U extends T = T>(
    condition: (v: T) => v is U,
    options?: UntilToMatchOptions
  ) => Not extends true ? Promise<Exclude<T, U>> : Promise<U>) & ((
    condition: (v: T) => boolean,
    options?: UntilToMatchOptions
  ) => Promise<T>)
  changed: (options?: UntilToMatchOptions) => Promise<T>
  changedTimes: (n?: number, options?: UntilToMatchOptions) => Promise<T>
}

type Falsy = false | void | null | undefined | 0 | 0n | ''

export interface UntilBaseValueInstance<T, Not extends boolean = false> extends UntilBaseInstance<T, Not> {
  toBe: <P = T>(value: MaybeRefOrGetter<P>, options?: UntilToMatchOptions) => Not extends true ? Promise<T> : Promise<P>
  toBeTruthy: (options?: UntilToMatchOptions) => Not extends true ? Promise<T & Falsy> : Promise<Exclude<T, Falsy>>
  toBeNull: (options?: UntilToMatchOptions) => Not extends true ? Promise<Exclude<T, null>> : Promise<null>
  toBeUndefined: (options?: UntilToMatchOptions) => Not extends true ? Promise<Exclude<T, undefined>> : Promise<undefined>
  toBeNaN: (options?: UntilToMatchOptions) => Promise<T>
}

export interface UntilValueInstanceWithNot<T, Not extends boolean = false> extends UntilBaseValueInstance<T, Not> {
  readonly not: UntilBaseValueInstance<T, Not extends true ? false : true>
}

export type UntilValueInstance<T, WithNot extends boolean = true> = WithNot extends true ? UntilValueInstanceWithNot<T> : UntilBaseValueInstance<T>

export interface UntilBaseArrayInstance<T> extends UntilBaseInstance<T> {
  toContains: (value: MaybeRefOrGetter<ElementOf<ShallowUnwrapRef<T>>>, options?: UntilToMatchOptions) => Promise<T>
}

export interface UntilArrayInstanceWithNot<T> extends UntilBaseArrayInstance<T> {
  readonly not: UntilBaseArrayInstance<T>
}

export type UntilArrayInstance<T, WithNot extends boolean = true> = WithNot extends true ? UntilArrayInstanceWithNot<T> : UntilBaseArrayInstance<T>

function createUntil<T>(r: any, isNot = false, notWithNot = false) {
  function toMatch(
    condition: (v: any) => boolean,
    { flush = 'sync', deep = false, timeout, throwOnTimeout }: UntilToMatchOptions = {},
  ): Promise<T> {
    let stop: (() => void) | null = null
    const watcher = new Promise<T>((resolve) => {
      stop = watch(
        r,
        (v) => {
          if (condition(v) !== isNot) {
            if (stop)
              stop()
            else
              nextTick(() => stop?.())
            resolve(v)
          }
        },
        {
          flush,
          deep,
          immediate: true,
        },
      )
    })

    const promises = [watcher]
    if (timeout != null) {
      promises.push(
        promiseTimeout(timeout, throwOnTimeout)
          .then(() => toValue(r))
          .finally(() => stop?.()),
      )
    }

    return Promise.race(promises)
  }

  function toBe<P>(value: MaybeRefOrGetter<P | T>, options?: UntilToMatchOptions) {
    if (!isRef(value))
      return toMatch(v => v === value, options)

    const { flush = 'sync', deep = false, timeout, throwOnTimeout } = options ?? {}
    let stop: (() => void) | null = null
    const watcher = new Promise<T>((resolve) => {
      stop = watch(
        [r, value],
        ([v1, v2]) => {
          if (isNot !== (v1 === v2)) {
            if (stop)
              stop()
            else
              nextTick(() => stop?.())
            resolve(v1)
          }
        },
        {
          flush,
          deep,
          immediate: true,
        },
      )
    })

    const promises = [watcher]
    if (timeout != null) {
      promises.push(
        promiseTimeout(timeout, throwOnTimeout)
          .then(() => toValue(r))
          .finally(() => {
            stop?.()
            return toValue(r)
          }),
      )
    }

    return Promise.race(promises)
  }

  function toBeTruthy(options?: UntilToMatchOptions) {
    return toMatch(v => Boolean(v), options)
  }

  function toBeNull(options?: UntilToMatchOptions) {
    return toBe<null>(null, options)
  }

  function toBeUndefined(options?: UntilToMatchOptions) {
    return toBe<undefined>(undefined, options)
  }

  function toBeNaN(options?: UntilToMatchOptions) {
    return toMatch(Number.isNaN, options)
  }

  function toContains(
    value: any,
    options?: UntilToMatchOptions,
  ) {
    return toMatch((v) => {
      const array = Array.from(v as any)
      return array.includes(value) || array.includes(toValue(value))
    }, options)
  }

  function changed(options?: UntilToMatchOptions) {
    return changedTimes(1, options)
  }

  function changedTimes(n = 1, options?: UntilToMatchOptions) {
    let count = -1 // skip the immediate check
    return toMatch(() => {
      count += 1
      return count >= n
    }, options)
  }

  if (Array.isArray(toValue(r))) {
    const baseInstance: UntilBaseArrayInstance<T> = {
      toMatch: toMatch as any,
      toContains,
      changed,
      changedTimes,
    }

    if (notWithNot) {
      return baseInstance
    }
    else {
      const instanceWithNot: UntilArrayInstanceWithNot<T> = {
        ...baseInstance,
        get not() {
          return createUntil(r, !isNot, true) as UntilBaseArrayInstance<T>
        },
      }
      return instanceWithNot
    }
  }
  else {
    const baseInstance: UntilBaseValueInstance<T, boolean> = {
      toMatch: toMatch as any,
      toBe,
      toBeTruthy: toBeTruthy as any,
      toBeNull: toBeNull as any,
      toBeNaN,
      toBeUndefined: toBeUndefined as any,
      changed,
      changedTimes,
    }

    if (notWithNot) {
      return baseInstance
    }
    else {
      const instanceWithNot: UntilValueInstanceWithNot<T, boolean> = {
        ...baseInstance,
        get not() {
          return createUntil(r, !isNot, true) as UntilBaseValueInstance<T, boolean>
        },
      }

      return instanceWithNot
    }
  }
}

/**
 * Promised one-time watch for changes
 *
 * @see https://vueuse.org/until
 * @example
 * ```
 * const { count } = useCounter()
 *
 * await until(count).toMatch(v => v > 7)
 *
 * alert('Counter is now larger than 7!')
 * ```
 */
export function until<T extends unknown[]>(r: WatchSource<T> | MaybeRefOrGetter<T>): UntilArrayInstanceWithNot<T>
export function until<T>(r: WatchSource<T> | MaybeRefOrGetter<T>): UntilValueInstanceWithNot<T>
export function until<T>(r: any): UntilValueInstanceWithNot<T> | UntilArrayInstanceWithNot<T> {
  return createUntil(r) as UntilValueInstanceWithNot<T> | UntilArrayInstanceWithNot<T>
}
