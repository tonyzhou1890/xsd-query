<template>
  <div class="font-sans text-xs color-gray bg-white">
    <div class="w-full flex items-center justify-center">
      <h1 class="text-4xl font-bold">Hello, XSD!</h1>
    </div>
    <el-button @click="handleLoadXSD" type="primary">load xsd</el-button>
    <el-button @click="handleLoadXML" type="primary">load xml</el-button>
    <el-button v-if="xsd && xml" @click="validate" type="primary">validate</el-button>

    <!-- <div class="xsd-playground">
      <el-row>
        <el-col :span="12">
          <TreeRow v-if="xsdRule" :item="xsdRule" @add-child="handleAddXSDRule" />
        </el-col>
        <el-col :span="12">
          <OpenScenarioEditor v-if="xsdRule" :parser="parser!" />
        </el-col>
      </el-row>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { XSDQuery, validateXML } from '../../../../src/index'
import * as xmllint from 'xmllint-wasm/index-browser'
import { ref } from 'vue'
// import { XSDRule } from './types'
// import TreeRow from './components/TreeRow.vue'
// import OpenScenarioEditor from './components/OpenScenarioEditor.vue'
import { ElButton, ElRow, ElCol } from 'element-plus'

let xsd = ref('')
let xml = ref('')
let parser: XSDQuery | null = null

const handleLoadXSD = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xsd'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const content = await file.text()
    xsd.value = content
    parser = new XSDQuery(content)
    console.log('Parsed XSD Schema:', parser)
    // const openScenario = parser.queryElement('OpenSCENARIO')[0]
    // if (openScenario) {
    //   xsdRule.value = {
    //     rule: openScenario,
    //     children: []
    //   }
    // }
  }
  input.click()
}

const handleLoadXML = () => {
  const input = document.createElement('input')
  input.type = 'file'
  // input.accept = '.xml'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const content = await file.text()
    xml.value = content
    console.log('Loaded XML:', content)
  }
  input.click()
}

const validate = async () => {
  if (!parser || !xml.value) return
  // const result = await validateXML(xml.value, xsd.value)
  const result = xmllint.validateXML({
    xml: xml.value,
    schema: xsd.value,
    normalization: 'format'
  })
  console.log('Validation Result:', result)
}

console.log('Index.vue loaded')

// const handleAddXSDRule = (parent: XSDRule) => {
//   const children = parser?.getChildren(parent.rule)
//   console.log('Children: ', parent.rule, children)
//   if (children) {
//     parent.children = children.children.map(child => ({
//       rule: child,
//       children: []
//     }))
//   }
// }

</script>

<style scoped>
</style>
