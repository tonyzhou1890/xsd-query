export type IndicatorTag = 'sequence' | 'choice' | 'union' | 'all'

export interface XSDRule {
  rule: IndicatorTag | ''
  children: XSDQuery[]
}

export const indicatorTags: IndicatorTag[] = ['sequence', 'all', 'union', 'choice']

class XSDQuery {
  node: HTMLElement
  name: string

  constructor(xsd: string | Element) {
    if (typeof xsd === 'string') {
      const parser = new DOMParser()
      this.node = parser.parseFromString(xsd, 'application/xml').documentElement
    } else {
      this.node = xsd as HTMLElement
    }
    this.name = this.node.getAttribute('name') || this.node.getAttribute('ref') || ''
  }

  getSelfTag(): string {
    return this.node.localName
  }

  getElement(name: string, deep: boolean = true): XSDQuery | undefined {
    if (!deep) {
      const elements = Array.from(this.node.children).filter(el => el.tagName === 'element' && (el.getAttribute('name') === name))
      return elements.length > 0 ? new XSDQuery(elements[0]) : undefined
    }
    const query = 'element[name="' + name + '"]'
    const element = this.node.querySelector(query)
    return element ? new XSDQuery(element) : undefined
  }

  getElements(name: string, deep: boolean = true): XSDQuery[] {
    if (!deep) {
      const elements = Array.from(this.node.children).filter(el => el.tagName === 'element' && (name === '*' || el.getAttribute('name') === name))
      return elements.map(el => new XSDQuery(el))
    }
    const query = name === '*' ? 'element' : 'element[name="' + name + '"]'
    const elements = this.node.querySelectorAll(query)
    return Array.from(elements).map(el => new XSDQuery(el))
  }

  getType(type: string): XSDQuery | undefined {
    const query = 'simpleType[name="' + type + '"], complexType[name="' + type + '"], group[name="' + type + '"]'
    const types = this.node.querySelectorAll(query)
    return types.length > 0 ? new XSDQuery(types[0]) : undefined
  }

  getTypes(type: string): XSDQuery[] {
    const query = type === '*' ? 'simpleType, complexType, group' : 'simpleType[name="' + type + '"], complexType[name="' + type + '"], group[name="' + type + '"]'
    const types = this.node.querySelectorAll(query)
    return Array.from(types).map(el => new XSDQuery(el))
  }

  getRoot() {
    const root = this.node.ownerDocument.documentElement
    return new XSDQuery(root)
  }

  getChildrenRule(): IndicatorTag | '' {
    // 自身就是一个模型组，直接使用自身的标签作为规则
    if (this.node.localName && indicatorTags.includes(this.node.localName as IndicatorTag)) {
      return this.node.localName as IndicatorTag
    }

    let children: Element[] = []
    let modelGroup: Element | null = null
    // Check if the current node has a 'type' attribute
    const type = this.node.getAttribute('type')
    if (type) {
      const node = this.getRoot().getType(type)
      if (node) {
        const typeNode = node
        children = Array.from(typeNode.node.children).filter(child => child.localName !== 'attribute')
      } else {
        console.warn(`Type "${type}" not found in the schema.`)
      }
    } else {
      children = Array.from(this.node.children).filter(child => child.localName !== 'attribute')
    }

    modelGroup = children.find(child => indicatorTags.includes(child.localName as IndicatorTag)) || null

    return modelGroup ? (modelGroup.localName as IndicatorTag) : ''
  }

  getChildren(): XSDQuery[] {
    let children: Element[] = []
    // Check if the current node has a 'type' attribute
    const type = this.node.getAttribute('type')
    if (type) {
      const node = this.getRoot().getType(type)
      if (node) {
        const typeNode = node
        children = Array.from(typeNode.node.children).filter(child => child.localName !== 'attribute')
      } else {
        console.warn(`Type "${type}" not found in the schema.`)
      }
    } else {
      children = Array.from(this.node.children).filter(child => child.localName !== 'attribute')
    }
    const modelGroup = children.find(child => indicatorTags.includes(child.localName as IndicatorTag)) || null
    if (modelGroup) {
      children = Array.from(modelGroup.children)
    }
    return children.map(child => {
      if (child.getAttribute('ref')) {
        const refName = child.getAttribute('ref')!
        const refNode = this.getRoot().getType(refName)
        if (refNode) {
          // const children = Array.from(refNode.node.children).filter(child => child.localName !== 'attribute')
          // if (children.length > 0) {
          //   return new XSDQuery(children[0])
          // }
          return refNode
        } else {
          console.warn(`Referenced element "${refName}" not found in the schema.`)
          return new XSDQuery(child).getChildren()
        }
      } else {
        return new XSDQuery(child)
      }
    }).filter(child => child instanceof XSDQuery) as XSDQuery[]
  }

  getAttributes(): XSDQuery[] {
    let attributes: Element[] = []
    
    const type = this.node.getAttribute('type')
    if (type) {
      const node = this.getRoot().getType(type)
      if (node) {
        const typeNode = node
        attributes = Array.from(typeNode.node.children).filter(child => child.localName === 'attribute')
      } else {
        console.warn(`Type "${type}" not found in the schema.`)
      }
    } else {
      attributes = Array.from(this.node.children).filter(child => child.localName === 'attribute')
    }
    
    return attributes.map(attr => new XSDQuery(attr))
  }

  getAttributeInfo() {
    if (this.node.localName !== 'attribute') {
      throw new Error('Current node is not an attribute')
    }
    const name = this.node.getAttribute('name') || ''
    const type = this.node.getAttribute('type') || ''
    if (type) {
      const typeNode = this.getRoot().getType(type)
      if (typeNode) {
        return {
          name,
          type,
          typeNode
        }
      } else {
        console.warn(`Type "${type}" not found in the schema.`)
        return { name, type }
      }
    }
  }

  getEnum() {
    const enumarations = this.node.querySelectorAll('enumeration')
    return Array.from(enumarations).map(en => en.getAttribute('value') || '')
  }
}

export default XSDQuery