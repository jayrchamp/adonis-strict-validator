# Register provider

The provider must be registered inside `start/app.js` file and after `@adonisjs/validator/providers/ValidatorProvider`.

```js
const providers = [
  '@adonisjs/validator/providers/ValidatorProvider',
  '@jayrchamp/adonis-strict-validator/providers/ValidatorProvider'
]
```

# Usage

Create a Validator file in App/Validators/  (ex.: App/Validators/Example) and set strict getter to true.

```js
// App/Validators/Example/index.js

class ExampleValidator {
  
  get strict () {
    return true
  }

  get rules () {
    return {
      gender: 'string'
    }
  }
}

module.exports = ExampleValidator

```

```js
// Request body example
{
  gender: "male",
  pogo: "yolo"

}

// Response example
{
  code: "E_VALIDATION_FAILED",
  errors: [
    {
      message: "strict validation failed on field",
      field: "pogo",
      validation: "strict_fields"
    }
  ]
}

```