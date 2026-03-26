import { Suspense, lazy, startTransition, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { DashboardPage, Route } from './content';
import {
  DASHBOARD_REFRESH_INTERVAL_MS,
  dashboardMetricCards,
  getDashboardMockSnapshot,
  type InventoryCategoryShare,
  type InventoryWarning,
  type WarehouseDashboardSnapshot,
  type WarehouseTrendPoint,
} from './dashboardMock';

const WarehouseTrendChart = lazy(() => import('./WarehouseTrendChart'));
const WarehouseCategoryChart = lazy(() => import('./WarehouseCategoryChart'));

type WarehouseDashboardViewProps = {
  page: DashboardPage;
  onNavigate: (route: Route) => void;
};

function formatMetricValue(format: 'integer' | 'percent', value: number) {
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }

  return new Intl.NumberFormat('en-US').format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
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
  return warning.severity === 'critical' ? 'status-pill--critical' : 'status-pill--warning';
}

function getCategorySharePercentage(category: InventoryCategoryShare, total: number) {
  if (total === 0) {
    return '0.0%';
  }

  return `${((category.value / total) * 100).toFixed(1)}%`;
}

function ChartLoadingState({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`dashboard-chart dashboard-chart--loading ${compact ? 'dashboard-chart--compact' : ''}`} aria-hidden="true">
      <div className={`dashboard-chart__placeholder ${compact ? 'dashboard-chart__placeholder--compact' : ''}`} />
    </div>
  );
}

