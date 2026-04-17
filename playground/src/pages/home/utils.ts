import { XSDRule, TreeNode, AttributeNode } from './types';

let nodeId = 1; // 用于生成唯一的节点ID

export function buildTreeNode(rule: XSDRule): TreeNode {
  return {
    id: nodeId++,
    tag: rule.rule.name,
    attributes: [], // 这里可以根据需要填充属性
    rule,
    children: [],
    allowChildren: true, // 根据规则类型设置是否允许添加子节点
  };
}

export function buildAttributeNode(name: string, type: string, value: any): AttributeNode {
  return {
    id: nodeId++,
    name,
    type,
    value,
  };
}