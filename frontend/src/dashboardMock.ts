export const DASHBOARD_REFRESH_INTERVAL_MS = 15_000;

export type DashboardMetricKey =
  | 'totalInventoryQuantity'
  | 'todayInboundQuantity'
  | 'todayOutboundQuantity'
  | 'warehouseSpaceUtilizationRate';

export type DashboardMetricTone = 'inventory' | 'inbound' | 'outbound' | 'capacity';

export type DashboardMetricFormat = 'integer' | 'percent';

export type DashboardMetricCard = {
  key: DashboardMetricKey;
  label: string;
  tone: DashboardMetricTone;
  format: DashboardMetricFormat;
};

export type DashboardMetricValue = {
  value: number;
  comparison: string;
  helper: string;
  trendTone: 'positive' | 'caution' | 'neutral';
};

export type WarehouseTrendPoint = {
  label: string;
  isoDate: string;
  inbound: number;
  outbound: number;
};

export type InventoryCategoryShare = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type InventoryWarning = {
  id: string;
  sku: string;
  productName: string;
  category: string;
  region: string;
  country: string;
  warehouse: string;
  location: string;
  onHand: number;
  threshold: number;
  severity: 'critical' | 'warning';
  recommendedAction: string;
};

export type WarehouseDashboardSnapshot = {
  generatedAt: string;
  refreshIntervalMs: number;
  feedLabel: string;
  coverageLabel: string;
  metrics: Record<DashboardMetricKey, DashboardMetricValue>;
  trend: WarehouseTrendPoint[];
  categoryShare: InventoryCategoryShare[];
  warnings: InventoryWarning[];
};

export const dashboardMetricCards: DashboardMetricCard[] = [
  {
    key: 'totalInventoryQuantity',
    label: 'Total Inventory Quantity',
    tone: 'inventory',
    format: 'integer',
  },
  {
    key: 'todayInboundQuantity',
    label: 'Today Inbound Quantity',
    tone: 'inbound',
    format: 'integer',
  },
  {
    key: 'todayOutboundQuantity',
    label: 'Today Outbound Quantity',
    tone: 'outbound',
    format: 'integer',
  },
  {
    key: 'warehouseSpaceUtilizationRate',
    label: 'Warehouse Space Utilization Rate',
    tone: 'capacity',
    format: 'percent',
  },
];

export const dashboardHeroMeta = [
  {
    label: 'Coverage',
    value: '7 sites across 4 countries',
    detail: 'China, Germany, UAE, United States',
  },
  {
    label: 'Refresh',
    value: 'Mock polling active',
    detail: 'Auto refresh every 15 seconds',
  },
] as const;

const baseTrendSeries = [
  { inbound: 1180, outbound: 910 },
  { inbound: 1245, outbound: 965 },
  { inbound: 1290, outbound: 1015 },
  { inbound: 1210, outbound: 990 },
  { inbound: 1360, outbound: 1105 },
  { inbound: 1415, outbound: 1140 },
  { inbound: 1335, outbound: 1080 },
];

const inboundDrift = [0, 22, -14, 28, 16, -10, 18];
const outboundDrift = [0, -12, 18, -20, 14, 10, -8];
const utilizationDrift = [0, 0.4, -0.2, 0.7, 0.1, -0.3];
const utilizationBaseline = 81.6;
const totalInventoryBaseline = 128_760;

const categoryTemplates = [
  {
    id: 'fasteners',
    label: 'Fasteners',
    value: 41_800,
    color: '#67e1b9',
  },
  {
    id: 'electrical',
    label: 'Electrical Components',
    value: 26_400,
    color: '#8fb8ff',
  },
  {
    id: 'sealing',
    label: 'Sealing Components',
    value: 18_920,
    color: '#f3b35c',
  },
  {
    id: 'packaging',
    label: 'Packaging Materials',
    value: 16_340,
    color: '#63d2ff',
  },
  {
    id: 'safety',
    label: 'Safety & MRO',
    value: 12_600,
    color: '#ff7e6b',
  },
  {
    id: 'structural',
    label: 'Structural Assemblies',
    value: 12_700,
    color: '#b5a3ff',
  },
];

