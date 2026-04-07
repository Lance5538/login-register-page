# Real-Time Inventory Management System

## Database Design Document

### 1. Purpose

This document describes the database design for the Real-Time Inventory Management System. The database supports user authentication, product and warehouse management, inventory tracking, and auditable inventory transactions. The design aims to ensure data consistency, traceability, and extensibility for future system growth.

### 2. Design Goals

The database is designed to achieve the following goals:

* Maintain accurate inventory quantities across multiple warehouses.
* Support role-based access through authenticated users.
* Preserve a full transaction history for stock movements.
* Prevent inconsistent inventory states such as negative stock or invalid warehouse references.
* Provide a structure that is easy to extend for future features such as reservations, suppliers, purchase orders, or reporting.

### 3. Main Entities

The core entities in the system are:

* **User**: stores login and role information for authenticated system users.
* **Product**: stores product master data.
* **Warehouse**: stores warehouse master data.
* **Inventory**: stores the current quantity of each product in each warehouse.
* **InventoryTransaction**: stores the history of all stock movements and adjustments.

### 4. Entity Descriptions

#### 4.1 User

The User entity manages authentication and authorization.

**Key attributes:**

* `id`: unique identifier for the user.
* `email`: unique email address used for login.
* `password`: hashed password.
* `role`: access role, such as ADMIN or STAFF.
* `createdAt`: timestamp of user creation.
* `updatedAt`: timestamp of last update.

**Business rules:**

* Each email must be unique.
* Passwords must be stored in hashed form, never plain text.
* Role values are restricted to predefined options.

#### 4.2 Product

The Product entity stores product information.

**Key attributes:**

* `id`: unique identifier for the product.
* `name`: product name.
* `sku`: unique stock keeping unit.
* `description`: optional description.
* `unit`: optional unit of measurement.
* `createdAt`: timestamp of creation.
* `updatedAt`: timestamp of last update.

**Business rules:**

* SKU must be unique.
* Name and SKU are required.

#### 4.3 Warehouse

The Warehouse entity stores warehouse information.

**Key attributes:**

* `id`: unique identifier for the warehouse.
* `name`: warehouse name.
* `code`: unique warehouse code.
* `location`: optional location text.
* `createdAt`: timestamp of creation.
* `updatedAt`: timestamp of last update.

**Business rules:**

* Warehouse code must be unique.
* Name and code are required.

#### 4.4 Inventory

The Inventory entity stores the current stock state for a product in a warehouse.

**Key attributes:**

* `id`: unique identifier for the inventory record.
* `productId`: foreign key to Product.
* `warehouseId`: foreign key to Warehouse.
* `onHand`: total physical stock quantity.
* `reserved`: quantity reserved for future operations.
* `createdAt`: timestamp of creation.
* `updatedAt`: timestamp of last update.

**Derived concept:**

* `available = onHand - reserved`

**Business rules:**

* One product can have at most one inventory row per warehouse.
* `onHand` cannot be negative.
* `reserved` cannot be negative.
* `reserved` cannot exceed `onHand`.

#### 4.5 InventoryTransaction

The InventoryTransaction entity records all inventory-changing events.

**Key attributes:**

* `id`: unique identifier for the transaction.
* `type`: transaction type, such as STOCK_IN, STOCK_OUT, TRANSFER, ADJUSTMENT, RESERVE, RELEASE, COMMIT_OUT.
* `productId`: foreign key to Product.
* `warehouseId`: main warehouse affected, nullable in some scenarios.
* `sourceWarehouseId`: source warehouse for transfers.
* `targetWarehouseId`: target warehouse for transfers.
* `quantity`: quantity moved or changed.
* `beforeOnHand`: on-hand quantity before the operation.
* `afterOnHand`: on-hand quantity after the operation.
* `beforeReserved`: reserved quantity before the operation.
* `afterReserved`: reserved quantity after the operation.
* `reference`: optional business reference.
* `note`: optional note.
* `createdById`: foreign key to User.
* `createdAt`: timestamp of creation.

**Business rules:**

* Every inventory-changing operation should generate a transaction record.
* Transaction history should be immutable once recorded.
* Transfer transactions must contain valid source and target warehouses.

### 5. Relationships

