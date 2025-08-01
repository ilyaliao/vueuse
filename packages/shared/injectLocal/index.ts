import { getCurrentInstance, hasInjectionContext, inject } from 'vue'
import { localProvidedStateMap } from '../provideLocal/map'

/**
 * On the basis of `inject`, it is allowed to directly call inject to obtain the value after call provide in the same component.
 *
 * @example
 * ```ts
 * injectLocal('MyInjectionKey', 1)
 * const injectedValue = injectLocal('MyInjectionKey') // injectedValue === 1
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
// @ts-expect-error overloads are not compatible
export const injectLocal: typeof inject = (...args) => {
  const key = args[0] as string | symbol
  const instance = getCurrentInstance()?.proxy
  if (instance == null && !hasInjectionContext())
    throw new Error('injectLocal must be called in setup')

  if (instance && localProvidedStateMap.has(instance) && key in localProvidedStateMap.get(instance)!)
    return localProvidedStateMap.get(instance)![key]

  // @ts-expect-error overloads are not compatible
  return inject(...args)
}
