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
   * @method _runStrictValidation
   * @async
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
      
      let wrongFields = []
      if (validatorInstance.rules && Object.keys(validatorInstance.rules).length > 0) {
        const availableFields = Object.keys(validatorInstance.rules)
        wrongFields = fields.filter(f => availableFields.indexOf(f) < 0)
      } else {
        wrongFields = fields
      }

      const message = (
        (
          validatorInstance.messages && 
          validatorInstance.messages['strict_fields']
        ) || `strict validation failed on field`
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
}

module.exports = StrictMiddlewareValidator