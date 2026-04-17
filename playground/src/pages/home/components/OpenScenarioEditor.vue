<template>
  <el-tree
    :data="dataSource"
    node-key="id"
    default-expand-all
    :expand-on-click-node="false"
  >
    <template #default="{ node, data }: { node: any; data: TreeNode }">
      <div class="custom-tree-node flex items-center">
        <span>{{ data.tag }}</span>
        <div>
          <el-button
            style="margin-left: 4px"
            v-if="data.allowChildren"
            type="primary"
            size="small"
            round
            @click="edit(data)"
            :icon="Edit"
          >
          </el-button>
          <el-button
            style="margin-left: 4px"
            v-if="data.allowChildren"
            type="primary"
            size="small"
            round
            @click="add(data)"
          >
            +
          </el-button>
          <el-button
            v-if="node.level > 1"
            style="margin-left: 4px"
            type="danger"
            size="small"
            round
            @click="remove(node, data)"
          >
            -
          </el-button>
        </div>
      </div>
    </template>
  </el-tree>

  <AddElement
    v-if="addElementDialog.visible"
    v-model="addElementDialog.visible"
    :rule="addElementDialog.rule!"
    :parser="props.parser"
    @close="addElementDialog.visible = false"
    @add-child="(rule) => {
      if (addElementDialog.parent) {
        addElementDialog.parent.children.push(buildTreeNode(rule))
      }
      addElementDialog.visible = false
    }"
  />

  <EditElement
    v-if="editElementDialog.visible"
    v-model="editElementDialog.visible"
    :rule="editElementDialog.node!.rule"
    :attributes="editElementDialog.node!.attributes || []"
    :parser="props.parser"
    @close="editElementDialog.visible = false"
    @ok="(attributes) => {
      if (editElementDialog.node) {
        editElementDialog.node.attributes = attributes
      }
      editElementDialog.visible = false
    }"
  />
</template>

<script setup lang="ts">
import { XSDParser, XSDElement } from "../../../core/xsd";
import { XSDRule, TreeNode } from "../types";
import { buildTreeNode } from "../utils";
import { ElTree, ElButton } from "element-plus";
import { Edit } from "@element-plus/icons-vue";
import AddElement from "./AddElement.vue";
import EditElement from "./EditElement.vue";

const props = defineProps<{
  parser: XSDParser;
}>();

const dataSource = ref<TreeNode[]>([]);

const editElementDialog = ref({
  visible: false,
  node: null as TreeNode | null,
});

function edit(node: TreeNode) {
  editElementDialog.value.node = node;
  editElementDialog.value.visible = true;
}

const addElementDialog = ref({
  visible: false,
  parent: null as TreeNode | null,
  rule: null as XSDRule | null,
});

function add(parent: TreeNode) {
  // 如果是 sequence，按顺序添加子节点--先不限制，比较复杂
  addElementDialog.value.parent = parent;
  addElementDialog.value.rule = parent.rule;
  addElementDialog.value.visible = true;
}

function remove(node: any, data: TreeNode) {
  console.log("Removing node: ", node, data);
  const parent = node.parent;
  if (parent) {
    const index = parent.data.children.findIndex(
      (child: TreeNode) => child.id === data.id,
    );
    if (index !== -1) {
      parent.data.children.splice(index, 1);
    }
  } else {
    const index = dataSource.value.findIndex((item) => item.id === data.id);
    if (index !== -1) {
      dataSource.value.splice(index, 1);
    }
  }
}

onMounted(() => {
  const openScenarioRule = props.parser.getElement("OpenSCENARIO");
  if (openScenarioRule) {
    dataSource.value = [
      buildTreeNode({
        rule: openScenarioRule,
        children: [],
      }),
    ];
  }
});
</script>
