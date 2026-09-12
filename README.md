# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   type-check the project
* `npm run watch`   watch for changes and type-check
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template


# 📦 Documentación del Modelo de Datos - Amazon DynamoDB

Este módulo utiliza **Amazon DynamoDB** para la persistencia de datos. Al ser una base de datos NoSQL, el diseño se enfoca en la eficiencia de las consultas directas mediante llaves únicas.

## 📊 Diseño de la Tabla: `Products`

* **Tipo de Diseño:** Tabla Simple (Llave de Partición Única).
* **Billing Mode:** On-Demand (Pay-per-request).
 
## 🔍 Patrones de Acceso (Access Patterns)

Para este diseño simple, las operaciones de la aplicación están mapeadas de la siguiente forma:

1. **Crear / Actualizar un producto:**
   * **Operación:** `PutItem` / `UpdateItem`
   * **Filtro:** Requiere `id`.
2. **Obtener detalle de un producto:**
   * **Operación:** `GetItem`
   * **Filtro:** `id = "prod_7f3b2c9e"`
3. **Eliminar un producto:**
   * **Operación:** `DeleteItem`
   * **Filtro:** Requiere `id`.
<!-- 4. **Obtener todos los producto:**
   * **Operación:** `DeleteItem`
   * **Filtro:** Requiere `id`. -->

---

## 🛠️ Archivo de Respaldo (NoSQL Workbench)
El diseño visual e interactivo de este esquema se encuentra guardado en la carpeta `/docs/control_inventario_model.json` de este repositorio. Puede ser importado directamente en la herramienta **NoSQL Workbench para DynamoDB** para realizar simulaciones de datos.
