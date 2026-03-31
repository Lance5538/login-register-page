import type { WorkspaceRoute } from './content';
import { DASHBOARD_REFRESH_INTERVAL_MS, type InventoryCategoryShare, type InventoryWarning, type WarehouseDashboardSnapshot, type WarehouseTrendPoint } from './dashboardMock';

export type OperationalModuleKey = 'inventory' | 'inbound' | 'outbound' | 'approval';

export type OperationalSelections = {
  inventoryId: string;
  inboundId: string;
  outboundId: string;
  approvalKey: string;
  userId: string;
};

export type SearchOption = {
  value: string;
  label: string;
  detail: string;
  keywords: string;
};

export type ApprovalStatus = 'Pending Approval' | 'Approved' | 'Rejected';
export type InboundStatus = 'Draft' | 'Pending Receipt' | 'Received';
export type OutboundStatus = 'Draft' | 'Pending Shipment' | 'Shipped';
export type ProductStatus = 'Active' | 'Hold';
export type CategoryStatus = 'Active' | 'Hold';
export type UserRole = 'Admin' | 'Staff';
export type UserStatus = 'Active' | 'Invited';
export type PermissionKey = 'view_data' | 'edit_data' | 'approve_orders' | 'manage_users' | 'assign_admin';

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  appointedBy: string;
  appointedAt: string;
  permissionsUpdatedAt: string;
  lastLoginAt: string;
};

export type UserSession = Pick<WorkspaceUser, 'id' | 'name' | 'email' | 'role'>;

export type WarehouseRecord = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  region: string;
  country: string;
  location: string;
  capacity: number;
  status: 'Active' | 'Maintenance';
};

export type CategoryRecord = {
  id: string;
  categoryCode: string;
  categoryName: string;
  status: CategoryStatus;
};

export type ProductRecord = {
  id: string;
  productCode: string;
  productName: string;
  categoryId: string;
  warehouseId: string;
  unit: string;
  status: ProductStatus;
};

export type OrderLineItem = {
  id: string;
  productId: string;
  quantity: string;
  notes: string;
};

type ApprovalMeta = {
  approvalStatus: ApprovalStatus;
  approvalReason: string;
  approvalUpdatedAt: string;
  approvedBy: string;
  appliedAt: string;
};

export type InboundRecord = ApprovalMeta & {
  id: string;
  inboundNo: string;
  warehouseId: string;
  supplierName: string;
  referenceNo: string;
  plannedDate: string;
  status: InboundStatus;
  createdBy: string;
  createdAt: string;
  confirmedAt: string;
  notes: string;
  lineItems: OrderLineItem[];
};

export type OutboundRecord = ApprovalMeta & {
  id: string;
  outboundNo: string;
  warehouseId: string;
  destination: string;
  carrier: string;
  shipmentDate: string;
  status: OutboundStatus;
  createdBy: string;
  createdAt: string;
  confirmedAt: string;
  notes: string;
  lineItems: OrderLineItem[];
};

export type InventoryRecord = {
  id: string;
  productId: string;
  warehouseId: string;
  location: string;
  onHandBase: number;
  threshold: number;
  updatedAt: string;
};

export type WorkspaceStore = {
  warehouses: WarehouseRecord[];
  categories: CategoryRecord[];
  products: ProductRecord[];
  inventoryRecords: InventoryRecord[];
  inboundOrders: InboundRecord[];
  outboundOrders: OutboundRecord[];
  users: WorkspaceUser[];
  lastSync: string;
};

export type InboundFormData = {
  inboundNo: string;
  warehouseId: string;
  supplierName: string;
  referenceNo: string;
  plannedDate: string;
  notes: string;
  lineItems: OrderLineItem[];
};

export type OutboundFormData = {
  outboundNo: string;
  warehouseId: string;
  destination: string;
  carrier: string;
  shipmentDate: string;
  notes: string;
  lineItems: OrderLineItem[];
};

export type InventorySnapshot = {
  id: string;
  productId: string;
  warehouseId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  warehouseCode: string;
  warehouseName: string;
  region: string;
  country: string;
  location: string;
  unit: string;
  onHand: number;
  threshold: number;
  status: 'Healthy' | 'Low Stock' | 'Out of Stock';
  lastUpdatedAt: string;
};

export type ApprovalQueueItem = {
  key: string;
  id: string;
  module: 'Inbound' | 'Outbound';
  orderNo: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  partner: string;
  orderStatus: string;
  approvalStatus: ApprovalStatus;
  approvalReason: string;
  units: number;
  createdBy: string;
  createdAt: string;
  approvalUpdatedAt: string;
  approvedBy: string;
};

export const inboundStatusOptions: InboundStatus[] = ['Draft', 'Pending Receipt', 'Received'];
export const outboundStatusOptions: OutboundStatus[] = ['Draft', 'Pending Shipment', 'Shipped'];
export const approvalStatusOptions: ApprovalStatus[] = ['Pending Approval', 'Approved', 'Rejected'];

const rolePermissionMap: Record<UserRole, PermissionKey[]> = {
  Admin: ['view_data', 'edit_data', 'approve_orders', 'manage_users', 'assign_admin'],
  Staff: ['view_data', 'edit_data'],
};

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const categoryColorMap = new Map([
  ['Fasteners', '#2563eb'],
  ['Hardware', '#14b8a6'],
  ['Electrical', '#f59e0b'],
  ['Packaging', '#8b5cf6'],
]);

const historicalTrendSeed = [
  { inbound: 82, outbound: 66 },
  { inbound: 91, outbound: 74 },
  { inbound: 86, outbound: 71 },
  { inbound: 95, outbound: 79 },
  { inbound: 88, outbound: 76 },
  { inbound: 93, outbound: 82 },
  { inbound: 0, outbound: 0 },
];

function timestamp(value: string) {
  return new Date(value);
}

