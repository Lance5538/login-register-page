# Framework Roadmap

## Why This Document Exists

This project still has many moving parts. To avoid wasting context and rewriting decisions repeatedly, work in a strict order:

1. Framework
2. Concept map / information architecture
3. Page-level structure
4. API boundary
5. Code implementation

## Recommended Working Order

### Phase 1. Lock The Framework

Complete these first:

- Confirm core modules
- Confirm key business objects
- Confirm user roles
- Confirm dashboard purpose
- Confirm MVP boundaries

Deliverable:

- Stable module list
- Stable business object list
- Stable MVP scope

### Phase 2. Build The Information Architecture

After the framework is stable, define:

- Main navigation
- Sub-navigation per module
- Which page belongs to which module
- Which user action leads to which page

Deliverable:

- Sitemap
- Module map
- Page hierarchy

### Phase 3. Draw The Concept Map

Only after Phase 1 and 2:

- Draw the relationship between products, categories, inventory, inbound, outbound, stocktaking, logistics, and documents
- Show major user flows
- Show which entities are dependent on other entities

Deliverable:

- Concept diagram
- Entity relationship sketch
- Main workflow diagram

### Phase 4. Define Backend Boundaries

At this point, start aligning with backend:

- Which pages need list APIs
- Which pages need detail APIs
- Which actions need create / update / confirm APIs
- Which dashboard blocks need aggregated data

Deliverable:

- API requirement list
- Field list per object
- Frontend / backend responsibility split

### Phase 5. Start Coding

Only after the above is clear:

- Build the route skeleton
- Build layout and navigation
- Build empty pages and mock data
- Replace mock data with real APIs later

Deliverable:

- Frontend framework
- Mock screens
- Integration-ready structure

## Suggested Page Skeleton

### Global

- Login
- Register
- Dashboard

### Warehouse Management

- Inbound List
- Inbound Detail
- Outbound List
- Outbound Detail
- Inventory List
- Inventory Detail
- Stocktaking List
- Stocktaking Detail
- Logistics / Documents List
- Logistics / Documents Detail

### Product Management

- Product List
- Product Detail
- Category List
- Category Detail

## Suggested Backend Handoff Sequence

Do not ask backend to build everything at once. A practical order is:

1. Auth
2. Product categories
3. Products
4. Inventory records
5. Inbound
6. Outbound
7. Stocktaking
8. Logistics / documents
9. Dashboard aggregation

## How To Use These Docs With Me

The most helpful workflow is:

1. Keep updating `docs/product-requirements.md`
2. Keep adjusting `docs/framework-roadmap.md`
3. Ask me to turn the latest version into:
   - sitemap
   - concept map outline
   - page list
   - component structure
   - backend API checklist

## Immediate Next Step

The next best move is not more code.

The next best move is to turn the current requirements into:

- a final module list
- a final page list
- a final entity list

Once those three are stable, the concept diagram becomes much easier and cleaner.
