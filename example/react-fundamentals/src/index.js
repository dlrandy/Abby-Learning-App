import './styles.css'
import codegen from 'codegen.macro'

// eslint-disable-next-line
codegen`module.exports = require('Abby-Learning-App/codegen')({
  options: {concurrentMode: true},
})`