function compactToken(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function stripControlCharacters(value: string) {
  return Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('');
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function quantityToNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function maxIso(left: string, right: string) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return timestamp(left).getTime() >= timestamp(right).getTime() ? left : right;
}

function sanitizeInput(value: string) {
  return stripControlCharacters(value).replace(/\s+/g, ' ').trim();
}

export function buildUserSession(user: WorkspaceUser): UserSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function getRolePermissions(role: UserRole) {
  return rolePermissionMap[role];
}

export function hasPermission(user: Pick<WorkspaceUser, 'role'> | UserSession | null | undefined, permission: PermissionKey) {
  return user ? rolePermissionMap[user.role].includes(permission) : false;
}

export function canAccessWorkspaceRoute(user: Pick<WorkspaceUser, 'role'> | UserSession | null | undefined, route: WorkspaceRoute) {
  if (route === 'approval-list') {
    return hasPermission(user, 'approve_orders');
  }

  if (route === 'user-management-list') {
    return hasPermission(user, 'manage_users');
  }

  return true;
}

export function getDefaultWorkspaceRoute(user: Pick<WorkspaceUser, 'role'> | UserSession | null | undefined): WorkspaceRoute {
  if (canAccessWorkspaceRoute(user, 'dashboard')) {
    return 'dashboard';
  }

  return 'inventory-list';
}

function buildOrderMeta() {
  return {
    approvalStatus: 'Pending Approval' as ApprovalStatus,
    approvalReason: '',
    approvalUpdatedAt: '',
    approvedBy: '',
    appliedAt: '',
  };
}

export function formatShortStamp(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp(value));
}

