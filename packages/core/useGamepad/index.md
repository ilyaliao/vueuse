---
category: Browser
---

# useGamepad

Provides reactive bindings for the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API).

## Usage

> Due to how the Gamepad API works, you must interact with the page using the gamepad before it will be detected.

```vue
<script setup lang="ts">
import { useGamepad } from '@vueuse/core'
import { computed } from 'vue'

const { isSupported, gamepads } = useGamepad()
const gamepad = computed(() => gamepads.value.find(g => g.mapping === 'standard'))
</script>

<template>
  <span>
    {{ gamepad.id }}
  </span>
</template>
```

### Gamepad Updates

Currently the Gamepad API does not have event support to update the state of the gamepad. To update the gamepad state, `requestAnimationFrame` is used to poll for gamepad changes. You can control this polling by using the `pause` and `resume` functions provided by `useGamepad`

```ts
import { useGamepad } from '@vueuse/core'

const { pause, resume, gamepads } = useGamepad()

pause()

// gamepads object will not update

resume()

// gamepads object will update on user input
```

### Gamepad Connect & Disconnect Events

The `onConnected` and `onDisconnected` events will trigger when a gamepad is connected or disconnected.

```ts
import { useGamepad } from '@vueuse/core'
// ---cut---
const { gamepads, onConnected, onDisconnected } = useGamepad()

onConnected((index) => {
  console.log(`${gamepads.value[index].id} connected`)
})

onDisconnected((index) => {
  console.log(`${index} disconnected`)
})
```

### Vibration

> The Gamepad Haptics API is sparse, so check the [compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator#browser_compatibility) before using.

<!-- eslint-disable import/first -->

```ts
import { useGamepad } from '@vueuse/core'

const { gamepads, onConnected, onDisconnected } = useGamepad()
const gamepad = gamepads.value[0]!
// ---cut---
import { computed } from 'vue'

const supportsVibration = computed(() => gamepad.hapticActuators.length > 0)
function vibrate() {
  if (supportsVibration.value) {
    const actuator = gamepad.hapticActuators[0]
    actuator.playEffect('dual-rumble', {
      startDelay: 0,
      duration: 1000,
      weakMagnitude: 1,
      strongMagnitude: 1,
    })
  }
}
```

### Mappings

To make the Gamepad API easier to use, we provide mappings to map a controller to a controllers button layout.

#### Xbox360 Controller

```vue
<script setup>
import { mapGamepadToXbox360Controller } from '@vueuse/core'

const controller = mapGamepadToXbox360Controller(gamepad)
</script>

<template>
  <span>{{ controller.buttons.a.pressed }}</span>
  <span>{{ controller.buttons.b.pressed }}</span>
  <span>{{ controller.buttons.x.pressed }}</span>
  <span>{{ controller.buttons.y.pressed }}</span>
</template>
```

Currently there are only mappings for the Xbox 360 controller. If you have controller you want to add mappings for, feel free to open a PR for more controller mappings!

### SSR Compatibility

This component is designed to be used in the client side. In some cases, SSR might cause some hydration mismatches.

If you are using Nuxt, you can simply rename your component file with the `.client.vue` suffix (e.g., `GamepadComponent.client.vue`) which will automatically make it render only on the client side, avoiding hydration mismatches.

In other frameworks or plain Vue, you can wrap your usage component with a `<ClientOnly>` component to ensure it is only rendered on the client side.
