function xmlAsStringPlugin() {
  return {
    name: 'xml-as-string',
    transform(src, id) {
      if (id.endsWith('.xml')) {
        // 将 xml 文件内容导出为字符串
        return {
          code: `export default ${JSON.stringify(src)};`,
          map: null,
        }
      }
    },
  }
}

export default xmlAsStringPlugin