export function formatLongDate(value: string) {
  return longDateFormatter.format(timestamp(value));
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function createEmptyLineItem(): OrderLineItem {
  return {
    id: createId('LINE'),
    productId: '',
    quantity: '',
    notes: '',
  };
}

export function countLineItems(lineItems: OrderLineItem[]) {
  return lineItems.reduce((total, lineItem) => total + (lineItem.productId ? 1 : 0), 0);
}

export function countOrderUnits(lineItems: OrderLineItem[]) {
  return lineItems.reduce((total, lineItem) => total + quantityToNumber(lineItem.quantity), 0);
}

export function sanitizeCode(value: string) {
  return compactToken(value);
}

export function sanitizeFreeText(value: string) {
  return sanitizeInput(value);
}

export function sanitizeLineItems(lineItems: OrderLineItem[]) {
  return lineItems.map((lineItem) => ({
    ...lineItem,
    productId: sanitizeInput(lineItem.productId),
    quantity: lineItem.quantity.replace(/[^\d.]/g, ''),
    notes: sanitizeInput(lineItem.notes),
  }));
}

export function findUserByEmail(store: WorkspaceStore, email: string) {
  const normalized = sanitizeInput(email).toLowerCase();
  return store.users.find((item) => item.email.toLowerCase() === normalized);
}

export function createInitialWorkspaceStore(): WorkspaceStore {
  return {
    warehouses: [
      {
        id: 'WH-SH-01',
        warehouseCode: 'WH-SH-01',
        warehouseName: 'Shanghai Primary Warehouse',
        region: 'East China',
        country: 'China',
        location: 'Shanghai',
        capacity: 2400,
        status: 'Active',
      },
      {
        id: 'WH-NB-02',
        warehouseCode: 'WH-NB-02',
        warehouseName: 'Ningbo Flow Warehouse',
        region: 'East China',
        country: 'China',
        location: 'Ningbo',
        capacity: 1800,
        status: 'Active',
      },
      {
        id: 'WH-DXB-01',
        warehouseCode: 'WH-DXB-01',
        warehouseName: 'Dubai Crossborder Hub',
        region: 'Middle East',
        country: 'UAE',
        location: 'Dubai',
        capacity: 1600,
        status: 'Active',
      },
    ],
    categories: [
      { id: 'CAT-FAST-01', categoryCode: 'CAT-FAST-01', categoryName: 'Fasteners', status: 'Active' },
      { id: 'CAT-HARD-02', categoryCode: 'CAT-HARD-02', categoryName: 'Hardware', status: 'Active' },
      { id: 'CAT-ELEC-03', categoryCode: 'CAT-ELEC-03', categoryName: 'Electrical', status: 'Active' },
      { id: 'CAT-PACK-04', categoryCode: 'CAT-PACK-04', categoryName: 'Packaging', status: 'Hold' },
    ],
    products: [
      {
        id: 'P-BOLT-A',
        productCode: 'P-BOLT-A',
        productName: 'Bolt Set A',
        categoryId: 'CAT-FAST-01',
        warehouseId: 'WH-SH-01',
        unit: 'Pack',
        status: 'Active',
      },
      {
        id: 'P-NUT-B',
        productCode: 'P-NUT-B',
        productName: 'Nut Pack B',
        categoryId: 'CAT-FAST-01',
        warehouseId: 'WH-NB-02',
        unit: 'Pack',
        status: 'Active',
      },
      {
        id: 'P-CLAMP-D',
        productCode: 'P-CLAMP-D',
        productName: 'Clamp D',
        categoryId: 'CAT-HARD-02',
        warehouseId: 'WH-SH-01',
        unit: 'Unit',
        status: 'Active',
      },
      {
        id: 'P-SENSOR-K',
        productCode: 'P-SENSOR-K',
        productName: 'Sensor Kit K',
        categoryId: 'CAT-ELEC-03',
        warehouseId: 'WH-DXB-01',
        unit: 'Set',
        status: 'Active',
      },
      {
        id: 'P-CARTON-L',
        productCode: 'P-CARTON-L',
        productName: 'Carton Roll L',
        categoryId: 'CAT-PACK-04',
        warehouseId: 'WH-SH-01',
        unit: 'Roll',
        status: 'Hold',
      },
    ],
    inventoryRecords: [
      {
        id: 'INV-001',
        productId: 'P-BOLT-A',
        warehouseId: 'WH-SH-01',
        location: 'A1-04',
        onHandBase: 280,
        threshold: 120,
        updatedAt: '2026-03-24T08:40:00',
      },
      {
        id: 'INV-002',
        productId: 'P-NUT-B',
        warehouseId: 'WH-NB-02',
        location: 'B2-12',
        onHandBase: 94,
        threshold: 110,
        updatedAt: '2026-03-24T08:10:00',
      },
      {
        id: 'INV-003',
        productId: 'P-CLAMP-D',
        warehouseId: 'WH-SH-01',
        location: 'C3-01',
        onHandBase: 138,
        threshold: 60,
        updatedAt: '2026-03-24T07:50:00',
      },
      {
        id: 'INV-004',
        productId: 'P-SENSOR-K',
        warehouseId: 'WH-DXB-01',
        location: 'E1-02',
        onHandBase: 76,
        threshold: 36,
        updatedAt: '2026-03-24T09:05:00',
      },
      {
        id: 'INV-005',
        productId: 'P-CARTON-L',
        warehouseId: 'WH-SH-01',
        location: 'P1-08',
        onHandBase: 44,
        threshold: 32,
        updatedAt: '2026-03-23T17:16:00',
      },
    ],
    inboundOrders: [
      {
        id: 'INB-1048',
        inboundNo: 'INB-1048',
        warehouseId: 'WH-SH-01',
        supplierName: 'North Harbour Metals',
        referenceNo: 'ASN-7731',
        plannedDate: '2026-03-30',
        status: 'Pending Receipt',
        createdBy: 'Ava Chen',
        createdAt: '2026-03-30T08:30:00',
        confirmedAt: '',
        notes: 'Fastener replenishment for the morning receiving wave.',
        lineItems: [
          { id: createId('LINE'), productId: 'P-BOLT-A', quantity: '160', notes: 'Dock 01 priority.' },
          { id: createId('LINE'), productId: 'P-CLAMP-D', quantity: '36', notes: 'Staging lane 03.' },
        ],
        ...buildOrderMeta(),
      },
      {
        id: 'INB-1047',
        inboundNo: 'INB-1047',
        warehouseId: 'WH-DXB-01',
        supplierName: 'Gulf Sensor Supply',
        referenceNo: 'ASN-7708',
        plannedDate: '2026-03-29',
        status: 'Received',
        createdBy: 'Mia Lin',
        createdAt: '2026-03-29T10:12:00',
        confirmedAt: '2026-03-29T11:04:00',
        notes: 'Approved and posted into the export hub inventory.',
        lineItems: [{ id: createId('LINE'), productId: 'P-SENSOR-K', quantity: '28', notes: 'Serial box check complete.' }],
        approvalStatus: 'Approved',
        approvalReason: '',
        approvalUpdatedAt: '2026-03-29T11:04:00',
        approvedBy: 'Ava Chen',
        appliedAt: '2026-03-29T11:04:00',
      },
      {
        id: 'INB-1046',
        inboundNo: 'INB-1046',
        warehouseId: 'WH-NB-02',
        supplierName: 'Pacific Fastener Co.',
        referenceNo: 'ASN-7698',
        plannedDate: '2026-03-28',
        status: 'Pending Receipt',
        createdBy: 'Leo Xu',
        createdAt: '2026-03-28T15:20:00',
        confirmedAt: '',
        notes: 'Supplier mixed labels on two cartons.',
        lineItems: [{ id: createId('LINE'), productId: 'P-NUT-B', quantity: '84', notes: 'Hold until relabel completed.' }],
        approvalStatus: 'Rejected',
        approvalReason: 'Label mismatch found on supplier cartons. Please recheck source documents.',
        approvalUpdatedAt: '2026-03-28T18:06:00',
        approvedBy: 'Ava Chen',
        appliedAt: '',
      },
    ],
    outboundOrders: [
      {
        id: 'OUT-2027',
        outboundNo: 'OUT-2027',
        warehouseId: 'WH-SH-01',
        destination: 'Hangzhou DC',
        carrier: 'BlueLine Freight',
        shipmentDate: '2026-03-30',
        status: 'Pending Shipment',
        createdBy: 'Iris Wang',
        createdAt: '2026-03-30T09:12:00',
        confirmedAt: '',
        notes: 'Retail replenishment on the afternoon linehaul.',
        lineItems: [
          { id: createId('LINE'), productId: 'P-BOLT-A', quantity: '72', notes: 'Outbound wave 2.' },
          { id: createId('LINE'), productId: 'P-CARTON-L', quantity: '8', notes: 'Packing support.' },
        ],
        ...buildOrderMeta(),
      },
      {
        id: 'OUT-2026',
        outboundNo: 'OUT-2026',
        warehouseId: 'WH-NB-02',
        destination: 'Nanjing Crossdock',
        carrier: 'Harbour Cargo',
        shipmentDate: '2026-03-29',
        status: 'Shipped',
        createdBy: 'Owen Li',
        createdAt: '2026-03-29T08:10:00',
        confirmedAt: '2026-03-29T12:45:00',
        notes: 'Fastener replenishment for east region stores.',
        lineItems: [{ id: createId('LINE'), productId: 'P-NUT-B', quantity: '54', notes: '4 tote shipment.' }],
        approvalStatus: 'Approved',
        approvalReason: '',
        approvalUpdatedAt: '2026-03-29T12:45:00',
        approvedBy: 'Ava Chen',
        appliedAt: '2026-03-29T12:45:00',
      },
      {
        id: 'OUT-2025',
        outboundNo: 'OUT-2025',
        warehouseId: 'WH-DXB-01',
        destination: 'Abu Dhabi Project Site',
        carrier: 'EastJet Logistics',
        shipmentDate: '2026-03-28',
        status: 'Pending Shipment',
        createdBy: 'Noah Zhang',
        createdAt: '2026-03-28T16:40:00',
        confirmedAt: '',
        notes: 'Project order paused after quantity review.',
        lineItems: [{ id: createId('LINE'), productId: 'P-SENSOR-K', quantity: '18', notes: 'Customer requested final quantity check.' }],
        approvalStatus: 'Rejected',
        approvalReason: 'Requested quantity exceeds confirmed project release. Recheck demand note.',
        approvalUpdatedAt: '2026-03-28T19:10:00',
        approvedBy: 'Ava Chen',
        appliedAt: '',
      },
    ],
    users: [
      {
        id: 'USR-AVA',
        name: 'Ava Chen',
        email: 'ava.chen@northline.com',
        role: 'Admin',
        status: 'Active',
        appointedBy: 'Founder',
        appointedAt: '2026-03-01T08:00:00',
        permissionsUpdatedAt: '2026-03-01T08:00:00',
        lastLoginAt: '2026-03-30T08:22:00',
      },
      {
        id: 'USR-IRIS',
        name: 'Iris Wang',
        email: 'iris.wang@northline.com',
        role: 'Staff',
        status: 'Active',
        appointedBy: 'Ava Chen',
        appointedAt: '2026-03-03T09:15:00',
        permissionsUpdatedAt: '2026-03-03T09:15:00',
        lastLoginAt: '2026-03-30T09:02:00',
      },
      {
        id: 'USR-OWEN',
        name: 'Owen Li',
        email: 'owen.li@northline.com',
        role: 'Staff',
        status: 'Active',
        appointedBy: 'Ava Chen',
        appointedAt: '2026-03-03T09:40:00',
        permissionsUpdatedAt: '2026-03-03T09:40:00',
        lastLoginAt: '2026-03-29T08:04:00',
      },
      {
        id: 'USR-NOAH',
        name: 'Noah Zhang',
        email: 'noah.zhang@northline.com',
        role: 'Staff',
        status: 'Active',
        appointedBy: 'Ava Chen',
        appointedAt: '2026-03-04T10:05:00',
        permissionsUpdatedAt: '2026-03-04T10:05:00',
        lastLoginAt: '2026-03-28T16:10:00',
      },
      {
        id: 'USR-MIA',
        name: 'Mia Lin',
        email: 'mia.lin@northline.com',
        role: 'Staff',
        status: 'Active',
        appointedBy: 'Ava Chen',
        appointedAt: '2026-03-05T11:00:00',
        permissionsUpdatedAt: '2026-03-05T11:00:00',
        lastLoginAt: '2026-03-29T09:48:00',
      },
    ],
    lastSync: nowIso(),
  };
}

export function buildProductOptions(store: WorkspaceStore): SearchOption[] {
  return store.products.map((product) => {
    const category = findCategory(store, product.categoryId);

    return {
      value: product.id,
      label: product.productName,
      detail: `${product.productCode} · ${product.unit}${category ? ` · ${category.categoryName}` : ''}`,
      keywords: `${product.productCode} ${product.productName} ${product.unit} ${category?.categoryName ?? ''}`,
    };
  });
}

export function buildWarehouseOptions(store: WorkspaceStore): SearchOption[] {
  return store.warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.warehouseName,
    detail: `${warehouse.warehouseCode} · ${warehouse.country}`,
    keywords: `${warehouse.warehouseCode} ${warehouse.warehouseName} ${warehouse.country} ${warehouse.location}`,
  }));
}

