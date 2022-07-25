const _ = require('lodash')

const { resolver } = require('@adonisjs/fold')
const CE = require('@adonisjs/validator/src/Exceptions')
const MiddlewareValidator = require('@adonisjs/validator/src/Middleware/Validator')

class StrictMiddlewareValidator extends MiddlewareValidator {
  constructor (Validator) {
    super(Validator)
  }

  /**
   * Handle method executed by adonis middleware chain
   *
   * @method handle
   * @async
   *
   * @param  {Object}   ctx
   * @param  {Function} next
   * @param  {Array}   validator
   *
   * @return {void}
   */
  async handle (ctx, next, validator) {
    validator = validator instanceof Array === true ? validator[0] : validator

    if (!validator) {
      throw new Error('Cannot validate request without a validator. Make sure to call Route.validator(\'validatorPath\')')
    }

    const validatorInstance = resolver.forDir('validators').resolve(validator)

    /**
     * Run strict validation on request data
     */
    this._runNoEmptyValidation(ctx, validatorInstance)

    /**
     * Run strict validation on request data
     */
    this._runStrictValidation(ctx, validatorInstance)

    /**
     * All good, so continue to parent method
     */
    await super.handle(ctx, next, validator)
  }

  /**
   * Validates that there is no extra body/query data 
   * else than the one set in the validator instance rules
   * on the current request.
   *
   * @method _runNoEmptyValidation
   *
   * @param  {Object}        ctx
   * @param  {Object}        validatorInstance
   *
   * @return {void}
   *
   * @throws {ValidationException}
   *
   * @private
   */
  _runNoEmptyValidation (ctx, validatorInstance) {
    if (typeof validatorInstance.noEmpty === 'boolean' && validatorInstance.noEmpty) {
      const body = ctx.request.all()
      const fields = Object.keys(body)

      if (fields.length > 0) return
      
      const message = this._computedValidationMessage(
        validatorInstance, 
        'strict_no_empty', 
        'strict_no_empty validation failed on request'
      )

      throw CE.ValidationException.validationFailed([{
        message,
        validation: 'strict_no_empty',
      }])
    }
  }

  /**
   * Validates that there is no extra body/query data 
   * else than the one set in the validator instance rules
   * on the current request.
   *
   * @method _runStrictValidation
   *
   * @param  {Object}        ctx
   * @param  {Object}        validatorInstance
   *
   * @return {void}
   *
   * @throws {ValidationException}
   *
   * @private
   */
  _runStrictValidation (ctx, validatorInstance) {
    if (typeof validatorInstance.strict === 'boolean' && validatorInstance.strict) {
      const body = ctx.request.all()
      const fields = Object.keys(body)

      /**
       * Indicative uses dot notation to target nested properties inside objects and arrays.
       * Therefore, using Object.keys on validatorInstance.rules would cause sub-level keys 
       * to be accepted as top-level string keys.
       * 
       * e.g.
       * 
       * { name: '...', address: '...', address.street': '...' } -> flat
       * 
       * { name: '...', address: { street: '...' } } -> unflatten
       * 
       * ['name', 'address'] -> result
       * 
       * If validatorInstance.rules was left as is, 'address.street' wouldn't 
       * be considered a wrongField and would bypass the strict validation.
       */
      const availableFields = Object.keys(
        _.reduce(_.keys(validatorInstance.rules), function (result, key) {
          return _.set(result, key, validatorInstance.rules[key])
        } ,{})
      )
      
      let wrongFields = []
      if (validatorInstance.rules && availableFields.length > 0) {
        wrongFields = fields.filter(f => availableFields.indexOf(f) < 0)
      } else {
        wrongFields = fields
      }

      const message = this._computedValidationMessage(
        validatorInstance, 
        'strict_fields', 
        'strict validation failed on field',
        [ wrongFields ]
      )
          
      if (wrongFields && wrongFields.length > 0) {
        const messages = wrongFields.map(f => ({
          message,
          field: f,
          validation: 'strict_fields',
        }))
        throw CE.ValidationException.validationFailed(messages)
      }
    }
  }

  /**
   * Compute the validation message that will be displayed
   * in the Validation Exception.
   *
   * @method _computedValidationMessage
   *
   * @param  {Object}        validatorInstance
   * @param  {string}        validation
   * @param  {string}        fallbackMessage
   * @param  {array}         args
   *
   * @return {string}
   *
   * @private
   */
  _computedValidationMessage (validatorInstance, validation, fallbackMessage, args) {
    return (
      (
        validatorInstance.messages && (typeof validatorInstance.messages[validation] === 'function' && validatorInstance.messages[validation](...args, validation)) ||
        validatorInstance.messages && validatorInstance.messages[validation]
      ) || fallbackMessage
    )
  }
}

module.exports = StrictMiddlewareValidator