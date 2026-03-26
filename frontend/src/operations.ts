import type { DetailGroup, SummaryItem, TableRow, WorkspaceRoute } from './content';

export type OperationalModuleKey = 'product' | 'category' | 'inbound' | 'outbound';

export type OperationalSelections = {
  productId: string;
  categoryId: string;
  inboundId: string;
  outboundId: string;
};

export type SearchOption = {
  value: string;
  label: string;
  detail: string;
  keywords: string;
};

export type WarehouseRecord = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  location: string;
  status: 'Active' | 'Maintenance';
};

export type CategoryStatus = 'Draft' | 'Active' | 'Hold';
export type ProductStatus = 'Draft' | 'Active' | 'Hold';
export type InboundStatus = 'Draft' | 'Awaiting Receipt' | 'Pending QC' | 'Confirmed';
export type OutboundStatus = 'Draft' | 'Picking' | 'Packed' | 'Shipped';

export type CategoryRecord = {
  id: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  status: CategoryStatus;
  notes: string;
  updatedAt: string;
  updatedBy: string;
};

export type ProductRecord = {
  id: string;
  productCode: string;
  productName: string;
  categoryId: string;
  warehouseId: string;
  unit: string;
  status: ProductStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderLineItem = {
  id: string;
  productId: string;
  quantity: string;
  notes: string;
};

export type InboundRecord = {
  id: string;
  inboundNo: string;
  warehouseId: string;
  status: InboundStatus;
  supplierName: string;
  referenceNo: string;
  plannedDate: string;
  createdBy: string;
  createdAt: string;
  confirmedAt: string;
  notes: string;
  lineItems: OrderLineItem[];
};

export type OutboundRecord = {
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

export type WorkspaceStore = {
  warehouses: WarehouseRecord[];
  categories: CategoryRecord[];
  products: ProductRecord[];
  inboundOrders: InboundRecord[];
  outboundOrders: OutboundRecord[];
};

export type ProductFormData = {
  productCode: string;
  productName: string;
  categoryId: string;
  warehouseId: string;
  unit: string;
  status: ProductStatus;
  notes: string;
};

export type CategoryFormData = {
  categoryCode: string;
  categoryName: string;
  description: string;
  status: CategoryStatus;
  notes: string;
};

export type InboundFormData = {
  inboundNo: string;
  warehouseId: string;
  supplierName: string;
  referenceNo: string;
  plannedDate: string;
  status: InboundStatus;
  notes: string;
  lineItems: OrderLineItem[];
};

export type OutboundFormData = {
  outboundNo: string;
  warehouseId: string;
  destination: string;
  carrier: string;
  shipmentDate: string;
  status: OutboundStatus;
  notes: string;
  lineItems: OrderLineItem[];
};

export type DetailLineItem = {
  id: string;
  productName: string;
  productCode: string;
  quantity: string;
  unit: string;
  notes: string;
};

export type DetailSection = {
  groups: DetailGroup[];
  lineItems?: DetailLineItem[];
  notes?: string;
  notesLabel?: string;
};

export const currentOperator = 'Ava Chen';

export const categoryStatusOptions: CategoryStatus[] = ['Draft', 'Active', 'Hold'];
export const productStatusOptions: ProductStatus[] = ['Draft', 'Active', 'Hold'];
export const inboundStatusOptions: InboundStatus[] = ['Draft', 'Awaiting Receipt', 'Pending QC', 'Confirmed'];
export const outboundStatusOptions: OutboundStatus[] = ['Draft', 'Picking', 'Packed', 'Shipped'];

const shortStampFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

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

function initials(value: string, maxLength: number) {
  const tokens = value
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toUpperCase());

  if (tokens.length === 0) {
    return '';
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, maxLength);
  }

  return tokens
    .map((token) => token[0])
    .join('')
    .slice(0, maxLength);
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function formatShortStamp(value: string) {
  return shortStampFormatter.format(timestamp(value));
}

export function formatLongDate(value: string) {
  return longDateFormatter.format(timestamp(value));
}

export function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createEmptyLineItem(): OrderLineItem {
  return {
    id: createId('LINE'),
    productId: '',
    quantity: '',
    notes: '',
  };
}

export function createInitialWorkspaceStore(): WorkspaceStore {
  return {
    warehouses: [
      {
        id: 'WH-SH-01',
        warehouseCode: 'WH-SH-01',
        warehouseName: 'Shanghai Primary Warehouse',
        location: 'Shanghai',
        status: 'Active',
      },
      {
        id: 'WH-NB-02',
        warehouseCode: 'WH-NB-02',
        warehouseName: 'Ningbo Flow Warehouse',
        location: 'Ningbo',
        status: 'Active',
      },
      {
        id: 'WH-SZ-03',
        warehouseCode: 'WH-SZ-03',
        warehouseName: 'Suzhou Reserve Warehouse',
        location: 'Suzhou',
        status: 'Maintenance',
      },
    ],
    categories: [
      {
        id: 'CAT-FAST-01',
        categoryCode: 'CAT-FAST-01',
        categoryName: 'Fasteners',
        description: 'Bolts, nuts, and washers.',
        status: 'Active',
        notes: 'Default unit is usually Pack because these items arrive in bundled cartons.',
        updatedAt: '2026-03-24T08:10:00',
        updatedBy: 'Mia Lin',
      },
      {
        id: 'CAT-HARD-02',
        categoryCode: 'CAT-HARD-02',
        categoryName: 'Hardware',
        description: 'Clamps, brackets, and fittings.',
        status: 'Active',
        notes: 'Most hardware ships as individual units with visual QC at receipt.',
        updatedAt: '2026-03-23T16:44:00',
        updatedBy: 'Mia Lin',
      },
      {
        id: 'CAT-ELEC-03',
        categoryCode: 'CAT-ELEC-03',
        categoryName: 'Electrical',
        description: 'Harnesses, connectors, and sensor kits.',
        status: 'Draft',
        notes: 'Electrical products use serialized receiving in the later roadmap, but this pass stays lightweight.',
        updatedAt: '2026-03-22T11:22:00',
        updatedBy: 'Ava Chen',
      },
      {
        id: 'CAT-LP-04',
        categoryCode: 'CAT-LP-04',
        categoryName: 'Low Priority',
        description: 'Legacy accessories pending cleanup.',
        status: 'Hold',
        notes: 'Use only for tail inventory until the category is retired.',
        updatedAt: '2026-03-21T14:06:00',
        updatedBy: 'Leo Xu',
      },
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
        notes: 'Primary intake SKU for Dock 04 pallet receipts.',
        createdAt: '2026-03-10T11:05:00',
        updatedAt: '2026-03-24T08:15:00',
      },
      {
        id: 'P-NUT-B',
        productCode: 'P-NUT-B',
        productName: 'Nut Pack B',
        categoryId: 'CAT-FAST-01',
        warehouseId: 'WH-NB-02',
        unit: 'Pack',
        status: 'Active',
        notes: 'Outbound demand usually peaks in the afternoon wave.',
        createdAt: '2026-03-11T09:16:00',
        updatedAt: '2026-03-24T08:02:00',
      },
      {
        id: 'P-CLAMP-D',
        productCode: 'P-CLAMP-D',
        productName: 'Clamp D',
        categoryId: 'CAT-HARD-02',
        warehouseId: 'WH-SH-01',
        unit: 'Unit',
        status: 'Hold',
        notes: 'Hold after the last outbound due to a bracket finish discrepancy.',
        createdAt: '2026-03-09T14:22:00',
        updatedAt: '2026-03-23T16:49:00',
      },
      {
        id: 'P-SENSOR-K',
        productCode: 'P-SENSOR-K',
        productName: 'Sensor Kit K',
        categoryId: 'CAT-ELEC-03',
        warehouseId: 'WH-SH-01',
        unit: 'Set',
        status: 'Draft',
        notes: 'Draft product waiting for category approval and first inbound receipt.',
        createdAt: '2026-03-22T10:18:00',
        updatedAt: '2026-03-22T10:18:00',
      },
    ],
    inboundOrders: [
      {
        id: 'INB-1048',
        inboundNo: 'INB-1048',
        warehouseId: 'WH-SH-01',
        status: 'Awaiting Receipt',
        supplierName: 'North Harbour Metals',
        referenceNo: 'ASN-7731',
        plannedDate: '2026-03-25',
        createdBy: 'Ava Chen',
        createdAt: '2026-03-24T08:30:00',
        confirmedAt: '',
        notes: 'Dock 04 requires pallet photos before the final receipt confirmation.',
        lineItems: [
          {
            id: createId('LINE'),
            productId: 'P-BOLT-A',
            quantity: '120',
            notes: 'Check outer carton seal on arrival.',
          },
          {
            id: createId('LINE'),
            productId: 'P-CLAMP-D',
            quantity: '18',
            notes: 'Quality hold units can be received but should stay in staging.',
          },
        ],
      },
      {
        id: 'INB-1047',
        inboundNo: 'INB-1047',
        warehouseId: 'WH-NB-02',
        status: 'Pending QC',
        supplierName: 'Pacific Fastener Co.',
        referenceNo: 'ASN-7718',
        plannedDate: '2026-03-24',
        createdBy: 'Leo Xu',
        createdAt: '2026-03-24T07:55:00',
        confirmedAt: '',
        notes: 'Receiving team flagged count variance on one pallet.',
        lineItems: [
          {
            id: createId('LINE'),
            productId: 'P-NUT-B',
            quantity: '240',
            notes: 'Count variance pending QC sign-off.',
          },
        ],
      },
      {
        id: 'INB-1046',
        inboundNo: 'INB-1046',
        warehouseId: 'WH-SZ-03',
        status: 'Confirmed',
        supplierName: 'Ridgeway Supply',
        referenceNo: 'ASN-7684',
        plannedDate: '2026-03-23',
        createdBy: 'Mia Lin',
        createdAt: '2026-03-23T18:12:00',
        confirmedAt: '2026-03-23T19:04:00',
        notes: 'Receipt closed after dock reconciliation.',
        lineItems: [
          {
            id: createId('LINE'),
            productId: 'P-SENSOR-K',
            quantity: '12',
            notes: 'Stored in inspection cage after receipt.',
          },
        ],
      },
    ],
    outboundOrders: [
      {
        id: 'OUT-2027',
        outboundNo: 'OUT-2027',
        warehouseId: 'WH-SH-01',
        destination: 'Hangzhou DC',
        carrier: 'BlueLine Freight',
        shipmentDate: '2026-03-25',
        status: 'Picking',
        createdBy: 'Iris Wang',
        createdAt: '2026-03-24T09:12:00',
        confirmedAt: '',
        notes: 'Priority window leaves at 17:30 local time.',
        lineItems: [
          {
            id: createId('LINE'),
            productId: 'P-NUT-B',
            quantity: '80',
            notes: 'Wave 2 allocation.',
          },
          {
            id: createId('LINE'),
            productId: 'P-BOLT-A',
            quantity: '42',
            notes: 'Mixed pallet with nut packs.',
          },
        ],
      },
      {
        id: 'OUT-2026',
        outboundNo: 'OUT-2026',
        warehouseId: 'WH-NB-02',
        destination: 'Nanjing Crossdock',
        carrier: 'Harbour Cargo',
        shipmentDate: '2026-03-24',
        status: 'Packed',
        createdBy: 'Owen Li',
        createdAt: '2026-03-24T08:10:00',
        confirmedAt: '',
        notes: 'Waiting at outbound staging for carrier check-in.',
        lineItems: [
          {
            id: createId('LINE'),
            productId: 'P-NUT-B',
            quantity: '110',
            notes: 'Packed into four totes.',
          },
        ],
      },
      {
        id: 'OUT-2025',
        outboundNo: 'OUT-2025',
        warehouseId: 'WH-SH-01',
        destination: 'Wuxi Retail Hub',
        carrier: 'EastJet Logistics',
        shipmentDate: '2026-03-23',
        status: 'Shipped',
        createdBy: 'Iris Wang',
        createdAt: '2026-03-23T17:46:00',
        confirmedAt: '2026-03-23T18:06:00',
        notes: 'Shipment released with signed dispatch sheet.',
        lineItems: [
          {
            id: createId('LINE'),
            productId: 'P-BOLT-A',
            quantity: '64',
            notes: 'Delivered against weekly replenishment plan.',
          },
        ],
      },
    ],
  };
}

