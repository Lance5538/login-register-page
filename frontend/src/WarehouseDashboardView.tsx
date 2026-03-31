import { Suspense, lazy, startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthLocale, DashboardPage, Route } from './content';
import { getLocaleTag } from './content';
import { DASHBOARD_REFRESH_INTERVAL_MS, dashboardMetricCards, type InventoryCategoryShare, type InventoryWarning, type WarehouseTrendPoint } from './dashboardMock';
import { buildApprovalQueue, buildDashboardSnapshot, countOrderUnits, formatShortStamp, type WorkspaceStore } from './operations';

const WarehouseTrendChart = lazy(() => import('./WarehouseTrendChart'));
const WarehouseCategoryChart = lazy(() => import('./WarehouseCategoryChart'));

type WarehouseDashboardViewProps = {
  page: DashboardPage;
  store: WorkspaceStore;
  locale: AuthLocale;
  onNavigate: (route: Route) => void;
  canReviewApprovals: boolean;
};

function formatMetricValue(locale: AuthLocale, format: 'integer' | 'percent', value: number) {
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }

  return new Intl.NumberFormat(getLocaleTag(locale)).format(value);
}

function formatDateTime(value: string, locale: AuthLocale) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatInteger(value: number, locale: AuthLocale) {
  return new Intl.NumberFormat(getLocaleTag(locale)).format(value);
}

function getTrendSummary(trend: WarehouseTrendPoint[]) {
  const totalInbound = trend.reduce((sum, point) => sum + point.inbound, 0);
  const totalOutbound = trend.reduce((sum, point) => sum + point.outbound, 0);

  return {
    totalInbound,
    totalOutbound,
    netFlow: totalInbound - totalOutbound,
  };
}

function getWarningToneClass(warning: InventoryWarning) {
  return warning.severity === 'critical' ? 'status-chip--danger' : 'status-chip--warning';
}

function getCategorySharePercentage(category: InventoryCategoryShare, total: number) {
  if (total === 0) {
    return '0.0%';
  }

  return `${((category.value / total) * 100).toFixed(1)}%`;
}

function isSameDay(left: string, right: string) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return leftDate.getFullYear() === rightDate.getFullYear() && leftDate.getMonth() === rightDate.getMonth() && leftDate.getDate() === rightDate.getDate();
}

function ChartLoadingState({ compact = false }: { compact?: boolean }) {
  return <div className={`dashboard-chart-placeholder ${compact ? 'dashboard-chart-placeholder--compact' : ''}`} aria-hidden="true" />;
}

function getMetricLabel(locale: AuthLocale, key: keyof typeof dashboardMetricLabels.en) {
  return dashboardMetricLabels[locale][key];
}

function getMetricComparison(locale: AuthLocale, key: keyof typeof dashboardMetricLabels.en, metricValue: number, previousValue: number, warningCount: number) {
  if (key === 'totalInventoryQuantity') {
    return locale === 'zh' ? `${warningCount} 条预警记录` : `${warningCount} warning records`;
  }

  if (key === 'warehouseSpaceUtilizationRate') {
    return locale === 'zh' ? `${warningCount} 条库存预警` : `${warningCount} inventory warnings`;
  }

  const delta = metricValue - previousValue;
  return locale === 'zh' ? `${delta >= 0 ? '+' : ''}${delta} 较前一日` : `${delta >= 0 ? '+' : ''}${delta} vs previous day`;
}

function getMetricHelper(locale: AuthLocale, key: keyof typeof dashboardMetricLabels.en) {
  return dashboardMetricHelpers[locale][key];
}

const dashboardMetricLabels = {
  en: {
    totalInventoryQuantity: 'Total Inventory Quantity',
    todayInboundQuantity: 'Today Inbound Quantity',
    todayOutboundQuantity: 'Today Outbound Quantity',
    warehouseSpaceUtilizationRate: 'Warehouse Space Utilization Rate',
  },
  zh: {
    totalInventoryQuantity: '库存总量',
    todayInboundQuantity: '今日入库量',
    todayOutboundQuantity: '今日出库量',
    warehouseSpaceUtilizationRate: '仓库空间利用率',
  },
} as const;

