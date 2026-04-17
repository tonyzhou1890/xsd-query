<template>
  <el-dialog title="Edit Element" @close="$emit('close')">
    <div>
      <p>Element: {{ rule.rule.name }}</p>
      <!-- 这里可以添加更多的输入字段来编辑元素的属性 -->
      <el-form :model="attributeList" label-width="auto" style="max-width: 600px">
        <el-form-item v-for="item in attributeList" :key="item.id" :label="item.name">
          <el-input v-model="item.value" />
        </el-form-item>
      </el-form>
      <!-- 这里可以添加更多的输入字段来设置新元素的属性 -->
      <el-button
        type="primary" 
        @click="handleOk"
        >Ok</el-button
      >
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { XSDRule, AttributeNode } from '../types';
import { buildAttributeNode } from '../utils';
import XSDParser, { XSDElement } from '../../../core/xsd';

const props = defineProps<{
  rule: XSDRule; // 这里可以根据实际情况定义类型
  attributes: AttributeNode[];
  parser: XSDParser
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'ok', attributes: AttributeNode[]): void;
}>()

interface TreeNode extends XSDRule {
  id: number;
  disabled: boolean;
}

const attributeList = ref<AttributeNode[]>([])

onMounted(() => {
  initAttributes()
})

function initAttributes() {
  if (props.rule) {
    const element = props.rule.rule as XSDElement
    const xsdNode = element.XSDNode
    attributeList.value = structuredClone(toRaw(props.attributes))
    // 这里可以根据元素的属性定义来初始化属性列表
    const allAttributes = element.getAttributes()
    for (const attr of allAttributes) {
      if (!attributeList.value.find(a => a.name === attr.name)) {
        attributeList.value.push(buildAttributeNode(attr.name, attr.type, ''))
      }
    }
    console.log('Initialized attributes: ', attributeList.value, xsdNode)
  }
}

function handleOk() {
  if (props.rule) {
    emit('ok', attributeList.value);
  }
}
</script>
