---
category: Browser
---

# useTitle

Reactive document title.

::: warning
This composable isn't compatible with SSR.
:::

## Usage

```js
import { useTitle } from '@vueuse/core'

const title = useTitle()
console.log(title.value) // print current title
title.value = 'Hello' // change current title
```

Set initial title immediately:

```js
const title = useTitle('New Title')
```

Pass a `ref` and the title will be updated when the source ref changes:

```js
import { shallowRef } from 'vue'
import { useTitle } from '@vueuse/core'

const messages = shallowRef(0)

const title = computed(() => {
  return !messages.value ? 'No message' : `${messages.value} new messages`
})

useTitle(title) // document title will match with the ref "title"
```

Pass an optional template tag [Vue Meta Title Template](https://vue-meta.nuxtjs.org/guide/metainfo.html) to update the title to be injected into this template:

```js
const title = useTitle('New Title', { titleTemplate: '%s | My Awesome Website' })
```

::: warning
`observe` is incompatible with `titleTemplate`.
:::