export function createInitialSelections(store: WorkspaceStore): OperationalSelections {
  return {
    productId: store.products[0]?.id ?? '',
    categoryId: store.categories[0]?.id ?? '',
    inboundId: store.inboundOrders[0]?.id ?? '',
    outboundId: store.outboundOrders[0]?.id ?? '',
  };
}

export function getOperationalModule(route: WorkspaceRoute): OperationalModuleKey | null {
  if (route.startsWith('product-')) {
    return 'product';
  }

  if (route.startsWith('category-')) {
    return 'category';
  }

  if (route.startsWith('inbound-')) {
    return 'inbound';
  }

  if (route.startsWith('outbound-')) {
    return 'outbound';
  }

  return null;
}

export function isOperationalRoute(route: WorkspaceRoute) {
  return getOperationalModule(route) !== null;
}

export function isOperationalFormRoute(route: WorkspaceRoute) {
  return route.endsWith('-create') || route.endsWith('-edit');
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

export function getSelectedCategory(store: WorkspaceStore, selections: OperationalSelections) {
  return findCategory(store, selections.categoryId) ?? store.categories[0];
}

export function getSelectedProduct(store: WorkspaceStore, selections: OperationalSelections) {
  return findProduct(store, selections.productId) ?? store.products[0];
}

export function getSelectedInbound(store: WorkspaceStore, selections: OperationalSelections) {
  return store.inboundOrders.find((item) => item.id === selections.inboundId) ?? store.inboundOrders[0];
}

export function getSelectedOutbound(store: WorkspaceStore, selections: OperationalSelections) {
  return store.outboundOrders.find((item) => item.id === selections.outboundId) ?? store.outboundOrders[0];
}

export function getStatusTone(status: string) {
  if (status === 'Active' || status === 'Confirmed' || status === 'Shipped') {
    return 'positive';
  }

  if (status === 'Hold' || status === 'Pending QC') {
    return 'warning';
  }

  if (status === 'Draft') {
    return 'muted';
  }

  return 'info';
}

export function suggestCategoryCode(name: string, store: WorkspaceStore) {
  const stem = initials(name, 4) || 'CAT';
  const nextIndex = String(store.categories.length + 1).padStart(2, '0');
  return `CAT-${stem}-${nextIndex}`;
}

export function suggestProductCode(name: string, categoryId: string, store: WorkspaceStore) {
  const category = findCategory(store, categoryId);
  const categoryToken = category?.categoryCode.split('-')[1]?.slice(0, 4) ?? 'ITEM';
  const nameToken = initials(name, 2) || 'PR';
  return `P-${categoryToken}-${nameToken}${String(store.products.length + 1).padStart(2, '0')}`;
}

export function suggestUnit(categoryId: string, store: WorkspaceStore) {
  const category = findCategory(store, categoryId);
  const normalizedName = category?.categoryName.toLowerCase() ?? '';

  if (normalizedName.includes('fastener')) {
    return 'Pack';
  }

  if (normalizedName.includes('electrical')) {
    return 'Set';
  }

  return 'Unit';
}

export function buildWarehouseOptions(store: WorkspaceStore): SearchOption[] {
  return store.warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.warehouseName,
    detail: `${warehouse.warehouseCode} · ${warehouse.location}`,
    keywords: `${warehouse.warehouseCode} ${warehouse.warehouseName} ${warehouse.location} ${warehouse.status}`,
  }));
}