export function createInitialSelections(store: WorkspaceStore): OperationalSelections {
  const inventory = buildInventorySnapshots(store);
  const approvalQueue = buildApprovalQueue(store);

  return {
    inventoryId: inventory[0]?.id ?? '',
    inboundId: store.inboundOrders[0]?.id ?? '',
    outboundId: store.outboundOrders[0]?.id ?? '',
    approvalKey: approvalQueue[0]?.key ?? '',
    userId: store.users[0]?.id ?? '',
  };
}

export function getOperationalModule(route: WorkspaceRoute): OperationalModuleKey | null {
  if (route.startsWith('inventory-')) {
    return 'inventory';
  }

  if (route.startsWith('inbound-')) {
    return 'inbound';
  }

  if (route.startsWith('outbound-')) {
    return 'outbound';
  }

  if (route === 'approval-list') {
    return 'approval';
  }

  return null;
}

export function isOperationalRoute(route: WorkspaceRoute) {
  return getOperationalModule(route) !== null;
}

export function isOperationalFormRoute(route: WorkspaceRoute) {
  return route === 'inbound-create' || route === 'inbound-edit' || route === 'outbound-create' || route === 'outbound-edit';
}

export function findWarehouse(store: WorkspaceStore, warehouseId: string) {
  return store.warehouses.find((item) => item.id === warehouseId);
}

export function findCategory(store: WorkspaceStore, categoryId: string) {
  return store.categories.find((item) => item.id === categoryId);
}

export function findProduct(store: WorkspaceStore, productId: string) {
  return store.products.find((item) => item.id === productId);
}

export function getSelectedInbound(store: WorkspaceStore, selections: OperationalSelections) {
  return store.inboundOrders.find((item) => item.id === selections.inboundId) ?? store.inboundOrders[0];
}

export function getSelectedOutbound(store: WorkspaceStore, selections: OperationalSelections) {
  return store.outboundOrders.find((item) => item.id === selections.outboundId) ?? store.outboundOrders[0];
}

export function getSelectedInventory(store: WorkspaceStore, selections: OperationalSelections) {
  const inventoryRows = buildInventorySnapshots(store);
  return inventoryRows.find((row) => row.id === selections.inventoryId) ?? inventoryRows[0];
}