const dashboardMetricHelpers = {
  en: {
    totalInventoryQuantity: 'Current on-hand quantity after approved receipts and shipments.',
    todayInboundQuantity: 'Approved inbound quantity posted today.',
    todayOutboundQuantity: 'Approved outbound quantity deducted today.',
    warehouseSpaceUtilizationRate: 'Utilization is derived from total on-hand quantity versus site capacity.',
  },
  zh: {
    totalInventoryQuantity: '基于已审批入库与出库后的当前在库数量。',
    todayInboundQuantity: '今日已审批并入账的入库数量。',
    todayOutboundQuantity: '今日已审批并扣减的出库数量。',
    warehouseSpaceUtilizationRate: '基于当前库存总量与仓容上限计算。',
  },
} as const;

const dashboardText = {
  en: {
    kpiAria: 'Warehouse KPI cards',
    trendKicker: 'Trend',
    trendTitle: 'Inbound and outbound movement',
    lastChecked: 'Last checked',
    refresh: 'Refresh',
    dayInbound: '7-day inbound',
    dayOutbound: '7-day outbound',
    netFlow: 'Net flow',
    lastStockSync: 'Last stock sync',
    categoryKicker: 'Category share',
    categoryTitle: 'Stock composition',
    categoryDetails: 'Category share details',
    units: 'units',
    approvalsKicker: 'Approvals',
    approvalsTitle: 'Queue snapshot',
    pendingApproval: 'Pending approval',
    pendingApprovalDetail: 'Orders waiting to post inventory movement.',
    approvedQueue: 'Approved queue',
    approvedQueueDetail: 'Orders already posted into stock movement.',
    approvedUnits: 'Approved units',
    approvedUnitsDetail: 'Approved receipt and shipment units across the mock workspace.',
    noPendingApprovals: 'No pending approvals right now.',
    recentApprovals: 'Recent approvals were synced into inventory in the current session.',
    warningsKicker: 'Warnings',
    warningsTitle: 'Inventory watchlist',
    critical: 'critical',
    total: 'total',
    severity: 'Severity',
    sku: 'SKU',
    warehouse: 'Warehouse',
    country: 'Country',
    onHand: 'On Hand',
    threshold: 'Threshold',
    action: 'Action',
  },
  zh: {
    kpiAria: '仓储 KPI 卡片',
    trendKicker: '趋势',
    trendTitle: '入库与出库趋势',
    lastChecked: '最近检查',
    refresh: '刷新',
    dayInbound: '7日入库',
    dayOutbound: '7日出库',
    netFlow: '净流量',
    lastStockSync: '库存最近同步',
    categoryKicker: '分类占比',
    categoryTitle: '库存构成',
    categoryDetails: '分类占比明细',
    units: '件',
    approvalsKicker: '审批',
    approvalsTitle: '审批概览',
    pendingApproval: '待审批',
    pendingApprovalDetail: '等待过账库存变动的订单。',
    approvedQueue: '已通过队列',
    approvedQueueDetail: '已经写入库存流转的订单。',
    approvedUnits: '已通过数量',
    approvedUnitsDetail: '当前 mock 工作区中已通过的收货与发货数量。',
    noPendingApprovals: '当前没有待审批记录。',
    recentApprovals: '本次会话中的最近审批已同步到库存。',
    warningsKicker: '预警',
    warningsTitle: '库存预警列表',
    critical: '严重',
    total: '总计',
    severity: '严重程度',
    sku: 'SKU',
    warehouse: '仓库',
    country: '国家',
    onHand: '现有库存',
    threshold: '阈值',
    action: '建议动作',
  },
} as const;

