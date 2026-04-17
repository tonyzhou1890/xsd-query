export { default as XSDQuery } from './xsd'
export { default as validateXML } from './validate'

import pkg from '../package.json'
export const VERSION = pkg.version
console.log(`%c simrenderer version: ${VERSION}`, 'color: green; font-weight: bold;')