The main relationships are:

* One **User** can create many **InventoryTransaction** records.
* One **Product** can appear in many **Inventory** records.
* One **Warehouse** can contain many **Inventory** records.
* One **Product** can appear in many **InventoryTransaction** records.
* One **Warehouse** can appear in many **InventoryTransaction** records.

In cardinality terms:

* User 1 --- N InventoryTransaction
* Product 1 --- N Inventory
* Warehouse 1 --- N Inventory
* Product 1 --- N InventoryTransaction
* Warehouse 1 --- N InventoryTransaction

### 6. Normalization Considerations

The schema is designed to follow relational normalization principles:

* **First Normal Form (1NF):** all attributes are atomic.
* **Second Normal Form (2NF):** non-key attributes depend on the whole key.
* **Third Normal Form (3NF):** non-key attributes do not depend on other non-key attributes.

Master data such as Product and Warehouse are stored separately from transactional and inventory state data. This avoids duplication and improves maintainability.

### 7. Constraints and Integrity Rules

To ensure integrity, the database should enforce:

* Primary keys on all tables.
* Unique constraints on `User.email`, `Product.sku`, and `Warehouse.code`.
* Foreign key constraints between Inventory, InventoryTransaction, and their related master tables.
* Composite unique constraint on `(productId, warehouseId)` in Inventory.
* Non-negative quantity checks for inventory values where supported.

### 8. Transaction Logic

Because inventory updates affect business correctness, important operations should be executed inside database transactions.

Examples:

* **Stock In**: increase `onHand`, then insert InventoryTransaction.
* **Stock Out**: verify sufficient available quantity, decrease `onHand`, then insert InventoryTransaction.
* **Transfer**: decrease source inventory, increase target inventory, then insert InventoryTransaction.
* **Reserve**: verify sufficient available quantity, increase `reserved`, then insert InventoryTransaction.
* **Release**: decrease `reserved`, then insert InventoryTransaction.
* **Commit Reserved**: decrease both `reserved` and `onHand`, then insert InventoryTransaction.

This ensures atomicity: either the whole operation succeeds, or none of it is saved.

### 9. Indexing Strategy

Recommended indexes include:

* Unique index on `User.email`
* Unique index on `Product.sku`
* Unique index on `Warehouse.code`
* Unique composite index on `Inventory(productId, warehouseId)`
* Index on `InventoryTransaction.productId`
* Index on `InventoryTransaction.warehouseId`
* Index on `InventoryTransaction.createdById`
* Index on `InventoryTransaction.createdAt`

These indexes improve lookup speed for common queries such as inventory views, stock history, and product-based reports.

### 10. Security Considerations

Important security points include:

* Passwords must be hashed before storage.
* Database credentials must be stored in environment variables, not in source code.
* Role information should be validated at the application layer.
* Sensitive actions should be logged through InventoryTransaction and application logs.

### 11. Future Extensions

The schema is designed to support future enhancements, such as:

* Supplier and purchase order tables
* Customer order and shipment tables
* Inventory adjustment approval workflows
* Soft delete fields for master data
* Batch or lot tracking
* Expiry date management
* Multi-location reporting and analytics

### 12. Summary

This database design provides a strong foundation for a real-time inventory management system. It separates master data, current stock state, and transaction history clearly. The structure supports accurate stock control, traceability, and future expansion while remaining simple enough for a portfolio-ready backend project.

### 13. Example Relational Overview

A simplified relational view is shown below:

* **User** (`id`, `email`, `password`, `role`, `createdAt`, `updatedAt`)
* **Product** (`id`, `name`, `sku`, `description`, `unit`, `createdAt`, `updatedAt`)
* **Warehouse** (`id`, `name`, `code`, `location`, `createdAt`, `updatedAt`)
* **Inventory** (`id`, `productId`, `warehouseId`, `onHand`, `reserved`, `createdAt`, `updatedAt`)
* **InventoryTransaction** (`id`, `type`, `productId`, `warehouseId`, `sourceWarehouseId`, `targetWarehouseId`, `quantity`, `beforeOnHand`, `afterOnHand`, `beforeReserved`, `afterReserved`, `reference`, `note`, `createdById`, `createdAt`)
