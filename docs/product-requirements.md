# Product Requirements

## Product Positioning

This project is an English-language warehouse management web application focused on core inventory and product workflows.

The goal is to first establish a stable product framework, then produce concept diagrams and page structure, and only then move into implementation.

## Product Language

- The website UI should be fully in English.
- Internal planning notes may remain in Chinese for team communication.

## Core Modules

### 1. Warehouse Management

This module should cover:

- Inbound
- Outbound
- Inventory
- Stocktaking
- Logistics / Documents

### 2. Product Management

This module should cover:

- Product categories
- Product master records

## Suggested MVP Scope

To keep the first usable version focused, the MVP should include:

- Login
- Dashboard
- Inbound list and inbound detail
- Outbound list and outbound detail
- Inventory list
- Stocktaking task list
- Logistics / document list
- Product list
- Product category list

## Suggested User Roles

Start with a simple role model:

- Admin
- Warehouse Operator
- Viewer

Role granularity can be refined later. Do not over-design permissions in the first phase.

## Key Business Objects

The system framework should be built around these objects:

- Product
- Product Category
- Warehouse
- Inventory Record
- Inbound Order
- Outbound Order
- Stocktaking Task
- Logistics Record
- Document
- User

## Dashboard Direction

The dashboard should act as an operational overview, not a marketing homepage.

It should eventually surface:

- Inventory status
- Inbound / outbound today
- Pending stocktaking tasks
- Logistics / document alerts
- Product category overview

## Functional Notes By Module

### Inbound

- Create inbound records
- View inbound history
- Confirm received quantities
- Link inbound records to products and warehouses

### Outbound

- Create outbound records
- View outbound history
- Confirm shipped quantities
- Track destination and status

### Inventory

- View current stock by product
- View stock by warehouse or location
- Show low stock warnings

### Stocktaking

- Create stocktaking tasks
- Compare counted quantity vs system quantity
- Mark difference status

### Logistics / Documents

- Track shipment-related records
- Track document numbers and document status
- Keep documents linked to inbound or outbound records

### Product Management

- Maintain product categories
- Maintain product master data
- Link products to category and warehouse information

## Out Of Scope For The First Stage

Do not treat these as first-phase requirements unless they become necessary:

- Advanced analytics
- Multi-company architecture
- Complex approval workflows
- Full accounting integration
- Highly granular permission matrices
- Native mobile apps

## UX Direction

- English interface
- Clean admin-style layout
- Strong navigation clarity
- Utility-first information hierarchy
- Minimal decorative noise

## Collaboration Note

For backend collaboration, this document should be the source of truth for:

- What modules exist
- What objects must exist
- What the MVP actually includes

API details should be defined only after the framework and page structure are stable.
