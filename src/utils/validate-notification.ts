import Ajv from 'https://esm.sh/ajv@8.12.0'
import addFormats from 'https://esm.sh/ajv-formats@2.1.1'
import { CustomError } from 'https://esm.sh/@blackglory/errors@3.0.3'
import { Arrayable } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { lazyFunction } from 'https://esm.sh/extra-lazy@2.0.2'
import { INotification } from '@src/script.ts'

class ValidationError extends CustomError {}

export const validateNotification: (
  val: unknown
) => asserts val is Arrayable<INotification> = lazyFunction(() => {
  const ajv = new Ajv()
  addFormats.default(ajv, ['uri'])

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#'
  , $defs: {
      notification: {
        type: 'object'
      , properties: {
          id: {
            anyOf: [
              { type: 'string' }
            , { type: 'number' }
            , { type: 'null' }
            ]
          }
        , title: { type: 'string', nullable: true }
        , message: { type: 'string', nullable: true }
        , imageUrl: { type: 'string', format: 'uri', nullable: true }
        , iconUrl: { type: 'string', format: 'uri', nullable: true }
        , url: { type: 'string', format: 'uri', nullable: true }
        , expires: { type: 'number', nullable: true }
        }
      , required: []
      , additionalProperties: true
      }
    }
  , anyOf: [
      { $ref: '#/$defs/notification' }
    , {
        type: 'array'
      , items: { $ref: '#/$defs/notification' }
      }
    ]
  }

  const validate = ajv.compile(schema)

  return val => {
    if (!validate(val)) {
      throw new ValidationError(ajv.errorsText(validate.errors))
    }
  }
})