export function getSelectedApproval(store: WorkspaceStore, selections: OperationalSelections) {
  const approvalQueue = buildApprovalQueue(store);
  return approvalQueue.find((item) => item.key === selections.approvalKey) ?? approvalQueue[0];
}

export function getSelectedUser(store: WorkspaceStore, selections: OperationalSelections) {
  return store.users.find((item) => item.id === selections.userId) ?? store.users[0];
}

export function recordUserLogin(store: WorkspaceStore, userId: string) {
  const loggedAt = nowIso();

  return {
    ...store,
    users: store.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            lastLoginAt: loggedAt,
            status: 'Active' as UserStatus,
          }
        : user,
    ),
    lastSync: loggedAt,
  };
}

export function registerWorkspaceUser(
  store: WorkspaceStore,
  input: {
    email: string;
    name?: string;
  },
  actor?: UserSession | null,
) {
  const createdAt = nowIso();
  const email = sanitizeInput(input.email).toLowerCase();
  const fallbackName = email.split('@')[0]?.replace(/[._-]+/g, ' ') || 'Warehouse User';
  const name =
    sanitizeInput(input.name ?? '')
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ') || fallbackName.replace(/\b\w/g, (character) => character.toUpperCase());

  const user: WorkspaceUser = {
    id: createId('USR'),
    name,
    email,
    role: 'Staff',
    status: 'Active',
    appointedBy: actor?.name ?? 'Self-service',
    appointedAt: createdAt,
    permissionsUpdatedAt: createdAt,
    lastLoginAt: createdAt,
  };

  return {
    store: {
      ...store,
      users: [user, ...store.users],
      lastSync: createdAt,
    },
    user,
  };
}

export function updateUserRole(store: WorkspaceStore, userId: string, nextRole: UserRole, actor: UserSession) {
  if (!hasPermission(actor, 'manage_users')) {
    return store;
  }

  const targetUser = store.users.find((user) => user.id === userId);

  if (!targetUser) {
    return store;
  }

  const adminCount = store.users.filter((user) => user.role === 'Admin').length;
  if (targetUser.id === actor.id && nextRole !== 'Admin' && adminCount <= 1) {
    return store;
  }

  if (nextRole === 'Admin' && !hasPermission(actor, 'assign_admin')) {
    return store;
  }

  const updatedAt = nowIso();

  return {
    ...store,
    users: store.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            role: nextRole,
            appointedBy: nextRole === 'Admin' ? actor.name : user.appointedBy,
            appointedAt: nextRole === 'Admin' ? updatedAt : user.appointedAt,
            permissionsUpdatedAt: updatedAt,
          }
        : user,
    ),
    lastSync: updatedAt,
  };
}

export function buildInventorySnapshots(store: WorkspaceStore): InventorySnapshot[] {
  const snapshotMap = new Map<
    string,
    {
      base: InventoryRecord;
      onHand: number;
      lastUpdatedAt: string;
    }
  >();

  store.inventoryRecords.forEach((record) => {
    snapshotMap.set(`${record.warehouseId}:${record.productId}`, {
      base: record,
      onHand: record.onHandBase,
      lastUpdatedAt: record.updatedAt,
    });
  });

  const applyLineItems = (
    module: 'inbound' | 'outbound',
    warehouseId: string,
    lineItems: OrderLineItem[],
    appliedAt: string,
  ) => {
    lineItems.forEach((lineItem) => {
      const quantity = quantityToNumber(lineItem.quantity);

      if (!lineItem.productId || quantity <= 0) {
        return;
      }

      const key = `${warehouseId}:${lineItem.productId}`;
      const current = snapshotMap.get(key);

      if (current) {
        current.onHand += module === 'inbound' ? quantity : -quantity;
        current.lastUpdatedAt = maxIso(current.lastUpdatedAt, appliedAt);
        return;
      }

      snapshotMap.set(key, {
        base: {
          id: `INV-${warehouseId}-${lineItem.productId}`,
          productId: lineItem.productId,
          warehouseId,
          location: 'AUTO-01',
          onHandBase: 0,
          threshold: 20,
          updatedAt: appliedAt,
        },
        onHand: module === 'inbound' ? quantity : -quantity,
        lastUpdatedAt: appliedAt,
      });
    });
  };

  store.inboundOrders
    .filter((order) => order.approvalStatus === 'Approved' && order.appliedAt)
    .forEach((order) => {
      applyLineItems('inbound', order.warehouseId, order.lineItems, order.appliedAt);
    });

  store.outboundOrders
    .filter((order) => order.approvalStatus === 'Approved' && order.appliedAt)
    .forEach((order) => {
      applyLineItems('outbound', order.warehouseId, order.lineItems, order.appliedAt);
    });

  return Array.from(snapshotMap.values())
    .map(({ base, onHand, lastUpdatedAt }) => {
      const product = findProduct(store, base.productId);
      const category = product ? findCategory(store, product.categoryId) : undefined;
      const warehouse = findWarehouse(store, base.warehouseId);
      const normalizedOnHand = Math.max(0, onHand);

      return {
        id: base.id,
        productId: base.productId,
        warehouseId: base.warehouseId,
        productCode: product?.productCode ?? base.productId,
        productName: product?.productName ?? 'Unknown Product',
        categoryName: category?.categoryName ?? 'Unassigned',
        warehouseCode: warehouse?.warehouseCode ?? base.warehouseId,
        warehouseName: warehouse?.warehouseName ?? base.warehouseId,
        region: warehouse?.region ?? '--',
        country: warehouse?.country ?? '--',
        location: base.location,
        unit: product?.unit ?? 'Unit',
        onHand: normalizedOnHand,
        threshold: base.threshold,
        status: normalizedOnHand <= 0 ? 'Out of Stock' : normalizedOnHand <= base.threshold ? 'Low Stock' : 'Healthy',
        lastUpdatedAt,
      } satisfies InventorySnapshot;
    })
    .sort((left, right) => {
      const severityRank = {
        'Out of Stock': 0,
        'Low Stock': 1,
        Healthy: 2,
      } as const;

      return severityRank[left.status] - severityRank[right.status] || left.productCode.localeCompare(right.productCode);
    });
}