export function buildCategoryOptions(store: WorkspaceStore): SearchOption[] {
  return store.categories.map((category) => ({
    value: category.id,
    label: category.categoryName,
    detail: `${category.categoryCode} · ${category.status}`,
    keywords: `${category.categoryCode} ${category.categoryName} ${category.description} ${category.status}`,
  }));
}

export function buildProductOptions(store: WorkspaceStore): SearchOption[] {
  return store.products.map((product) => {
    const category = findCategory(store, product.categoryId);

    return {
      value: product.id,
      label: product.productName,
      detail: `${product.productCode} · ${product.unit}${category ? ` · ${category.categoryName}` : ''}`,
      keywords: `${product.productCode} ${product.productName} ${product.unit} ${product.status} ${category?.categoryName ?? ''}`,
    };
  });
}

export function buildProductRows(store: WorkspaceStore): TableRow[] {
  return store.products.map((product) => {
    const category = findCategory(store, product.categoryId);
    const warehouse = findWarehouse(store, product.warehouseId);

    return {
      productCode: product.productCode,
      productName: product.productName,
      category: category?.categoryName ?? 'Unassigned',
      warehouse: warehouse?.warehouseCode ?? product.warehouseId,
      unit: product.unit,
      status: product.status,
      updatedAt: formatShortStamp(product.updatedAt),
    };
  });
}

