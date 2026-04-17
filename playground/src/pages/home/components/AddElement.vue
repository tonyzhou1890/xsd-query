<template>
  <el-dialog title="Add Element" @close="$emit('close')">
    <div>
      <p>Parent: {{ rule.rule.name }}</p>
      <el-tree
        ref="treeRef"
        :data="children"
        show-checkbox
        check-strictly
        :default-expand-all="true"
        node-key="id"
        @check-change="handleCheckChange"
      >
        <template #default="{ node, data }">
          <span>{{ data.rule.name }}</span>
        </template>
      </el-tree>
      <!-- 这里可以添加更多的输入字段来设置新元素的属性 -->
      <el-button
        :disabled="checkedId <= 0"
        type="primary" 
        @click="handleAdd"
        >Add</el-button
      >
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElDialog, ElTree, ElButton } from 'element-plus';
import { XSDRule } from '../types';
import XSDParser, { XSDElement } from '../../../core/xsd';

const props = defineProps<{
  rule: XSDRule; // 这里可以根据实际情况定义类型
  parser: XSDParser
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'add-child', rule: XSDRule): void;
}>()

let id = 1
const idMap: Record<number, TreeNode> = {}

interface TreeNode extends XSDRule {
  id: number;
  disabled: boolean;
}

const children = ref<(TreeNode)[]>([] as any[])

const treeRef = ref<InstanceType<typeof ElTree>>()
const checkedId = ref<number>(-1)

const handleCheckChange = (data: any, checked: boolean) => {
  console.log('Checked node: ', data, 'Checked: ', checked)
  if (checked) {
    checkedId.value = data.id;
    treeRef.value!.setCheckedKeys([data.id]);
  } else {
    checkedId.value = -1;
    treeRef.value!.setCheckedKeys([]);
  }
}

onMounted(() => {
  console.log('AddElement.vue mounted with rule: ', props.rule)
  if (props.rule) {
    const childrenData = loadChildren({
      ...props.rule,
      id: 0,
      disabled: false
    })
    console.log('Fetched children: ', childrenData)
    children.value = childrenData
  }
})

function loadChildren(node: TreeNode) {
  console.log('Loading children for node: ', node)
  const data = node.rule as XSDElement
  let children: TreeNode[] = []

  const childrenData = props.parser.getChildren(data)
  children = childrenData.children.map((child) => {
    const childNode: TreeNode = {
      id: id++,
      disabled: !child.isElement,
      rule: child,
      children: []
    }
    idMap[childNode.id] = childNode
    if (!child.isElement) {
      childNode.children = loadChildren(childNode)
    }
    return childNode
  })

  return children
}

function handleAdd() {
  if (props.rule) {
    const selectedChild = idMap[checkedId.value];
    if (selectedChild) {
      emit('add-child', selectedChild);
    }
  }
}
</script>
