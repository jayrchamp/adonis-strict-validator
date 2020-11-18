# Adonis Strict Validator 

This package adds the ability to Validators to enforce requests to contain only the fields present in the rules getter.

## Getting Started

Install the package using the `adonis` CLI.

```bash
> adonis install @jayrchamp/adonis-strict-validator
```

Follow instruction that are displayed ([or read them here](https://github.com/jayrchamp/adonis-strict-validator/blob/master/instructions.md)).

## Usage

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