const categoryDriftMap = {
  fasteners: [0, 180, -120, 210, 90, -70],
  electrical: [0, -60, 140, -40, 120, -50],
  sealing: [0, 45, -25, 60, -35, 20],
  packaging: [0, -30, 55, -20, 40, -15],
  safety: [0, 22, -18, 26, -12, 14],
} satisfies Record<string, number[]>;

const warningTemplates = [
  {
    id: 'warn-nut-b',
    sku: 'P-NUT-B',
    productName: 'Nut Pack B',
    category: 'Fasteners',
    region: 'East China',
    country: 'China',
    warehouse: 'SH-01 Shanghai Primary',
    location: 'B2-12',
    onHand: 52,
    threshold: 60,
    recommendedAction: 'Move 24 units from Ningbo reserve stock before 16:00 CST.',
  },
  {
    id: 'warn-clamp-d',
    sku: 'P-CLAMP-D',
    productName: 'Clamp Set D',
    category: 'Structural Assemblies',
    region: 'East China',
    country: 'China',
    warehouse: 'SZ-03 Suzhou Secondary',
    location: 'C3-01',
    onHand: 16,
    threshold: 20,
    recommendedAction: 'Prioritize supplier receipt already staged at Dock 04.',
  },
  {
    id: 'warn-brkt-f',
    sku: 'P-BRKT-F',
    productName: 'Bracket Frame F',
    category: 'Structural Assemblies',
    region: 'Europe',
    country: 'Germany',
    warehouse: 'HAM-01 Hamburg Gateway',
    location: 'A4-08',
    onHand: 43,
    threshold: 46,
    recommendedAction: 'Hold outbound allocation until the cycle count closes for the export lane.',
  },
  {
    id: 'warn-seal-k',
    sku: 'P-SEAL-K',
    productName: 'Seal Kit K',
    category: 'Sealing Components',
    region: 'Middle East',
    country: 'UAE',
    warehouse: 'DXB-02 Dubai Free Zone',
    location: 'D1-05',
    onHand: 24,
    threshold: 28,
    recommendedAction: 'Trigger replenishment from the bonded reserve rack before evening dispatch.',
  },
  {
    id: 'warn-rivet-q',
    sku: 'P-RIVET-Q',
    productName: 'Rivet Kit Q',
    category: 'Fasteners',
    region: 'North America',
    country: 'United States',
    warehouse: 'CHI-01 Chicago Central',
    location: 'F2-03',
    onHand: 19,
    threshold: 22,
    recommendedAction: 'Watch the next wave release after the 14:30 local carrier cutoff.',
  },
  {
    id: 'warn-harn-m',
    sku: 'P-HARN-M',
    productName: 'Harness Module M',
    category: 'Electrical Components',
    region: 'North America',
    country: 'United States',
    warehouse: 'LAX-02 Los Angeles West',
    location: 'E1-11',
    onHand: 31,
    threshold: 36,
    recommendedAction: 'Rebalance stock from Chicago after the airfreight receipt is confirmed.',
  },
];

const warningDriftMap = {
  'warn-nut-b': [0, -3, -5, -2, -4, -1],
  'warn-clamp-d': [0, -1, -2, -3, -1, -2],
  'warn-brkt-f': [0, -2, -1, -3, -2, -1],
  'warn-seal-k': [0, -2, -3, -1, -4, -2],
  'warn-rivet-q': [0, -2, -1, -3, -2, -1],
  'warn-harn-m': [0, -1, -2, -1, -3, -2],
} satisfies Record<string, number[]>;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatTrendLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatSignedNumber(value: number, fractionDigits = 0) {
  const roundedValue = Number(value.toFixed(fractionDigits));
  const prefix = roundedValue > 0 ? '+' : '';
  return `${prefix}${roundedValue.toFixed(fractionDigits)}`;
}

function createTrend(referenceTime: Date, cycle: number) {
  const startDate = addDays(referenceTime, -6);

  return baseTrendSeries.map((basePoint, index) => {
    const day = addDays(startDate, index);
    const inbound = basePoint.inbound + inboundDrift[(cycle + index) % inboundDrift.length];
    const outbound = basePoint.outbound + outboundDrift[(cycle + index * 2) % outboundDrift.length];

    return {
      label: formatTrendLabel(day),
      isoDate: day.toISOString(),
      inbound,
      outbound,
    };
  });
}