export function buildCategoryRows(store: WorkspaceStore): TableRow[] {
  return store.categories.map((category) => ({
    categoryCode: category.categoryCode,
    categoryName: category.categoryName,
    description: category.description,
    status: category.status,
  }));
}

export function buildInboundRows(store: WorkspaceStore): TableRow[] {
  return store.inboundOrders.map((inbound) => {
    const warehouse = findWarehouse(store, inbound.warehouseId);

    return {
      inboundNo: inbound.inboundNo,
      warehouse: warehouse?.warehouseCode ?? inbound.warehouseId,
      supplier: inbound.supplierName,
      status: inbound.status,
      createdBy: inbound.createdBy,
      createdAt: formatShortStamp(inbound.createdAt),
    };
  });
}

export function buildOutboundRows(store: WorkspaceStore): TableRow[] {
  return store.outboundOrders.map((outbound) => {
    const warehouse = findWarehouse(store, outbound.warehouseId);

    return {
      outboundNo: outbound.outboundNo,
      warehouse: warehouse?.warehouseCode ?? outbound.warehouseId,
      destination: outbound.destination,
      status: outbound.status,
      createdBy: outbound.createdBy,
      createdAt: formatShortStamp(outbound.createdAt),
    };
  });
}

export function buildProductListSummary(store: WorkspaceStore): SummaryItem[] {
  const activeCount = store.products.filter((product) => product.status === 'Active').length;

  return [
    {
      label: 'Products',
      value: String(store.products.length).padStart(2, '0'),
      detail: 'Master product records currently tracked in the local workspace store.',
    },
    {
      label: 'Active',
      value: String(activeCount).padStart(2, '0'),
      detail: 'Products currently available for inbound and outbound workflows.',
    },
    {
      label: 'Categories',
      value: String(new Set(store.products.map((product) => product.categoryId)).size).padStart(2, '0'),
      detail: 'Distinct categories currently linked across the product master data.',
    },
  ];
}

