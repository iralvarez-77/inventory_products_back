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


# 📦 Data Model Documentation - Amazon DynamoDB

This module uses Amazon DynamoDB for data persistence. As a NoSQL database, the design focuses on the efficiency of direct queries using unique keys.

## 📊 Table Design: `Products`

* **Design Type:** Simple Table (Single Partition Key).

* **Billing Mode:** On-Demand (Pay-per-request).

## 🔍 Access Patterns

For this simple design, the application operations are mapped as follows:

1. **Create / Update a product:**

* **Operation:** `PutItem` / `UpdateItem`

* **Filter:** Requires `id`.

* 2. **Get details of a product:**

* **Operation:** `GetItem`

* **Filter:** `id = "prod_7f3b2c9e"`

3. **Delete a product:**

* **Operation:** `DeleteItem`

* **Filter:** Requires `id`.

<!-- 4. **Get all products:**

* **Operation:** `DeleteItem`

* **Filter:** Requires `id`. -->

---

## 🛠️ Backup File (NoSQL Workbench)
The visual and interactive design of this schema is saved in the `/docs/control_inventory_model.json` folder of this repository. It can be imported directly into the **NoSQL Workbench for DynamoDB** tool to perform data simulations.