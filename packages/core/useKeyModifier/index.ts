import type { ShallowRef } from 'vue'
import type { ConfigurableDocument } from '../_configurable'
import type { WindowEventName } from '../useEventListener'
import { shallowRef } from 'vue'
import { defaultDocument } from '../_configurable'
import { useEventListener } from '../useEventListener'

export type KeyModifier = 'Alt' | 'AltGraph' | 'CapsLock' | 'Control' | 'Fn' | 'FnLock' | 'Meta' | 'NumLock' | 'ScrollLock' | 'Shift' | 'Symbol' | 'SymbolLock'

const defaultEvents: WindowEventName[] = ['mousedown', 'mouseup', 'keydown', 'keyup']

export interface UseModifierOptions<Initial> extends ConfigurableDocument {
  /**
   * Event names that will prompt update to modifier states
   *
   * @default ['mousedown', 'mouseup', 'keydown', 'keyup']
   */
  events?: WindowEventName[]

  /**
   * Initial value of the returned ref
   *
   * @default null
   */
  initial?: Initial
}

export type UseKeyModifierReturn<Initial> = ShallowRef<Initial extends boolean ? boolean : boolean | null>

/* @__NO_SIDE_EFFECTS__ */
export function useKeyModifier<Initial extends boolean | null>(modifier: KeyModifier, options: UseModifierOptions<Initial> = {}): UseKeyModifierReturn<Initial> {
  const {
    events = defaultEvents,
    document = defaultDocument,
    initial = null,
  } = options

  const state = shallowRef(initial) as ShallowRef<boolean>

  if (document) {
    events.forEach((listenerEvent) => {
      useEventListener(document, listenerEvent, (evt: KeyboardEvent | MouseEvent) => {
        if (typeof evt.getModifierState === 'function')
          state.value = evt.getModifierState(modifier)
      }, { passive: true })
    })
  }

  return state
}