export function buildCategoryListSummary(store: WorkspaceStore): SummaryItem[] {
  const activeCount = store.categories.filter((category) => category.status === 'Active').length;

  return [
    {
      label: 'Categories',
      value: String(store.categories.length).padStart(2, '0'),
      detail: 'Product category records currently managed inside the mock workspace.',
    },
    {
      label: 'Active',
      value: String(activeCount).padStart(2, '0'),
      detail: 'Categories available for immediate product assignment.',
    },
    {
      label: 'Products linked',
      value: String(store.products.length).padStart(3, '0'),
      detail: 'Total product records mapped back to category ownership.',
    },
  ];
}

export function buildInboundListSummary(store: WorkspaceStore): SummaryItem[] {
  const openReceipts = store.inboundOrders.filter((order) => order.status !== 'Confirmed').length;
  const pendingQc = store.inboundOrders.filter((order) => order.status === 'Pending QC').length;
  const activeWarehouses = new Set(store.inboundOrders.map((order) => order.warehouseId)).size;

  return [
    {
      label: 'Open receipts',
      value: String(openReceipts).padStart(2, '0'),
      detail: 'Inbound orders still waiting for final warehouse confirmation.',
    },
    {
      label: 'Pending QC',
      value: String(pendingQc).padStart(2, '0'),
      detail: 'Receipts requiring manual quantity or quality review.',
    },
    {
      label: 'Warehouses',
      value: String(activeWarehouses).padStart(2, '0'),
      detail: 'Warehouse intake points represented in the current inbound queue.',
    },
  ];
}

