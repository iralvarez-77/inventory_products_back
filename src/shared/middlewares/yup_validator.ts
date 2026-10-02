import middy from "@middy/core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ObjectSchema, ValidationError } from "yup";
import { response } from "../response_helper";

export const validateBody = (schema: ObjectSchema<any>) => {
  return {
    before: async (request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult>) => {
      // 1. Si no hay cuerpo, rechazar de inmediato
      if (!request.event.body) {
        request.response = response(400, { message: "El cuerpo de la petición es requerido" });
        return;
      }

      try {
        // 2. Convertir el texto JSON a un objeto JavaScript
        const rawBody = typeof request.event.body === "string" 
          ? JSON.parse(request.event.body) 
          : request.event.body;

        // 3. Validar con Yup (limpia campos extraños y quita espacios vacíos)
        const cleanBody = await schema.validate(rawBody, {
          abortEarly: false,
          stripUnknown: true,
        });

        // 4. Guardar los datos limpios de vuelta en el evento
        request.event.body = cleanBody as any;

      } catch (error) {
        // 5. Si Yup encuentra errores, responder al cliente con la lista de fallos
        if (error instanceof ValidationError) {
          request.response = response(400, {
            message: "Datos inválidos",
            errors: error.errors,
          });
          return; // Detiene la Lambda aquí mismo
        }
        throw error;
      }
    },
  };
};