export default function WarehouseDashboardView({ page, store, locale, onNavigate, canReviewApprovals }: WarehouseDashboardViewProps) {
  const [checkedAt, setCheckedAt] = useState(() => new Date());
  const text = dashboardText[locale];

  const refreshSnapshot = useCallback(() => {
    startTransition(() => {
      setCheckedAt(new Date());
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshSnapshot();
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [refreshSnapshot]);

  const snapshot = useMemo(() => buildDashboardSnapshot(store, checkedAt), [store, checkedAt]);
  const trendSummary = getTrendSummary(snapshot.trend);
  const categoryShareTotal = snapshot.categoryShare.reduce((sum, category) => sum + category.value, 0);
  const approvalQueue = useMemo(() => buildApprovalQueue(store), [store]);
  const pendingApprovals = approvalQueue.filter((item) => item.approvalStatus === 'Pending Approval');
  const approvedToday = approvalQueue.filter(
    (item) => item.approvalStatus === 'Approved' && item.approvalUpdatedAt && isSameDay(item.approvalUpdatedAt, store.lastSync),
  );
  const warningPreview = snapshot.warnings.slice(0, 6);
  const previousTrendPoint = snapshot.trend[snapshot.trend.length - 2] ?? snapshot.trend[0];

  return (
    <div className="ops-dashboard">
      <section className="ops-dashboard__kpis" aria-label={text.kpiAria}>
        {dashboardMetricCards.map((card) => {
          const metric = snapshot.metrics[card.key];
          const previousValue =
            card.key === 'todayInboundQuantity'
              ? previousTrendPoint.inbound
              : card.key === 'todayOutboundQuantity'
                ? previousTrendPoint.outbound
                : metric.value;

          return (
            <article className="admin-kpi-card" key={card.key}>
              <div className="admin-kpi-card__header">
                <span className="admin-kpi-card__label">{getMetricLabel(locale, card.key)}</span>
                <span className={`status-chip status-chip--${metric.trendTone}`}>
                  {getMetricComparison(locale, card.key, metric.value, previousValue, snapshot.warnings.length)}
                </span>
              </div>

              <strong className="admin-kpi-card__value">{formatMetricValue(locale, card.format, metric.value)}</strong>
              <p className="admin-kpi-card__detail">{getMetricHelper(locale, card.key)}</p>
            </article>
          );
        })}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.trendKicker}</p>
            <h2>{text.trendTitle}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <div className="admin-sync-indicator">
              <span>{text.lastChecked}</span>
              <strong>{formatDateTime(checkedAt.toISOString(), locale)}</strong>
            </div>

            <button className="secondary-button" type="button" onClick={refreshSnapshot}>
              {text.refresh}
            </button>
          </div>
        </div>

        <Suspense fallback={<ChartLoadingState />}>
          <WarehouseTrendChart data={snapshot.trend} locale={locale} />
        </Suspense>

        <div className="admin-mini-grid">
          <article className="admin-mini-card">
            <span>{text.dayInbound}</span>
            <strong>{formatInteger(trendSummary.totalInbound, locale)}</strong>
          </article>

          <article className="admin-mini-card">
            <span>{text.dayOutbound}</span>
            <strong>{formatInteger(trendSummary.totalOutbound, locale)}</strong>
          </article>

          <article className="admin-mini-card">
            <span>{text.netFlow}</span>
            <strong>{trendSummary.netFlow >= 0 ? '+' : ''}{formatInteger(trendSummary.netFlow, locale)}</strong>
          </article>

          <article className="admin-mini-card">
            <span>{text.lastStockSync}</span>
            <strong>{formatShortStamp(store.lastSync, getLocaleTag(locale))}</strong>
          </article>
        </div>

        <div className="admin-toolbar__actions">
          {page.actions.map((action) => (
            <button
              key={action.label}
              className={action.tone === 'primary' ? 'primary-button' : 'secondary-button'}
              type="button"
              onClick={() => onNavigate(action.route)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-secondary-grid">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="section-kicker">{text.categoryKicker}</p>
              <h2>{text.categoryTitle}</h2>
            </div>
          </div>

          <div className="dashboard-share-layout">
            <Suspense fallback={<ChartLoadingState compact />}>
              <WarehouseCategoryChart data={snapshot.categoryShare} locale={locale} />
            </Suspense>

            <div className="compact-legend-list" aria-label={text.categoryDetails}>
              {snapshot.categoryShare.map((category) => (
                <article className="compact-legend-row" key={category.id}>
                  <div className="compact-legend-row__label">
                    <span className="compact-legend-row__swatch" aria-hidden="true" style={{ backgroundColor: category.color }} />
                    <strong>{category.label}</strong>
                  </div>
                  <span>{getCategorySharePercentage(category, categoryShareTotal)}</span>
                  <span>{formatInteger(category.value, locale)} {text.units}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {canReviewApprovals ? (
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <p className="section-kicker">{text.approvalsKicker}</p>
                <h2>{text.approvalsTitle}</h2>
              </div>
            </div>

            <div className="approval-summary">
              <article className="approval-summary__card">
                <span>{text.pendingApproval}</span>
                <strong>{pendingApprovals.length}</strong>
                <p>{text.pendingApprovalDetail}</p>
              </article>

              <article className="approval-summary__card">
                <span>{text.approvedQueue}</span>
                <strong>{approvalQueue.filter((item) => item.approvalStatus === 'Approved').length}</strong>
                <p>{text.approvedQueueDetail}</p>
              </article>

              <article className="approval-summary__card">
                <span>{text.approvedUnits}</span>
                <strong>
                  {formatInteger(
                    store.inboundOrders
                      .filter((item) => item.approvalStatus === 'Approved')
                      .reduce((sum, item) => sum + countOrderUnits(item.lineItems), 0) +
                      store.outboundOrders
                        .filter((item) => item.approvalStatus === 'Approved')
                        .reduce((sum, item) => sum + countOrderUnits(item.lineItems), 0),
                    locale,
                  )}
                </strong>
                <p>{text.approvedUnitsDetail}</p>
              </article>
            </div>

            <div className="approval-feed">
              {pendingApprovals.slice(0, 4).map((item) => (
                <article className="approval-feed__row" key={item.key}>
                  <div>
                    <strong>{item.orderNo}</strong>
                    <p>{locale === 'zh' ? (item.module === 'Inbound' ? '入库' : '出库') : item.module} · {item.partner}</p>
                  </div>
                  <span className="status-chip status-chip--warning">{text.pendingApproval}</span>
                </article>
              ))}

              {pendingApprovals.length === 0 ? <p className="empty-note">{text.noPendingApprovals}</p> : null}
            </div>

            {approvedToday.length > 0 ? <div className="admin-inline-note">{text.recentApprovals}</div> : null}
          </section>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.warningsKicker}</p>
            <h2>{text.warningsTitle}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <span className="status-chip status-chip--danger">
              {snapshot.warnings.filter((warning) => warning.severity === 'critical').length} {text.critical}
            </span>
            <span className="status-chip status-chip--warning">{snapshot.warnings.length} {text.total}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{text.severity}</th>
                <th>{text.sku}</th>
                <th>{text.warehouse}</th>
                <th>{text.country}</th>
                <th>{text.onHand}</th>
                <th>{text.threshold}</th>
                <th>{text.action}</th>
              </tr>
            </thead>
            <tbody>
              {warningPreview.map((warning) => (
                <tr key={warning.id}>
                  <td>
                    <span className={`status-chip ${getWarningToneClass(warning)}`}>
                      {warning.severity === 'critical' ? text.critical : locale === 'zh' ? '预警' : 'warning'}
                    </span>
                  </td>
                  <td>
                    <div className="table-primary">
                      <strong>{warning.sku}</strong>
                      <span>{warning.productName}</span>
                    </div>
                  </td>
                  <td>{warning.warehouse}</td>
                  <td>{warning.country}</td>
                  <td>{formatInteger(warning.onHand, locale)}</td>
                  <td>{formatInteger(warning.threshold, locale)}</td>
                  <td>{warning.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
