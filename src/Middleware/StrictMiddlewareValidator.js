const { resolver } = require('@adonisjs/fold')
const CE = require('@adonisjs/validator/src/Exceptions')
const MiddlewareValidator = require('@adonisjs/validator/src/Middleware/Validator')

class StrictMiddlewareValidator extends MiddlewareValidator {
  constructor(Validator) {
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
  async handle(ctx, next, validator) {
    validator = validator instanceof Array === true ? validator[0] : validator

    if (!validator) {
      throw new Error('Cannot validate request without a validator. Make sure to call Route.validator(\'validatorPath\')')
    }

    const validatorInstance = resolver.forDir('validators').resolve(validator)

    let validationError;

    try {
      await super.handle(ctx, next, validator)
    } catch (error) {
      if (error.status && error.status === 400) validationError = error;
    }

    if (!validationError) {
      /**
       * Run noEmpty validation on request data
       */
      this._runNoEmptyValidation(ctx, validatorInstance)
    }

    let messages = [];

    if (!validationError || (validationError && typeof validatorInstance.validateAll === 'boolean' && validatorInstance.validateAll)) {
      /**
       * Run strict validation on request data
       */
      const strictValidationMessages = this._runStrictValidation(ctx, validatorInstance)

      if (Array.isArray(strictValidationMessages) && strictValidationMessages.length) {
        messages = [
          ...messages,
          ...strictValidationMessages
        ];
      }
    }

    if (validationError) {
      validationError.messages = [
        ...validationError.messages,
        ...messages
      ]
      throw validationError
    }

    if (messages.length) {
      throw CE.ValidationException.validationFailed(messages)
    }
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
  _runNoEmptyValidation(ctx, validatorInstance) {
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
   * @return {Array}          messages
   *
   * @private
   */
  _runStrictValidation(ctx, validatorInstance) {
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

      const message = this._computedValidationMessage(
        validatorInstance,
        'strict_fields',
        'strict validation failed on field',
        [wrongFields]
      )

      if (wrongFields && wrongFields.length > 0) {
        const messages = wrongFields.map(f => ({
          message,
          field: f,
          validation: 'strict_fields',
        }))
        return (typeof validatorInstance.validateAll === 'boolean' && validatorInstance.validateAll) ? messages : [messages[0]];
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
  _computedValidationMessage(validatorInstance, validation, fallbackMessage, args) {
    return (
      (
        validatorInstance.messages && (typeof validatorInstance.messages[validation] === 'function' && validatorInstance.messages[validation](...args, validation)) ||
        validatorInstance.messages && validatorInstance.messages[validation]
      ) || fallbackMessage
    )
  }
}

module.exports = StrictMiddlewareValidator