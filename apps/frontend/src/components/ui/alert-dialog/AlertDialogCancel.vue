<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogClose, type DialogCloseProps } from 'radix-vue'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<DialogCloseProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <DialogClose
    v-bind="delegatedProps"
    :class="cn(buttonVariants({ variant: 'outline' }), 'mt-2 md:mt-0', props.class)"
  >
    <slot />
  </DialogClose>
</template>