export default function WarehouseDashboardView({ page, onNavigate }: WarehouseDashboardViewProps) {
  const refreshCycleRef = useRef(0);
  const [snapshot, setSnapshot] = useState<WarehouseDashboardSnapshot>(() => getDashboardMockSnapshot(0, new Date()));

  const refreshSnapshot = useCallback(() => {
    refreshCycleRef.current += 1;
    const nextSnapshot = getDashboardMockSnapshot(refreshCycleRef.current, new Date());

    startTransition(() => {
      setSnapshot(nextSnapshot);
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

  const trendSummary = getTrendSummary(snapshot.trend);
  const criticalWarnings = snapshot.warnings.filter((warning) => warning.severity === 'critical').length;
  const impactedCountries = new Set(snapshot.warnings.map((warning) => warning.country)).size;
  const impactedWarehouses = new Set(snapshot.warnings.map((warning) => warning.warehouse)).size;
  const categoryShareTotal = snapshot.categoryShare.reduce((sum, category) => sum + category.value, 0);

  return (
    <>
      <section className="dashboard-kpi-grid" aria-label="Warehouse KPI cards">
        {dashboardMetricCards.map((card, index) => {
          const metric = snapshot.metrics[card.key];

          return (
            <article className={`dashboard-kpi-card dashboard-kpi-card--${card.tone}`} key={card.key}>
              <div className="dashboard-kpi-card__header">
                <span className="dashboard-kpi-card__label">{card.label}</span>
                <span className={`metric-badge metric-badge--${metric.trendTone}`}>{metric.comparison}</span>
              </div>

              <strong className="dashboard-kpi-card__value">{formatMetricValue(card.format, metric.value)}</strong>
              <p className="dashboard-kpi-card__helper">{metric.helper}</p>

              {card.key === 'warehouseSpaceUtilizationRate' ? (
                <div
                  className="metric-meter"
                  aria-hidden="true"
                  style={{ '--metric-fill': `${Math.min(metric.value, 100)}%`, '--metric-delay': `${index * 60}ms` } as CSSProperties}
                >
                  <span />
                </div>
              ) : (
                <div className="dashboard-kpi-card__accent" aria-hidden="true" style={{ '--metric-delay': `${index * 60}ms` } as CSSProperties} />
              )}
            </article>
          );
        })}
      </section>

      <section className="dashboard-main-grid">
        <section className="page-panel dashboard-chart-panel">
          <div className="section-heading dashboard-panel-heading">
            <div>
              <p className="section-kicker">7-day movement</p>
              <h2>Inbound and outbound trend</h2>
            </div>

            <div className="dashboard-panel-actions">
              <div className="dashboard-sync-chip">
                <span className="hero-meta-block__label">Last sync</span>
                <strong>{formatDateTime(snapshot.generatedAt)}</strong>
                <span>{snapshot.feedLabel}</span>
              </div>

              <button className="secondary-button secondary-button--compact" type="button" onClick={refreshSnapshot}>
                Refresh now
              </button>
            </div>
          </div>

          <p className="section-copy">
            Confirmed warehouse receipts and shipments for the last seven days, updated through the live mock polling cycle.
          </p>

          <Suspense fallback={<ChartLoadingState />}>
            <WarehouseTrendChart data={snapshot.trend} />
          </Suspense>

          <div className="dashboard-trend-summary" aria-label="Trend summary">
            <article className="trend-summary-card">
              <span>7-day inbound total</span>
              <strong>{formatInteger(trendSummary.totalInbound)}</strong>
              <p>All confirmed receipt quantity in the current rolling window.</p>
            </article>

            <article className="trend-summary-card">
              <span>7-day outbound total</span>
              <strong>{formatInteger(trendSummary.totalOutbound)}</strong>
              <p>Orders completed through picking, packing, and shipment.</p>
            </article>

            <article className="trend-summary-card">
              <span>7-day net flow</span>
              <strong>{trendSummary.netFlow >= 0 ? '+' : ''}{formatInteger(trendSummary.netFlow)}</strong>
              <p>Net stock movement from inbound minus outbound activity.</p>
            </article>
          </div>

          <div className="button-row">
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
      </section>

      <section className="page-panel dashboard-category-panel">
        <div className="section-heading dashboard-panel-heading">
          <div>
            <p className="section-kicker">Inventory structure</p>
            <h2>Category stock share</h2>
          </div>

          <p className="section-copy">Category mix across all active warehouse sites.</p>
        </div>

        <div className="dashboard-category-layout">
          <Suspense fallback={<ChartLoadingState compact />}>
            <WarehouseCategoryChart data={snapshot.categoryShare} />
          </Suspense>

          <div className="category-share-list" aria-label="Category share details">
            {snapshot.categoryShare.map((category) => (
              <article className="category-share-item" key={category.id}>
                <div className="category-share-item__label">
                  <span className="category-share-item__swatch" aria-hidden="true" style={{ backgroundColor: category.color }} />
                  <strong>{category.label}</strong>
                </div>

                <span className="category-share-item__metric">{getCategorySharePercentage(category, categoryShareTotal)}</span>
                <span className="category-share-item__units">{formatInteger(category.value)} units</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-panel dashboard-warning-board">
        <div className="section-heading dashboard-panel-heading">
          <div>
            <p className="section-kicker">Warnings</p>
            <h2>Inventory watchlist</h2>
          </div>

          <div className="dashboard-warning-summary">
            <span className="status-pill status-pill--critical">{criticalWarnings} critical</span>
            <span className="status-pill status-pill--warning">{snapshot.warnings.length - criticalWarnings} warning</span>
            <span className="status-pill status-pill--muted">{impactedCountries} countries</span>
            <span className="status-pill status-pill--muted">{impactedWarehouses} sites</span>
          </div>
        </div>

        <p className="section-copy">
          The watchlist is shown as a full-width operational queue so more domestic and overseas warehouses can be added without compressing the dashboard.
        </p>

        <div className="table-wrap">
          <table className="orders-table warning-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>SKU / Product</th>
                <th>Category</th>
                <th>Region / Country</th>
                <th>Warehouse</th>
                <th>Location</th>
                <th>On Hand</th>
                <th>Threshold</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.warnings.map((warning) => (
                <tr key={warning.id}>
                  <td>
                    <span className={`status-pill ${getWarningToneClass(warning)}`}>{warning.severity}</span>
                  </td>
                  <td>
                    <div className="warning-table__product">
                      <strong>{warning.sku}</strong>
                      <span>{warning.productName}</span>
                    </div>
                  </td>
                  <td>{warning.category}</td>
                  <td>
                    <div className="warning-table__stack">
                      <strong>{warning.region}</strong>
                      <span>{warning.country}</span>
                    </div>
                  </td>
                  <td>{warning.warehouse}</td>
                  <td>{warning.location}</td>
                  <td>{formatInteger(warning.onHand)}</td>
                  <td>{formatInteger(warning.threshold)}</td>
                  <td className="warning-table__action">{warning.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