export function buildApprovalQueue(store: WorkspaceStore): ApprovalQueueItem[] {
  const inboundItems = store.inboundOrders.map((order) => {
    const warehouse = findWarehouse(store, order.warehouseId);

    return {
      key: `inbound:${order.id}`,
      id: order.id,
      module: 'Inbound',
      orderNo: order.inboundNo,
      warehouseId: order.warehouseId,
      warehouseCode: warehouse?.warehouseCode ?? order.warehouseId,
      warehouseName: warehouse?.warehouseName ?? order.warehouseId,
      partner: order.supplierName,
      orderStatus: order.status,
      approvalStatus: order.approvalStatus,
      approvalReason: order.approvalReason,
      units: countOrderUnits(order.lineItems),
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      approvalUpdatedAt: order.approvalUpdatedAt,
      approvedBy: order.approvedBy,
    } satisfies ApprovalQueueItem;
  });

  const outboundItems = store.outboundOrders.map((order) => {
    const warehouse = findWarehouse(store, order.warehouseId);

    return {
      key: `outbound:${order.id}`,
      id: order.id,
      module: 'Outbound',
      orderNo: order.outboundNo,
      warehouseId: order.warehouseId,
      warehouseCode: warehouse?.warehouseCode ?? order.warehouseId,
      warehouseName: warehouse?.warehouseName ?? order.warehouseId,
      partner: order.destination,
      orderStatus: order.status,
      approvalStatus: order.approvalStatus,
      approvalReason: order.approvalReason,
      units: countOrderUnits(order.lineItems),
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      approvalUpdatedAt: order.approvalUpdatedAt,
      approvedBy: order.approvedBy,
    } satisfies ApprovalQueueItem;
  });

  const approvalRank = {
    'Pending Approval': 0,
    Rejected: 1,
    Approved: 2,
  } as const;

  return [...inboundItems, ...outboundItems].sort((left, right) => {
    const rankDiff = approvalRank[left.approvalStatus] - approvalRank[right.approvalStatus];
    if (rankDiff !== 0) {
      return rankDiff;
    }

    return timestamp(right.approvalUpdatedAt || right.createdAt).getTime() - timestamp(left.approvalUpdatedAt || left.createdAt).getTime();
  });
}

export function createInboundDraft(): InboundFormData {
  return {
    inboundNo: '',
    warehouseId: '',
    supplierName: '',
    referenceNo: '',
    plannedDate: todayInputValue(),
    notes: '',
    lineItems: [createEmptyLineItem()],
  };
}

export function createOutboundDraft(): OutboundFormData {
  return {
    outboundNo: '',
    warehouseId: '',
    destination: '',
    carrier: '',
    shipmentDate: todayInputValue(),
    notes: '',
    lineItems: [createEmptyLineItem()],
  };
}

export function mapInboundToFormData(record: InboundRecord): InboundFormData {
  return {
    inboundNo: record.inboundNo,
    warehouseId: record.warehouseId,
    supplierName: record.supplierName,
    referenceNo: record.referenceNo,
    plannedDate: record.plannedDate,
    notes: record.notes,
    lineItems: record.lineItems.map((lineItem) => ({ ...lineItem })),
  };
}

export function mapOutboundToFormData(record: OutboundRecord): OutboundFormData {
  return {
    outboundNo: record.outboundNo,
    warehouseId: record.warehouseId,
    destination: record.destination,
    carrier: record.carrier,
    shipmentDate: record.shipmentDate,
    notes: record.notes,
    lineItems: record.lineItems.map((lineItem) => ({ ...lineItem })),
  };
}

export function createInboundNumber(store: WorkspaceStore) {
  return `INB-${String(1045 + store.inboundOrders.length + 1).padStart(4, '0')}`;
}

export function createOutboundNumber(store: WorkspaceStore) {
  return `OUT-${String(2024 + store.outboundOrders.length + 1).padStart(4, '0')}`;
}

export function saveInboundOrder(
  store: WorkspaceStore,
  formData: InboundFormData,
  options: {
    existingId?: string;
    submitForApproval: boolean;
    actor: UserSession;
  },
) {
  const cleanedLineItems = sanitizeLineItems(formData.lineItems).filter((lineItem) => lineItem.productId && quantityToNumber(lineItem.quantity) > 0);
  const createdAt = options.existingId ? getSelectedRecordTimestamp(store.inboundOrders, options.existingId) : nowIso();
  const existingRecord = options.existingId ? store.inboundOrders.find((item) => item.id === options.existingId) : undefined;

  const nextRecord: InboundRecord = {
    id: options.existingId ?? createId('INB'),
    inboundNo: sanitizeInput(formData.inboundNo) || createInboundNumber(store),
    warehouseId: sanitizeInput(formData.warehouseId),
    supplierName: sanitizeInput(formData.supplierName),
    referenceNo: sanitizeInput(formData.referenceNo),
    plannedDate: formData.plannedDate,
    status: options.submitForApproval ? 'Pending Receipt' : 'Draft',
    createdBy: existingRecord?.createdBy ?? options.actor.name,
    createdAt,
    confirmedAt: '',
    notes: sanitizeFreeText(formData.notes),
    lineItems: cleanedLineItems.length > 0 ? cleanedLineItems : [createEmptyLineItem()],
    approvalStatus: options.submitForApproval ? 'Pending Approval' : existingRecord?.approvalStatus === 'Approved' ? 'Approved' : 'Pending Approval',
    approvalReason: options.submitForApproval ? '' : existingRecord?.approvalReason ?? '',
    approvalUpdatedAt: options.submitForApproval ? '' : existingRecord?.approvalUpdatedAt ?? '',
    approvedBy: options.submitForApproval ? '' : existingRecord?.approvedBy ?? '',
    appliedAt: '',
  };

  const inboundOrders = existingRecord
    ? store.inboundOrders.map((item) => (item.id === existingRecord.id ? nextRecord : item))
    : [nextRecord, ...store.inboundOrders];

  return {
    store: {
      ...store,
      inboundOrders,
      lastSync: nowIso(),
    },
    selectionId: nextRecord.id,
  };
}

