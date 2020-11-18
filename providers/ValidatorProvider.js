'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ValidatorProvider extends ServiceProvider {
  /**
   * Register
   *
   * @method register
   *
   * @return {void}
   */
  register() {
    this._registerMiddleware()
  }

  /**
   * Register the extended validator middleware to the IoC container
   * overwritting `Adonis/Middleware/Validator` namespace
   *
   * @method _registerMiddleware
   *
   * @return {void}
   *
   * @private
   */
  _registerMiddleware () {
    this.app.bind('Adonis/Middleware/Validator', (app) => {      
      const StrictMiddlewareValidator = require('../src/Middleware/StrictMiddlewareValidator')
      return new StrictMiddlewareValidator(app.use('Adonis/Addons/Validator'))
    })
  }
}

module.exports = ValidatorProvider
