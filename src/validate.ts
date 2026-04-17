import * as xmllint from 'xmllint-wasm/index-browser'

/**
 * 校验 xml
 */
function validateXML(xml: string, xsd: string) {
  return xmllint.validateXML({
    xml,
    schema: xsd
  })
}

export default validateXML