export function saveOutboundOrder(
  store: WorkspaceStore,
  formData: OutboundFormData,
  options: {
    existingId?: string;
    submitForApproval: boolean;
    actor: UserSession;
  },
) {
  const cleanedLineItems = sanitizeLineItems(formData.lineItems).filter((lineItem) => lineItem.productId && quantityToNumber(lineItem.quantity) > 0);
  const createdAt = options.existingId ? getSelectedRecordTimestamp(store.outboundOrders, options.existingId) : nowIso();
  const existingRecord = options.existingId ? store.outboundOrders.find((item) => item.id === options.existingId) : undefined;

  const nextRecord: OutboundRecord = {
    id: options.existingId ?? createId('OUT'),
    outboundNo: sanitizeInput(formData.outboundNo) || createOutboundNumber(store),
    warehouseId: sanitizeInput(formData.warehouseId),
    destination: sanitizeInput(formData.destination),
    carrier: sanitizeInput(formData.carrier),
    shipmentDate: formData.shipmentDate,
    status: options.submitForApproval ? 'Pending Shipment' : 'Draft',
    createdBy: existingRecord?.createdBy ?? options.actor.name,
    createdAt,
    confirmedAt: '',
    notes: sanitizeFreeText(formData.notes),
    lineItems: cleanedLineItems.length > 0 ? cleanedLineItems : [createEmptyLineItem()],
    approvalStatus: options.submitForApproval ? 'Pending Approval' : existingRecord?.approvalStatus === 'Approved' ? 'Approved' : 'Pending Approval',
    approvalReason: options.submitForApproval ? '' : existingRecord?.approvalReason ?? '',
    approvalUpdatedAt: options.submitForApproval ? '' : existingRecord?.approvalUpdatedAt ?? '',
    approvedBy: options.submitForApproval ? '' : existingRecord?.approvedBy ?? '',
    appliedAt: '',
  };

  const outboundOrders = existingRecord
    ? store.outboundOrders.map((item) => (item.id === existingRecord.id ? nextRecord : item))
    : [nextRecord, ...store.outboundOrders];

  return {
    store: {
      ...store,
      outboundOrders,
      lastSync: nowIso(),
    },
    selectionId: nextRecord.id,
  };
}

function getSelectedRecordTimestamp(records: Array<{ id: string; createdAt: string }>, id: string) {
  return records.find((item) => item.id === id)?.createdAt ?? nowIso();
}

export function approveOrder(store: WorkspaceStore, module: 'inbound' | 'outbound', id: string, actor: UserSession): WorkspaceStore {
  if (!hasPermission(actor, 'approve_orders')) {
    return store;
  }

  const approvedAt = nowIso();

  if (module === 'inbound') {
    return {
      ...store,
      inboundOrders: store.inboundOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              status: 'Received',
              approvalStatus: 'Approved',
              approvalReason: '',
              approvalUpdatedAt: approvedAt,
              approvedBy: actor.name,
              appliedAt: approvedAt,
              confirmedAt: approvedAt,
            }
          : order,
      ),
      lastSync: approvedAt,
    };
  }

  return {
    ...store,
    outboundOrders: store.outboundOrders.map((order) =>
      order.id === id
        ? {
            ...order,
            status: 'Shipped',
            approvalStatus: 'Approved',
            approvalReason: '',
            approvalUpdatedAt: approvedAt,
            approvedBy: actor.name,
            appliedAt: approvedAt,
            confirmedAt: approvedAt,
          }
        : order,
    ),
    lastSync: approvedAt,
  };
}

export function rejectOrder(store: WorkspaceStore, module: 'inbound' | 'outbound', id: string, reason: string, actor: UserSession): WorkspaceStore {
  if (!hasPermission(actor, 'approve_orders')) {
    return store;
  }

  const rejectedAt = nowIso();
  const rejectionReason = sanitizeFreeText(reason) || 'Approval rejected. Please review the order details.';

  if (module === 'inbound') {
    return {
      ...store,
      inboundOrders: store.inboundOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              approvalStatus: 'Rejected',
              approvalReason: rejectionReason,
              approvalUpdatedAt: rejectedAt,
              approvedBy: actor.name,
              appliedAt: '',
              confirmedAt: '',
            }
          : order,
      ),
      lastSync: rejectedAt,
    };
  }

  return {
    ...store,
    outboundOrders: store.outboundOrders.map((order) =>
      order.id === id
        ? {
            ...order,
            approvalStatus: 'Rejected',
            approvalReason: rejectionReason,
            approvalUpdatedAt: rejectedAt,
            approvedBy: actor.name,
            appliedAt: '',
            confirmedAt: '',
          }
        : order,
    ),
    lastSync: rejectedAt,
  };
}

export function upsertInventoryRecord(store: WorkspaceStore, record: InventoryRecord) {
  const existing = store.inventoryRecords.find((item) => item.id === record.id);
  const inventoryRecords = existing
    ? store.inventoryRecords.map((item) => (item.id === record.id ? record : item))
    : [record, ...store.inventoryRecords];

  return {
    ...store,
    inventoryRecords,
    lastSync: nowIso(),
  };
}

