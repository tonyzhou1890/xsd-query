<template>
  <div class="tree-row">
    <div class="tree-header flex items-center">{{ item.rule.name }}<button class="ml-2 cursor-pointer" @click="addChild">+</button></div>
    <div class="tree-children">
      <TreeRow v-for="child in item.children" :key="child.rule.name" :item="child" @add-child="$emit('add-child', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { XSDRule } from '../types';

const props = defineProps<{
  item: XSDRule
}>()

const emit = defineEmits<{
  (e: 'add-child', parent: XSDRule): void
}>()

const addChild = () => {
  emit('add-child', props.item)
}
</script>

<style scoped>
.tree-children {
  padding-left: 20px;
}
</style>