export function buildOutboundListSummary(store: WorkspaceStore): SummaryItem[] {
  const openShipments = store.outboundOrders.filter((order) => order.status !== 'Shipped').length;
  const awaitingShip = store.outboundOrders.filter((order) => order.status === 'Packed').length;
  const destinations = new Set(store.outboundOrders.map((order) => order.destination)).size;

  return [
    {
      label: 'Outbound today',
      value: String(openShipments).padStart(2, '0'),
      detail: 'Orders still moving through picking, packing, or shipment confirmation.',
    },
    {
      label: 'Awaiting ship',
      value: String(awaitingShip).padStart(2, '0'),
      detail: 'Orders packed and ready for dispatch confirmation.',
    },
    {
      label: 'Destinations',
      value: String(destinations).padStart(2, '0'),
      detail: 'Active destination points represented in the outbound queue.',
    },
  ];
}

export function buildProductDetailSummary(store: WorkspaceStore, selections: OperationalSelections): SummaryItem[] {
  const product = getSelectedProduct(store, selections);
  const category = product ? findCategory(store, product.categoryId) : undefined;

  return [
    {
      label: 'Product code',
      value: product?.productCode ?? '--',
      detail: 'Selected product record currently active in the master data flow.',
    },
    {
      label: 'Category',
      value: category?.categoryName ?? '--',
      detail: 'Category mapping is visible directly alongside the product fields.',
    },
    {
      label: 'Status',
      value: product?.status ?? '--',
      detail: 'The selected product state updates immediately after local saves.',
    },
  ];
}

export function buildCategoryDetailSummary(store: WorkspaceStore, selections: OperationalSelections): SummaryItem[] {
  const category = getSelectedCategory(store, selections);

  return [
    {
      label: 'Category code',
      value: category?.categoryCode ?? '--',
      detail: 'Selected category record currently active in the product management flow.',
    },
    {
      label: 'Category name',
      value: category?.categoryName ?? '--',
      detail: 'The category name stays visible while linked products are maintained.',
    },
    {
      label: 'Status',
      value: category?.status ?? '--',
      detail: 'The selected category state updates immediately after local saves.',
    },
  ];
}

export function buildInboundDetailSummary(store: WorkspaceStore, selections: OperationalSelections): SummaryItem[] {
  const inbound = getSelectedInbound(store, selections);

  return [
    {
      label: 'Inbound no.',
      value: inbound?.inboundNo ?? '--',
      detail: 'Selected inbound order currently active in the receiving flow.',
    },
    {
      label: 'Status',
      value: inbound?.status ?? '--',
      detail: 'Receipt status changes immediately when the order is saved or confirmed.',
    },
    {
      label: 'Supplier',
      value: inbound?.supplierName ?? '--',
      detail: 'Supplier context is kept close to the header fields for fast review.',
    },
  ];
}

export function buildOutboundDetailSummary(store: WorkspaceStore, selections: OperationalSelections): SummaryItem[] {
  const outbound = getSelectedOutbound(store, selections);

  return [
    {
      label: 'Outbound no.',
      value: outbound?.outboundNo ?? '--',
      detail: 'Selected outbound order currently active in the shipping flow.',
    },
    {
      label: 'Destination',
      value: outbound?.destination ?? '--',
      detail: 'Destination context stays visible while shipping details are updated.',
    },
    {
      label: 'Status',
      value: outbound?.status ?? '--',
      detail: 'Shipment status changes immediately when the order is saved or confirmed.',
    },
  ];
}

function buildDetailLineItems(lineItems: OrderLineItem[], store: WorkspaceStore): DetailLineItem[] {
  return lineItems.map((lineItem) => {
    const product = findProduct(store, lineItem.productId);

    return {
      id: lineItem.id,
      productName: product?.productName ?? 'Unassigned product',
      productCode: product?.productCode ?? '--',
      quantity: lineItem.quantity || '--',
      unit: product?.unit ?? '--',
      notes: lineItem.notes || '--',
    };
  });
}