export function buildDashboardSnapshot(store: WorkspaceStore, referenceTime = new Date()): WarehouseDashboardSnapshot {
  const inventory = buildInventorySnapshots(store);
  const totalInventoryQuantity = inventory.reduce((sum, item) => sum + item.onHand, 0);
  const capacityTotal = store.warehouses.reduce((sum, warehouse) => sum + warehouse.capacity, 0);
  const warehouseSpaceUtilizationRate = Number(((totalInventoryQuantity / Math.max(capacityTotal, 1)) * 100).toFixed(1));
  const todayInboundQuantity = store.inboundOrders
    .filter((order) => order.approvalStatus === 'Approved' && order.appliedAt && sameDay(timestamp(order.appliedAt), referenceTime))
    .reduce((sum, order) => sum + countOrderUnits(order.lineItems), 0);
  const todayOutboundQuantity = store.outboundOrders
    .filter((order) => order.approvalStatus === 'Approved' && order.appliedAt && sameDay(timestamp(order.appliedAt), referenceTime))
    .reduce((sum, order) => sum + countOrderUnits(order.lineItems), 0);
  const trend = buildTrendSeries(store, referenceTime);
  const categoryShare = buildCategoryShare(inventory);
  const warnings = buildWarningRows(inventory);
  const previousTrendPoint = trend[trend.length - 2] ?? trend[0];
  const currentTrendPoint = trend[trend.length - 1] ?? previousTrendPoint;

  return {
    generatedAt: store.lastSync,
    refreshIntervalMs: DASHBOARD_REFRESH_INTERVAL_MS,
    feedLabel: 'Mock polling active',
    coverageLabel: `${store.warehouses.length} active warehouses across ${new Set(store.warehouses.map((item) => item.country)).size} countries`,
    metrics: {
      totalInventoryQuantity: {
        value: totalInventoryQuantity,
        comparison: `${inventory.filter((item) => item.status !== 'Healthy').length} warning records`,
        helper: 'Current on-hand quantity after approved receipts and shipments.',
        trendTone: 'neutral',
      },
      todayInboundQuantity: {
        value: todayInboundQuantity,
        comparison: `${todayInboundQuantity - previousTrendPoint.inbound >= 0 ? '+' : ''}${todayInboundQuantity - previousTrendPoint.inbound} vs previous day`,
        helper: 'Approved inbound quantity posted today.',
        trendTone: todayInboundQuantity >= previousTrendPoint.inbound ? 'positive' : 'neutral',
      },
      todayOutboundQuantity: {
        value: todayOutboundQuantity,
        comparison: `${todayOutboundQuantity - previousTrendPoint.outbound >= 0 ? '+' : ''}${todayOutboundQuantity - previousTrendPoint.outbound} vs previous day`,
        helper: 'Approved outbound quantity deducted today.',
        trendTone: currentTrendPoint.outbound >= previousTrendPoint.outbound ? 'positive' : 'neutral',
      },
      warehouseSpaceUtilizationRate: {
        value: warehouseSpaceUtilizationRate,
        comparison: `${warnings.length} inventory warnings`,
        helper: 'Utilization is derived from total on-hand quantity versus site capacity.',
        trendTone: warehouseSpaceUtilizationRate >= 85 ? 'caution' : 'neutral',
      },
    },
    trend,
    categoryShare,
    warnings,
  };
}

function buildTrendSeries(store: WorkspaceStore, referenceTime: Date): WarehouseTrendPoint[] {
  return historicalTrendSeed.map((seedPoint, index) => {
    const day = addDays(referenceTime, index - (historicalTrendSeed.length - 1));
    const isoDate = day.toISOString();

    const inboundPosted = store.inboundOrders.reduce((sum, order) => {
      if (order.approvalStatus !== 'Approved' || !order.appliedAt || !sameDay(timestamp(order.appliedAt), day)) {
        return sum;
      }

      return sum + countOrderUnits(order.lineItems);
    }, 0);

    const outboundPosted = store.outboundOrders.reduce((sum, order) => {
      if (order.approvalStatus !== 'Approved' || !order.appliedAt || !sameDay(timestamp(order.appliedAt), day)) {
        return sum;
      }

      return sum + countOrderUnits(order.lineItems);
    }, 0);

    return {
      label: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(day),
      isoDate,
      inbound: seedPoint.inbound + inboundPosted,
      outbound: seedPoint.outbound + outboundPosted,
    };
  });
}

function buildCategoryShare(inventory: InventorySnapshot[]): InventoryCategoryShare[] {
  const totals = new Map<string, number>();

  inventory.forEach((item) => {
    totals.set(item.categoryName, (totals.get(item.categoryName) ?? 0) + item.onHand);
  });

  return Array.from(totals.entries())
    .map(([label, value]) => ({
      id: sanitizeCode(label.toLowerCase()),
      label,
      value,
      color: categoryColorMap.get(label) ?? '#64748b',
    }))
    .sort((left, right) => right.value - left.value);
}

function buildWarningRows(inventory: InventorySnapshot[]): InventoryWarning[] {
  return inventory
    .filter((item) => item.onHand <= item.threshold)
    .map((item) => {
      const severity: InventoryWarning['severity'] = item.onHand <= Math.max(1, item.threshold * 0.6) ? 'critical' : 'warning';

      return {
        id: item.id,
        sku: item.productCode,
        productName: item.productName,
        category: item.categoryName,
        region: item.region,
        country: item.country,
        warehouse: item.warehouseName,
        location: item.location,
        onHand: item.onHand,
        threshold: item.threshold,
        severity,
        recommendedAction:
          item.onHand <= 0 ? 'Create replenishment or inbound request immediately.' : 'Review approved demand and replenish this SKU.',
      } satisfies InventoryWarning;
    })
    .sort((left, right) => left.onHand - right.onHand);
}