function createCategoryShare(cycle: number): InventoryCategoryShare[] {
  const cycleIndex = cycle % 6;
  const targetTotalDrift = [0, 148, -92, 212, 74, -56][cycleIndex];
  let runningDrift = 0;

  const categoryShare = categoryTemplates.map((template) => {
    if (template.id === 'structural') {
      return {
        ...template,
        value: template.value,
      };
    }

    const driftPattern = categoryDriftMap[template.id as keyof typeof categoryDriftMap];
    const drift = driftPattern[cycleIndex];
    runningDrift += drift;

    return {
      ...template,
      value: template.value + drift,
    };
  });

  const structuralCategoryIndex = categoryShare.findIndex((category) => category.id === 'structural');

  if (structuralCategoryIndex >= 0) {
    const structuralBase = categoryTemplates[structuralCategoryIndex];
    categoryShare[structuralCategoryIndex] = {
      ...categoryShare[structuralCategoryIndex],
      value: structuralBase.value + (targetTotalDrift - runningDrift),
    };
  }

  return categoryShare;
}

function createWarnings(cycle: number) {
  return warningTemplates
    .map((warningTemplate) => {
      const driftPattern = warningDriftMap[warningTemplate.id as keyof typeof warningDriftMap];
      const drift = driftPattern[cycle % driftPattern.length];
      const onHand = Math.max(0, warningTemplate.onHand + drift);
      const severity = onHand <= warningTemplate.threshold * 0.82 ? 'critical' : 'warning';

      return {
        ...warningTemplate,
        onHand,
        severity,
      } satisfies InventoryWarning;
    })
    .filter((warning) => warning.onHand <= warning.threshold)
    .sort((left, right) => {
      if (left.severity === right.severity) {
        return left.onHand - right.onHand;
      }

      return left.severity === 'critical' ? -1 : 1;
    });
}

export function getDashboardMockSnapshot(cycle: number, referenceTime = new Date()): WarehouseDashboardSnapshot {
  const trend = createTrend(referenceTime, cycle);
  const categoryShare = createCategoryShare(cycle);
  const warnings = createWarnings(cycle);
  const totalInventoryQuantity = categoryShare.reduce((sum, category) => sum + category.value, 0);
  const todayInboundQuantity = trend[trend.length - 1]?.inbound ?? 0;
  const yesterdayInboundQuantity = trend[trend.length - 2]?.inbound ?? todayInboundQuantity;
  const todayOutboundQuantity = trend[trend.length - 1]?.outbound ?? 0;
  const yesterdayOutboundQuantity = trend[trend.length - 2]?.outbound ?? todayOutboundQuantity;
  const warehouseSpaceUtilizationRate = Number((utilizationBaseline + utilizationDrift[cycle % utilizationDrift.length]).toFixed(1));

  return {
    generatedAt: referenceTime.toISOString(),
    refreshIntervalMs: DASHBOARD_REFRESH_INTERVAL_MS,
    feedLabel: 'Mock warehouse operations feed',
    coverageLabel: 'Northline network · China / Germany / UAE / United States',
    metrics: {
      totalInventoryQuantity: {
        value: totalInventoryQuantity,
        comparison: `${formatSignedNumber(totalInventoryQuantity - totalInventoryBaseline)} vs baseline`,
        helper: 'On-hand quantity across all active warehouse sites.',
        trendTone: 'neutral',
      },
      todayInboundQuantity: {
        value: todayInboundQuantity,
        comparison: `${formatSignedNumber(todayInboundQuantity - yesterdayInboundQuantity)} vs yesterday`,
        helper: 'Confirmed receipts posted into storage today.',
        trendTone: 'positive',
      },
      todayOutboundQuantity: {
        value: todayOutboundQuantity,
        comparison: `${formatSignedNumber(todayOutboundQuantity - yesterdayOutboundQuantity)} vs yesterday`,
        helper: 'Units released from picking, packing, and dispatch today.',
        trendTone: 'positive',
      },
      warehouseSpaceUtilizationRate: {
        value: warehouseSpaceUtilizationRate,
        comparison: `${formatSignedNumber(warehouseSpaceUtilizationRate - utilizationBaseline, 1)} pts vs baseline`,
        helper: 'Current occupied storage capacity across the multi-site network.',
        trendTone: warehouseSpaceUtilizationRate >= 82 ? 'caution' : 'neutral',
      },
    },
    trend,
    categoryShare,
    warnings,
  };
}