export function buildProductDetailSection(store: WorkspaceStore, selections: OperationalSelections): DetailSection {
  const product = getSelectedProduct(store, selections);
  const category = product ? findCategory(store, product.categoryId) : undefined;
  const warehouse = product ? findWarehouse(store, product.warehouseId) : undefined;

  return {
    groups: product
      ? [
          {
            title: 'Basic Information',
            fields: [
              { label: 'Product Code', value: product.productCode },
              { label: 'Product Name', value: product.productName },
              { label: 'Status', value: product.status },
              { label: 'Unit', value: product.unit },
            ],
          },
          {
            title: 'Linked Context',
            fields: [
              { label: 'Category', value: category?.categoryName ?? 'Unassigned' },
              { label: 'Warehouse', value: warehouse?.warehouseName ?? 'Unassigned' },
              { label: 'Created At', value: formatLongDate(product.createdAt) },
              { label: 'Updated At', value: formatLongDate(product.updatedAt) },
            ],
          },
        ]
      : [],
    notes: product?.notes,
    notesLabel: 'Product Notes',
  };
}

export function buildCategoryDetailSection(store: WorkspaceStore, selections: OperationalSelections): DetailSection {
  const category = getSelectedCategory(store, selections);
  const linkedProducts = store.products.filter((product) => product.categoryId === category?.id);

  return {
    groups: category
      ? [
          {
            title: 'Basic Information',
            fields: [
              { label: 'Category Code', value: category.categoryCode },
              { label: 'Category Name', value: category.categoryName },
              { label: 'Status', value: category.status },
            ],
          },
          {
            title: 'Linked Context',
            fields: [
              { label: 'Products Linked', value: String(linkedProducts.length) },
              { label: 'Last Updated By', value: category.updatedBy },
              { label: 'Updated At', value: formatLongDate(category.updatedAt) },
            ],
          },
        ]
      : [],
    notes: category?.notes,
    notesLabel: 'Category Notes',
  };
}

export function buildInboundDetailSection(store: WorkspaceStore, selections: OperationalSelections): DetailSection {
  const inbound = getSelectedInbound(store, selections);
  const warehouse = inbound ? findWarehouse(store, inbound.warehouseId) : undefined;

  return {
    groups: inbound
      ? [
          {
            title: 'Basic Information',
            fields: [
              { label: 'Inbound No.', value: inbound.inboundNo },
              { label: 'Warehouse', value: warehouse?.warehouseName ?? inbound.warehouseId },
              { label: 'Supplier', value: inbound.supplierName },
              { label: 'Status', value: inbound.status },
            ],
          },
          {
            title: 'Receipt Details',
            fields: [
              { label: 'Reference No.', value: inbound.referenceNo || '--' },
              { label: 'Planned Date', value: inbound.plannedDate },
              { label: 'Created By', value: inbound.createdBy },
              { label: 'Confirmed At', value: inbound.confirmedAt ? formatLongDate(inbound.confirmedAt) : 'Pending' },
            ],
          },
        ]
      : [],
    lineItems: inbound ? buildDetailLineItems(inbound.lineItems, store) : [],
    notes: inbound?.notes,
    notesLabel: 'Inbound Notes',
  };
}

export function buildOutboundDetailSection(store: WorkspaceStore, selections: OperationalSelections): DetailSection {
  const outbound = getSelectedOutbound(store, selections);
  const warehouse = outbound ? findWarehouse(store, outbound.warehouseId) : undefined;

  return {
    groups: outbound
      ? [
          {
            title: 'Basic Information',
            fields: [
              { label: 'Outbound No.', value: outbound.outboundNo },
              { label: 'Warehouse', value: warehouse?.warehouseName ?? outbound.warehouseId },
              { label: 'Destination', value: outbound.destination },
              { label: 'Status', value: outbound.status },
            ],
          },
          {
            title: 'Shipment Details',
            fields: [
              { label: 'Carrier', value: outbound.carrier || '--' },
              { label: 'Shipment Date', value: outbound.shipmentDate },
              { label: 'Created By', value: outbound.createdBy },
              { label: 'Confirmed At', value: outbound.confirmedAt ? formatLongDate(outbound.confirmedAt) : 'Pending' },
            ],
          },
        ]
      : [],
    lineItems: outbound ? buildDetailLineItems(outbound.lineItems, store) : [],
    notes: outbound?.notes,
    notesLabel: 'Outbound Notes',
  };
}

export function createProductDraft(): ProductFormData {
  return {
    productCode: '',
    productName: '',
    categoryId: '',
    warehouseId: '',
    unit: '',
    status: 'Draft',
    notes: '',
  };
}

