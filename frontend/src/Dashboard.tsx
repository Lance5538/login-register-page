import { Suspense, lazy, useEffect, useState } from 'react';
import OperationalModuleView from './OperationalViews';
import {
  brandContent,
  getWorkspacePage,
  workspaceFooterLinks,
  workspaceNavigation,
  type ModulePage,
  type Route,
  type WorkspaceRoute,
} from './content';
import { dashboardHeroMeta } from './dashboardMock';
import { createInitialSelections, createInitialWorkspaceStore, isOperationalRoute } from './operations';

const initialWorkspaceStore = createInitialWorkspaceStore();
const initialOperationalSelections = createInitialSelections(initialWorkspaceStore);
const WarehouseDashboardView = lazy(() => import('./WarehouseDashboardView'));

type DashboardProps = {
  route: WorkspaceRoute;
  onNavigate: (route: Route) => void;
};

function formatDate(now: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
}

function formatTime(now: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
}

export default function Dashboard({ route, onNavigate }: DashboardProps) {
  const [now, setNow] = useState(() => new Date());
  const [workspaceStore, setWorkspaceStore] = useState(() => initialWorkspaceStore);
  const [operationalSelections, setOperationalSelections] = useState(() => initialOperationalSelections);
  const page = getWorkspacePage(route);
  const heroMetaBlocks =
    page.kind === 'dashboard'
      ? dashboardHeroMeta
      : [
          {
            label: 'Workspace date',
            value: formatDate(now),
            detail: formatTime(now),
          },
        ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__top">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">
              {brandContent.mark}
            </div>
            <div className="brand-copy">
              <p className="brand-name">{brandContent.name}</p>
              <p className="brand-caption">{brandContent.caption}</p>
            </div>
          </div>

          <p className="utility-label">{brandContent.workspaceLabel}</p>
        </div>

        <div className="workspace-nav-groups">
          {workspaceNavigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group__title">{group.label}</p>
              <div className="nav-group__items">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`nav-item ${page.navKey === item.key ? 'is-active' : ''}`}
                    aria-current={page.navKey === item.key ? 'page' : undefined}
                    onClick={() => onNavigate(item.route)}
                  >
                    <span className="nav-item__label">{item.label}</span>
                    <span className="nav-item__detail">{item.detail}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="workspace-sidebar__footer">
          {workspaceFooterLinks.map((action) => (
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
      </aside>

      <main className="workspace-main">
        <header
          className="workspace-hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(4, 9, 14, 0.22), rgba(4, 9, 14, 0.76)), url(${page.heroImage})`,
          }}
        >
          <div className="workspace-hero__copy">
            <p className="section-kicker">{page.section}</p>
            <h1 className="dashboard-title">{page.title}</h1>
            <p className="dashboard-copy">{page.description}</p>

            {'tabs' in page ? (
              <div className="page-tabs" aria-label="Page mode">
                {page.tabs.map((tab) => (
                  <button
                    key={tab.route}
                    type="button"
                    className={`page-tab ${route === tab.route ? 'is-active' : ''}`}
                    aria-current={route === tab.route ? 'page' : undefined}
                    onClick={() => onNavigate(tab.route)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="workspace-hero__meta">
            {heroMetaBlocks.map((block) => (
              <div className="hero-meta-block" key={block.label}>
                <span className="hero-meta-block__label">{block.label}</span>
                <strong>{block.value}</strong>
                <span>{block.detail}</span>
              </div>
            ))}
          </div>
        </header>

        {page.kind === 'dashboard' ? (
          <Suspense fallback={<DashboardLoadingState />}>
            <WarehouseDashboardView page={page} onNavigate={onNavigate} />
          </Suspense>
        ) : isOperationalRoute(route) ? (
          <OperationalModuleView
            route={route}
            page={page}
            store={workspaceStore}
            setStore={setWorkspaceStore}
            selections={operationalSelections}
            setSelections={setOperationalSelections}
            onNavigate={onNavigate}
          />
        ) : (
          <ModulePageView page={page} onNavigate={onNavigate} />
        )}
      </main>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <section className="page-panel">
      <div className="section-heading section-heading--stack">
        <div>
          <p className="section-kicker">Dashboard</p>
          <h2>Loading operations surface</h2>
        </div>
        <p className="section-copy">Preparing KPI cards, warning panels, and the 7-day inbound/outbound trend.</p>
      </div>
    </section>
  );
}

function ModulePageView({ page, onNavigate }: { page: ModulePage; onNavigate: (route: Route) => void }) {
  const pageSelectionKey = `${page.navKey}:${page.kind}`;
  const [selectedRowIndexes, setSelectedRowIndexes] = useState<Record<string, number>>({});
  const selectedRowIndex = selectedRowIndexes[pageSelectionKey] ?? 0;

  if (isReadonlyWarehousePage(page)) {
    return (
      <ReadonlyWarehouseModuleView
        page={page}
        onNavigate={onNavigate}
        selectedRowIndex={selectedRowIndex}
        onSelectRow={(index) => {
          setSelectedRowIndexes((current) => ({
            ...current,
            [pageSelectionKey]: index,
          }));
        }}
      />
    );
  }

  return (
    <>
      <section className="summary-strip" aria-label={`${page.title} summary`}>
        {page.summary.map((item) => (
          <div className="summary-item" key={item.label}>
            <span className="summary-item__label">{item.label}</span>
            <strong className="summary-item__value">{item.value}</strong>
            <p className="summary-item__detail">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="workspace-layout">
        <section className="page-panel page-panel--main">
          {page.kind === 'list' ? (
            <>
              <div className="section-heading">
                <div>
                  <p className="section-kicker">List page</p>
                  <h2>{page.title}</h2>
                </div>
                <p className="section-copy">Rows and columns below are aligned to the documented entity fields for this module.</p>
              </div>

              <div className="table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      {page.columns?.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows?.map((row, index) => (
                      <tr key={`${page.title}-${index}`}>
                        {page.columns?.map((column) => (
                          <td key={column.key}>{row[column.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Detail page</p>
                  <h2>{page.title}</h2>
                </div>
                <p className="section-copy">The field groups below are built from the basic field list and the module relationships from the execution docs.</p>
              </div>

              <div className="detail-groups">
                {page.detailGroups?.map((group) => (
                  <section className="detail-group" key={group.title}>
                    <div className="detail-group__header">
                      <p className="section-kicker">{group.title}</p>
                      <h3>{group.title}</h3>
                    </div>

                    <dl className="detail-list">
                      {group.fields.map((field) => (
                        <div className="detail-list__row" key={field.label}>
                          <dt>{field.label}</dt>
                          <dd>{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="page-panel page-panel--rail">
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Entity source</p>
                <h2>{page.entityLabel}</h2>
              </div>
              <p className="section-copy">Exact field names below come from `basic-field-list.md`.</p>
            </div>

            <div className="blueprint-groups">
              {page.fieldBlueprint.map((group) => (
                <div className="blueprint-group" key={group.title}>
                  <p className="blueprint-group__title">{group.title}</p>
                  <ul className="mono-list">
                    {group.fields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Actions</p>
                <h2>Route controls</h2>
              </div>
            </div>

            <div className="button-stack">
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
        </aside>
      </section>
    </>
  );
}

type ReadonlyWarehouseKey = 'inventory' | 'stocktaking' | 'logistics-documents';
type ReadonlyMetric = {
  label: string;
  value: string;
};
type ReadonlyFact = {
  label: string;
  value: string;
};
type ReadonlySnapshot = {
  title: string;
  status: string;
  detail: string;
  metrics: ReadonlyMetric[];
  facts: ReadonlyFact[];
};

function isReadonlyWarehousePage(page: ModulePage): page is ModulePage & { navKey: ReadonlyWarehouseKey } {
  return page.navKey === 'inventory' || page.navKey === 'stocktaking' || page.navKey === 'logistics-documents';
}

function getReadonlyWarehouseConfig(navKey: ReadonlyWarehouseKey) {
  switch (navKey) {
    case 'inventory':
      return {
        listKicker: 'Inventory control',
        listDescription: 'Scan stock by SKU, warehouse, and location, then open one record for threshold review.',
        detailKicker: 'Inventory record',
        detailDescription: 'Review stock position, reserved quantity, and low-stock context in one place.',
        listPrimaryLabel: 'Review selected',
        detailPrimaryLabel: 'Back to list',
        rowLabel: 'Inventory record',
      };
    case 'stocktaking':
      return {
        listKicker: 'Count queue',
        listDescription: 'Track planned counting work, current progress, and due tasks from one workspace.',
        detailKicker: 'Task workspace',
        detailDescription: 'Review the selected counting task, due window, and variance context in one place.',
        listPrimaryLabel: 'Review task',
        detailPrimaryLabel: 'Back to list',
        rowLabel: 'Task',
      };
    default:
      return {
        listKicker: 'Logistics desk',
        listDescription: 'Keep shipment records and linked documents aligned from one operations desk.',
        detailKicker: 'Shipment record',
        detailDescription: 'Review the selected shipment, linked document, and carrier context in one place.',
        listPrimaryLabel: 'Review record',
        detailPrimaryLabel: 'Back to list',
        rowLabel: 'Record',
      };
  }
}

function ReadonlyWarehouseModuleView({
  page,
  onNavigate,
  selectedRowIndex,
  onSelectRow,
}: {
  page: ModulePage & { navKey: ReadonlyWarehouseKey };
  onNavigate: (route: Route) => void;
  selectedRowIndex: number;
  onSelectRow: (index: number) => void;
}) {
  const config = getReadonlyWarehouseConfig(page.navKey);
  const primaryAction = page.actions[0];
  const secondaryAction = page.actions[1];
  const selectedRow = page.rows?.[selectedRowIndex] ?? page.rows?.[0];
  const snapshot =
    page.kind === 'list' && selectedRow ? buildReadonlyListSnapshot(page.navKey, selectedRow) : buildReadonlyDetailSnapshot(page);

  return (
    <>
      <section className="summary-strip" aria-label={`${page.title} summary`}>
        {page.summary.map((item) => (
          <div className="summary-item" key={item.label}>
            <span className="summary-item__label">{item.label}</span>
            <strong className="summary-item__value">{item.value}</strong>
            <p className="summary-item__detail">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="workspace-layout workspace-layout--warehouse-flow">
        <section className="page-panel page-panel--main page-panel--warehouse-main">
          <section className="warehouse-flow-header">
            <div className="warehouse-flow-header__copy">
              <p className="section-kicker">{page.kind === 'list' ? config.listKicker : config.detailKicker}</p>
              <h2>{page.title}</h2>
              <p className="section-copy">{page.kind === 'list' ? config.listDescription : config.detailDescription}</p>
            </div>

            <div className="warehouse-flow-header__actions">
              {primaryAction ? (
                <button className="primary-button" type="button" onClick={() => onNavigate(primaryAction.route)}>
                  {page.kind === 'list' ? config.listPrimaryLabel : config.detailPrimaryLabel}
                </button>
              ) : null}
              {secondaryAction ? (
                <button className="secondary-button" type="button" onClick={() => onNavigate(secondaryAction.route)}>
                  Back to dashboard
                </button>
              ) : null}
            </div>
          </section>

          <ReadonlySpotlight snapshot={snapshot} />

          {page.kind === 'list' ? (
            <div className="table-wrap table-wrap--warehouse">
              <table className="orders-table">
                <thead>
                  <tr>
                    {page.columns?.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.rows?.map((row, index) => (
                    <tr
                      key={`${page.title}-${index}`}
                      className={`orders-table__row ${selectedRowIndex === index ? 'is-selected' : ''}`}
                      onClick={() => onSelectRow(index)}
                    >
                      {page.columns?.map((column) => (
                        <td key={column.key}>{renderReadonlyTableCell(page.navKey, column.key, row[column.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="detail-groups">
              {page.detailGroups?.map((group) => (
                <section className="detail-group" key={group.title}>
                  <div className="detail-group__header">
                    <p className="section-kicker">{group.title}</p>
                    <h3>{group.title}</h3>
                  </div>

                  <dl className="detail-list">
                    {group.fields.map((field) => (
                      <div className="detail-list__row" key={field.label}>
                        <dt>{field.label}</dt>
                        <dd>{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}
        </section>

        <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
          {page.kind === 'list' ? (
            <section className="rail-block">
              <div className="section-heading section-heading--stack">
                <div>
                  <p className="section-kicker">Quick focus</p>
                  <h2>Sample records</h2>
                </div>
              </div>

              <div className="module-group-panel__items">
                {page.rows?.map((row, index) => {
                  const option = buildReadonlyRowOption(page.navKey, row);

                  return (
                    <button
                      key={`${page.navKey}-${index}`}
                      type="button"
                      className={`module-link ${selectedRowIndex === index ? 'is-active' : ''}`}
                      onClick={() => onSelectRow(index)}
                    >
                      <span className="module-link__label">{option.label}</span>
                      <span className="module-link__detail">{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rail-block">
              <div className="section-heading section-heading--stack">
                <div>
                  <p className="section-kicker">Navigation</p>
                  <h2>Next step</h2>
                </div>
              </div>

              <div className="button-stack">
                {primaryAction ? (
                  <button className="primary-button" type="button" onClick={() => onNavigate(primaryAction.route)}>
                    {config.detailPrimaryLabel}
                  </button>
                ) : null}
                {secondaryAction ? (
                  <button className="secondary-button" type="button" onClick={() => onNavigate(secondaryAction.route)}>
                    Back to dashboard
                  </button>
                ) : null}
              </div>
            </section>
          )}

          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Key facts</p>
                <h2>{snapshot.title}</h2>
              </div>
              <p className="section-copy">
                {page.kind === 'list' ? `Keep the active ${config.rowLabel.toLowerCase()} in view while scanning the table.` : 'Keep the current record context visible while reviewing details.'}
              </p>
            </div>

            <ReadonlyFacts facts={snapshot.facts} />
          </section>
        </aside>
      </section>
    </>
  );
}

function buildReadonlyRowOption(navKey: ReadonlyWarehouseKey, row: Record<string, string>) {
  switch (navKey) {
    case 'inventory':
      return {
        label: row.productCode,
        detail: `${row.warehouse} · ${row.location}`,
      };
    case 'stocktaking':
      return {
        label: row.taskNo,
        detail: `${row.warehouse} · ${row.status}`,
      };
    default:
      return {
        label: row.logisticsNo,
        detail: `${row.orderRef} · ${row.destination}`,
      };
  }
}

function buildReadonlyListSnapshot(navKey: ReadonlyWarehouseKey, row: Record<string, string>): ReadonlySnapshot {
  if (navKey === 'inventory') {
    const qtyOnHand = numberValue(row.qtyOnHand);
    const qtyReserved = numberValue(row.qtyReserved);
    const threshold = numberValue(row.threshold);
    const available = Math.max(qtyOnHand - qtyReserved, 0);
    const status = qtyOnHand <= threshold ? 'Watch' : 'Healthy';

    return {
      title: row.productCode,
      status,
      detail: `${row.warehouse} · ${row.location}`,
      metrics: [
        { label: 'On hand', value: row.qtyOnHand },
        { label: 'Reserved', value: row.qtyReserved },
        { label: 'Available', value: String(available) },
        { label: 'Threshold', value: row.threshold },
      ],
      facts: [
        { label: 'Warehouse', value: row.warehouse },
        { label: 'Location', value: row.location },
        { label: 'Updated', value: row.updatedAt },
      ],
    };
  }

  if (navKey === 'stocktaking') {
    return {
      title: row.taskNo,
      status: row.status,
      detail: `${row.warehouse} · ${row.plannedDate}`,
      metrics: [
        { label: 'Warehouse', value: row.warehouse },
        { label: 'Planned', value: row.plannedDate },
        { label: 'Completed', value: row.completedDate },
        { label: 'Owner', value: row.createdBy },
      ],
      facts: [
        { label: 'Status', value: row.status },
        { label: 'Completed', value: row.completedDate },
      ],
    };
  }

  return {
    title: row.logisticsNo,
    status: deriveLogisticsStatus(row.status),
    detail: `${row.orderRef} · ${row.destination}`,
    metrics: [
      { label: 'Carrier', value: row.carrier },
      { label: 'Document', value: row.documentNo },
      { label: 'Order ref', value: row.orderRef },
      { label: 'Destination', value: row.destination },
    ],
    facts: [
      { label: 'Combined status', value: row.status },
      { label: 'Carrier', value: row.carrier },
    ],
  };
}

function buildReadonlyDetailSnapshot(page: ModulePage & { navKey: ReadonlyWarehouseKey }): ReadonlySnapshot {
  if (page.navKey === 'inventory') {
    const qtyOnHand = numberValue(readField(page, 'Inventory record', 'Qty On Hand'));
    const qtyReserved = numberValue(readField(page, 'Inventory record', 'Qty Reserved'));
    const threshold = numberValue(readField(page, 'Inventory record', 'Low Stock Threshold'));
    const available = Math.max(qtyOnHand - qtyReserved, 0);
    const status = readField(page, 'Linked context', 'Low Stock Status');

    return {
      title: readField(page, 'Linked context', 'Product'),
      status,
      detail: `${readField(page, 'Linked context', 'Warehouse')} · ${readField(page, 'Inventory record', 'Location')}`,
      metrics: [
        { label: 'On hand', value: String(qtyOnHand) },
        { label: 'Reserved', value: String(qtyReserved) },
        { label: 'Available', value: String(available) },
        { label: 'Threshold', value: String(threshold) },
      ],
      facts: [
        { label: 'Category', value: readField(page, 'Linked context', 'Category') },
        { label: 'Updated', value: readField(page, 'Inventory record', 'Updated At') },
      ],
    };
  }

  if (page.navKey === 'stocktaking') {
    return {
      title: readField(page, 'Stocktaking task', 'Task No.'),
      status: readField(page, 'Stocktaking task', 'Status'),
      detail: `${readField(page, 'Stocktaking task', 'Warehouse Id')} · ${readField(page, 'Linked context', 'Counting Zone')}`,
      metrics: [
        { label: 'Planned', value: readField(page, 'Stocktaking task', 'Planned Date') },
        { label: 'Completed', value: readField(page, 'Stocktaking task', 'Completed Date') },
        { label: 'Owner', value: readField(page, 'Stocktaking task', 'Created By') },
        { label: 'Review', value: readField(page, 'Linked context', 'Review Window') },
      ],
      facts: [
        { label: 'Counting zone', value: readField(page, 'Linked context', 'Counting Zone') },
        { label: 'Variance', value: readField(page, 'Linked context', 'Expected Difference') },
        { label: 'Warehouse lead', value: readField(page, 'Linked context', 'Warehouse Lead') },
      ],
    };
  }

  return {
    title: readField(page, 'Logistics record', 'Logistics No.'),
    status: readField(page, 'Logistics record', 'Status'),
    detail: `${readField(page, 'Logistics record', 'Related Order Id')} · ${readField(page, 'Logistics record', 'Destination')}`,
    metrics: [
      { label: 'Carrier', value: readField(page, 'Logistics record', 'Carrier') },
      { label: 'Document', value: readField(page, 'Document', 'Document No.') },
      { label: 'Doc type', value: readField(page, 'Document', 'Document Type') },
      { label: 'Issue date', value: readField(page, 'Document', 'Issue Date') },
    ],
    facts: [
      { label: 'Shipped', value: readField(page, 'Logistics record', 'Shipped At') },
      { label: 'Delivered', value: readField(page, 'Logistics record', 'Delivered At') },
      { label: 'Document status', value: readField(page, 'Document', 'Status') },
      { label: 'Remarks', value: readField(page, 'Document', 'Remarks') },
    ],
  };
}

function readField(page: ModulePage, groupTitle: string, label: string) {
  return page.detailGroups?.find((group) => group.title === groupTitle)?.fields.find((field) => field.label === label)?.value ?? '--';
}

function numberValue(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function deriveLogisticsStatus(value: string) {
  if (value.includes('Delivered')) {
    return 'Delivered';
  }

  if (value.includes('Scheduled')) {
    return 'Scheduled';
  }

  if (value.includes('Pending')) {
    return 'Pending';
  }

  return 'In Transit';
}

function getReadonlyStatusTone(value: string) {
  if (value === 'Healthy' || value === 'Completed' || value === 'Delivered') {
    return 'positive';
  }

  if (value === 'Watch' || value === 'Pending') {
    return 'warning';
  }

  if (value === 'Scheduled') {
    return 'muted';
  }

  return 'info';
}

function renderReadonlyTableCell(navKey: ReadonlyWarehouseKey, columnKey: string, value: string) {
  if (columnKey !== 'status') {
    return value;
  }

  if (navKey === 'logistics-documents') {
    return value;
  }

  return <ReadonlyStatusPill value={value} />;
}

function ReadonlyStatusPill({ value }: { value: string }) {
  return <span className={`status-pill status-pill--${getReadonlyStatusTone(value)}`}>{value}</span>;
}

function ReadonlySpotlight({ snapshot }: { snapshot: ReadonlySnapshot }) {
  return (
    <section className="warehouse-flow-spotlight">
      <div className="warehouse-flow-spotlight__lead">
        <div className="warehouse-flow-spotlight__eyebrow">
          <p className="section-kicker">Current focus</p>
          <ReadonlyStatusPill value={snapshot.status} />
        </div>
        <h3>{snapshot.title}</h3>
        <p className="section-copy">{snapshot.detail}</p>
      </div>

      <div className="warehouse-flow-metrics">
        {snapshot.metrics.map((item) => (
          <div className="warehouse-flow-metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadonlyFacts({ facts }: { facts: ReadonlyFact[] }) {
  return (
    <div className="warehouse-flow-facts">
      {facts.map((item) => (
        <div className="warehouse-flow-fact" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
