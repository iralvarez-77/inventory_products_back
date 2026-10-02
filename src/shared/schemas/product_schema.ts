import * as yup from "yup";

export const productSchema = yup.object({
  nombre: yup.string().trim().required("El nombre es requerido"),
  nombre_comercio: yup.string().trim().required("El nombre del comercio es requerido"),
  codigo_barras: yup.string().trim().required("El código de barras es requerido"),
  costo_usd: yup.number().positive("El costo debe ser mayor a 0").required(),
  margen_ganancia: yup.number().min(0, "El margen no puede ser negativo").required(),
  stock: yup.number().integer().min(0).required(),
  stock_minimo: yup.number().integer().min(0).required(),
}).required();

// Esto sirve para autocompletar el código en TypeScript (Intellisense)
export type ValidatedProduct = yup.InferType<typeof productSchema>;