export function createCategoryDraft(): CategoryFormData {
  return {
    categoryCode: '',
    categoryName: '',
    description: '',
    status: 'Draft',
    notes: '',
  };
}

export function createInboundDraft(): InboundFormData {
  return {
    inboundNo: '',
    warehouseId: '',
    supplierName: '',
    referenceNo: '',
    plannedDate: todayInputValue(),
    status: 'Draft',
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
    status: 'Draft',
    notes: '',
    lineItems: [createEmptyLineItem()],
  };
}

export function mapProductToFormData(product: ProductRecord): ProductFormData {
  return {
    productCode: product.productCode,
    productName: product.productName,
    categoryId: product.categoryId,
    warehouseId: product.warehouseId,
    unit: product.unit,
    status: product.status,
    notes: product.notes,
  };
}

export function mapCategoryToFormData(category: CategoryRecord): CategoryFormData {
  return {
    categoryCode: category.categoryCode,
    categoryName: category.categoryName,
    description: category.description,
    status: category.status,
    notes: category.notes,
  };
}

export function mapInboundToFormData(inbound: InboundRecord): InboundFormData {
  return {
    inboundNo: inbound.inboundNo,
    warehouseId: inbound.warehouseId,
    supplierName: inbound.supplierName,
    referenceNo: inbound.referenceNo,
    plannedDate: inbound.plannedDate,
    status: inbound.status,
    notes: inbound.notes,
    lineItems: inbound.lineItems.map((lineItem) => ({ ...lineItem })),
  };
}

export function mapOutboundToFormData(outbound: OutboundRecord): OutboundFormData {
  return {
    outboundNo: outbound.outboundNo,
    warehouseId: outbound.warehouseId,
    destination: outbound.destination,
    carrier: outbound.carrier,
    shipmentDate: outbound.shipmentDate,
    status: outbound.status,
    notes: outbound.notes,
    lineItems: outbound.lineItems.map((lineItem) => ({ ...lineItem })),
  };
}

export function createInboundNumber(store: WorkspaceStore) {
  return `INB-${String(1045 + store.inboundOrders.length + 1).padStart(4, '0')}`;
}

export function createOutboundNumber(store: WorkspaceStore) {
  return `OUT-${String(2024 + store.outboundOrders.length + 1).padStart(4, '0')}`;
}

export function buildSelectionOptions(store: WorkspaceStore, module: OperationalModuleKey): SearchOption[] {
  if (module === 'product') {
    return buildProductOptions(store);
  }

  if (module === 'category') {
    return buildCategoryOptions(store);
  }

  if (module === 'inbound') {
    return store.inboundOrders.map((item) => ({
      value: item.id,
      label: item.inboundNo,
      detail: `${item.supplierName} · ${item.status}`,
      keywords: `${item.inboundNo} ${item.supplierName} ${item.status} ${item.referenceNo}`,
    }));
  }

  return store.outboundOrders.map((item) => ({
    value: item.id,
    label: item.outboundNo,
    detail: `${item.destination} · ${item.status}`,
    keywords: `${item.outboundNo} ${item.destination} ${item.status} ${item.carrier}`,
  }));
}

export function buildFormSummaryDetail(store: WorkspaceStore, module: OperationalModuleKey) {
  if (module === 'product') {
    return `${store.categories.length} categories · ${store.warehouses.length} warehouses ready for linking`;
  }

  if (module === 'category') {
    return `${store.products.length} products can inherit this category once saved`;
  }

  if (module === 'inbound') {
    return `${store.products.length} products available for receipt lines`;
  }

  return `${store.products.length} products available for shipment lines`;
}

export function countLineItems(lineItems: OrderLineItem[]) {
  return lineItems.reduce((total, lineItem) => total + (lineItem.productId ? 1 : 0), 0);
}

export function buildPreviewFields(store: WorkspaceStore, lineItem: OrderLineItem) {
  const product = findProduct(store, lineItem.productId);

  return {
    productCode: product?.productCode ?? '',
    unit: product?.unit ?? '',
    productName: product?.productName ?? '',
  };
}

export function sanitizeCode(value: string) {
  return compactToken(value);
}
