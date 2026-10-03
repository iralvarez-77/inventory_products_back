import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export const ProductModelSchema: apigateway.JsonSchema = {
  type: apigateway.JsonSchemaType.OBJECT,
        required: [
          'nombre', 
          'costo_usd', 
          'margen_ganancia', 
          'stock', 
          'stock_minimo', 
          'codigo_barras', 
          'nombre_comercio'
        ],
        // 2. Bloqueamos cualquier propiedad extra que no esté en esta lista
        additionalProperties: false, 
        properties: {
          nombre: { 
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1 ,// Evita que envíen un texto vacío ""
            maxLength: 40 
          },
          costo_usd: { 
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[0-9]+(\\.[0-9]{1,2})?$', 
          },
          margen_ganancia: { 
            type: apigateway.JsonSchemaType.INTEGER,
            minimum: 0 // El margen de ganancia debe ser 0 o superior (ej: 100%)
          },
          stock: { 
            type: apigateway.JsonSchemaType.INTEGER, // Forzamos a que sea un número entero
            minimum: 0 // No se permite stock inicial negativo
          },
          stock_minimo: { 
            type: apigateway.JsonSchemaType.INTEGER, // Número entero
            minimum: 0 
          },
          codigo_barras: { 
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[0-9]+$'
          },
          nombre_comercio: { 
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 30
          },
        }
}

export const UpdateCostModelSchema: apigateway.JsonSchema = {
  type: apigateway.JsonSchemaType.OBJECT,
  required: ['nombre_comercio', 'codigo_barras', 'costo_usd'],
  additionalProperties: false,
  properties: {
    nombre_comercio: { type: apigateway.JsonSchemaType.STRING, minLength: 1, maxLength: 30 },
    codigo_barras: { type: apigateway.JsonSchemaType.STRING, pattern: '^[0-9]+$' },
    costo_usd: { type: apigateway.JsonSchemaType.STRING, pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
  },
};