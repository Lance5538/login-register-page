import { useDeferredValue, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { getLocaleTag, type AuthLocale, type ModulePage, type Route, type WorkspaceRoute } from './content';
import * as ops from './operations';
import { downloadWorkbook, readSpreadsheetFile, sanitizeSpreadsheetValue, type SpreadsheetRow } from './spreadsheet';

type OperationalModuleViewProps = {
  route: WorkspaceRoute;
  page: ModulePage;
  locale: AuthLocale;
  store: ops.WorkspaceStore;
  setStore: Dispatch<SetStateAction<ops.WorkspaceStore>>;
  selections: ops.OperationalSelections;
  setSelections: Dispatch<SetStateAction<ops.OperationalSelections>>;
  onNavigate: (route: Route) => void;
  currentUser: ops.UserSession;
};

type FilterOption = {
  value: string;
  label: string;
};

type ImportFeedback = {
  tone: 'success' | 'error';
  title: string;
  detail: string;
  errors?: string[];
};

type OrderModule = 'inbound' | 'outbound';

const statusLabels: Record<AuthLocale, Record<string, string>> = {
  en: {
    Healthy: 'Healthy',
    'Low Stock': 'Low Stock',
    'Out of Stock': 'Out of Stock',
    Draft: 'Draft',
    'Pending Receipt': 'Pending Receipt',
    Received: 'Received',
    'Pending Shipment': 'Pending Shipment',
    Shipped: 'Shipped',
    'Pending Approval': 'Pending Approval',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Active: 'Active',
    Invited: 'Invited',
  },
  zh: {
    Healthy: '正常',
    'Low Stock': '低库存',
    'Out of Stock': '缺货',
    Draft: '草稿',
    'Pending Receipt': '待收货',
    Received: '已收货',
    'Pending Shipment': '待发货',
    Shipped: '已发货',
    'Pending Approval': '待审批',
    Approved: '已通过',
    Rejected: '已驳回',
    Active: '启用',
    Invited: '已邀请',
  },
};

function copyByLocale<T>(locale: AuthLocale, en: T, zh: T) {
  return locale === 'zh' ? zh : en;
}

function getLocalizedStatus(locale: AuthLocale, label: string) {
  return statusLabels[locale][label] ?? label;
}

function getLocalizedModule(locale: AuthLocale, module: string) {
  if (locale === 'zh') {
    return module === 'Inbound' ? '入库' : module === 'Outbound' ? '出库' : module;
  }

  return module;
}

function getLocalizedRole(locale: AuthLocale, role: ops.UserRole) {
  if (locale === 'zh') {
    return role === 'Admin' ? '管理员' : '员工';
  }

  return role;
}

function formatRecordCount(locale: AuthLocale, count: number) {
  return locale === 'zh' ? `${count} 条记录` : `${count} records`;
}

function isInboundRecord(record: ops.InboundRecord | ops.OutboundRecord): record is ops.InboundRecord {
  return 'supplierName' in record;
}

function getApprovalChipTone(status: ops.ApprovalStatus) {
  if (status === 'Approved') {
    return 'positive';
  }

  if (status === 'Rejected') {
    return 'danger';
  }

  return 'info';
}

function getStatusChipTone(status: string) {
  if (status === 'Healthy' || status === 'Received' || status === 'Shipped') {
    return 'positive';
  }

  if (status === 'Low Stock') {
    return 'warning';
  }

  if (status === 'Rejected' || status === 'Out of Stock' || status === 'Hold') {
    return 'danger';
  }

  if (status === 'Draft') {
    return 'muted';
  }

  return 'info';
}

function StatusChip({
  label,
  locale,
  tone,
}: {
  label: string;
  locale: AuthLocale;
  tone?: 'positive' | 'warning' | 'danger' | 'info' | 'muted';
}) {
  return <span className={`status-chip status-chip--${tone ?? getStatusChipTone(label)}`}>{getLocalizedStatus(locale, label)}</span>;
}

function ImportFeedbackBanner({
  feedback,
  locale,
  onClose,
}: {
  feedback: ImportFeedback | null;
  locale: AuthLocale;
  onClose: () => void;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <section className={`feedback-banner feedback-banner--${feedback.tone}`}>
      <div>
        <strong>{feedback.title}</strong>
        <p>{feedback.detail}</p>
        {feedback.errors?.length ? (
          <ul className="feedback-banner__list">
            {feedback.errors.slice(0, 5).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <button className="secondary-button secondary-button--compact" type="button" onClick={onClose}>
        {copyByLocale(locale, 'Dismiss', '关闭')}
      </button>
    </section>
  );
}

function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filterValue,
  onFilterChange,
  filterOptions,
  onImport,
  onTemplate,
  onExport,
  onNew,
  locale,
  newLabel = 'New',
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
  onImport: () => void;
  onTemplate: () => void;
  onExport: () => void;
  onNew: () => void;
  locale: AuthLocale;
  newLabel?: string;
}) {
  return (
    <section className="admin-toolbar">
      <div className="admin-toolbar__filters">
        <input
          className="admin-input"
          type="search"
          value={search}
          placeholder={searchPlaceholder}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <select className="admin-select" value={filterValue} onChange={(event) => onFilterChange(event.target.value)}>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-toolbar__actions">
        <button className="secondary-button" type="button" onClick={onImport}>
          {copyByLocale(locale, 'Import', '导入')}
        </button>
        <button className="secondary-button" type="button" onClick={onTemplate}>
          {copyByLocale(locale, 'Template', '模板')}
        </button>
        <button className="secondary-button" type="button" onClick={onExport}>
          {copyByLocale(locale, 'Export', '导出')}
        </button>
        <button className="primary-button" type="button" onClick={onNew}>
          {newLabel}
        </button>
      </div>
    </section>
  );
}

function DetailGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="detail-grid">
      {items.map((item) => (
        <div key={item.label} className="detail-grid__item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LineItemsTable({
  locale,
  store,
  lineItems,
  editable = false,
  onChange,
}: {
  locale: AuthLocale;
  store: ops.WorkspaceStore;
  lineItems: ops.OrderLineItem[];
  editable?: boolean;
  onChange?: (lineItems: ops.OrderLineItem[]) => void;
}) {
  const productOptions = ops.buildProductOptions(store);

  function updateLineItem(lineId: string, next: Partial<ops.OrderLineItem>) {
    if (!onChange) {
      return;
    }

    onChange(lineItems.map((lineItem) => (lineItem.id === lineId ? { ...lineItem, ...next } : lineItem)));
  }

  function removeLineItem(lineId: string) {
    if (!onChange) {
      return;
    }

    onChange(lineItems.length > 1 ? lineItems.filter((lineItem) => lineItem.id !== lineId) : [ops.createEmptyLineItem()]);
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{copyByLocale(locale, 'Product', '产品')}</th>
            <th>SKU</th>
            <th>{copyByLocale(locale, 'Quantity', '数量')}</th>
            <th>{copyByLocale(locale, 'Unit', '单位')}</th>
            <th>{copyByLocale(locale, 'Notes', '备注')}</th>
            {editable ? <th>{copyByLocale(locale, 'Action', '操作')}</th> : null}
          </tr>
        </thead>
        <tbody>
          {lineItems.map((lineItem) => {
            const product = ops.findProduct(store, lineItem.productId);

            return (
              <tr key={lineItem.id}>
                <td>
                  {editable ? (
                    <select
                      className="admin-select"
                      value={lineItem.productId}
                      onChange={(event) => updateLineItem(lineItem.id, { productId: event.target.value })}
                    >
                      <option value="">{copyByLocale(locale, 'Select product', '选择产品')}</option>
                      {productOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="table-primary">
                      <strong>{product?.productName ?? copyByLocale(locale, 'Unassigned product', '未分配产品')}</strong>
                      <span>{product?.productCode ?? '--'}</span>
                    </div>
                  )}
                </td>
                <td>{product?.productCode ?? '--'}</td>
                <td>
                  {editable ? (
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      step="1"
                      value={lineItem.quantity}
                      onChange={(event) => updateLineItem(lineItem.id, { quantity: event.target.value })}
                    />
                  ) : (
                    lineItem.quantity || '--'
                  )}
                </td>
                <td>{product?.unit ?? '--'}</td>
                <td>
                  {editable ? (
                    <input
                      className="admin-input"
                      type="text"
                      value={lineItem.notes}
                      onChange={(event) => updateLineItem(lineItem.id, { notes: event.target.value })}
                    />
                  ) : (
                    lineItem.notes || '--'
                  )}
                </td>
                {editable ? (
                  <td>
                    <button className="table-action" type="button" onClick={() => removeLineItem(lineItem.id)}>
                      {copyByLocale(locale, 'Remove', '移除')}
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function createSheetFileName(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.xlsx`;
}

function matchWarehouse(store: ops.WorkspaceStore, value: string) {
  const normalized = value.trim().toLowerCase();
  return store.warehouses.find(
    (warehouse) =>
      warehouse.id.toLowerCase() === normalized ||
      warehouse.warehouseCode.toLowerCase() === normalized ||
      warehouse.warehouseName.toLowerCase() === normalized,
  );
}

function matchProductByCode(store: ops.WorkspaceStore, value: string) {
  const normalized = value.trim().toLowerCase();
  return store.products.find(
    (product) => product.productCode.toLowerCase() === normalized || product.productName.toLowerCase() === normalized,
  );
}

function parseImportedLineItems(value: string, store: ops.WorkspaceStore, locale: AuthLocale) {
  const lineItems: ops.OrderLineItem[] = [];
  const errors: string[] = [];
  const segments = value
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      lineItems,
      errors: [copyByLocale(locale, 'Line Items column is empty.', '商品明细列为空。')],
    };
  }

  segments.forEach((segment) => {
    const [productToken, quantityToken] = segment.split(':').map((item) => item.trim());
    const product = matchProductByCode(store, productToken);
    const quantity = Number(quantityToken);

    if (!product) {
      errors.push(copyByLocale(locale, `Unknown product "${productToken}".`, `未知产品 "${productToken}"。`));
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(copyByLocale(locale, `Invalid quantity for "${productToken}".`, `"${productToken}" 的数量无效。`));
      return;
    }

    lineItems.push({
      ...ops.createEmptyLineItem(),
      productId: product.id,
      quantity: String(quantity),
      notes: '',
    });
  });

  return { lineItems, errors };
}

function formatOrderLineItems(lineItems: ops.OrderLineItem[], store: ops.WorkspaceStore) {
  return lineItems
    .map((lineItem) => {
      const product = ops.findProduct(store, lineItem.productId);
      return `${sanitizeSpreadsheetValue(product?.productCode ?? '--')}:${sanitizeSpreadsheetValue(lineItem.quantity || '0')}`;
    })
    .join(' | ');
}

function updateApprovalSelection(
  setSelections: Dispatch<SetStateAction<ops.OperationalSelections>>,
  item: ops.ApprovalQueueItem,
) {
  setSelections((current) => ({
    ...current,
    approvalKey: item.key,
    inboundId: item.module === 'Inbound' ? item.id : current.inboundId,
    outboundId: item.module === 'Outbound' ? item.id : current.outboundId,
  }));
}

function orderModuleRoutes(module: OrderModule) {
  return module === 'inbound'
    ? {
        list: 'inbound-list' as const,
        detail: 'inbound-detail' as const,
        create: 'inbound-create' as const,
        edit: 'inbound-edit' as const,
      }
    : {
        list: 'outbound-list' as const,
        detail: 'outbound-detail' as const,
        create: 'outbound-create' as const,
        edit: 'outbound-edit' as const,
      };
}

export default function OperationalModuleView(props: OperationalModuleViewProps) {
  if (props.route === 'inventory-list' || props.route === 'inventory-detail') {
    return <InventoryWorkspace {...props} />;
  }

  if (props.route === 'approval-list') {
    if (!ops.hasPermission(props.currentUser, 'approve_orders')) {
      return (
        <section className="admin-panel">
          <div className="empty-note">
            {copyByLocale(props.locale, 'Approval Center is available to administrators only.', '审批中心仅对管理员开放。')}
          </div>
        </section>
      );
    }

    return <ApprovalWorkspace {...props} />;
  }

  if (props.route === 'user-management-list') {
    if (!ops.hasPermission(props.currentUser, 'manage_users')) {
      return (
        <section className="admin-panel">
          <div className="empty-note">
            {copyByLocale(props.locale, 'User Management is available to administrators only.', '用户管理仅对管理员开放。')}
          </div>
        </section>
      );
    }

    return <UserManagementWorkspace {...props} />;
  }

  if (props.route.startsWith('inbound-') || props.route.startsWith('outbound-')) {
    const module = props.route.startsWith('inbound-') ? 'inbound' : 'outbound';
    if (props.route.endsWith('-create') || props.route.endsWith('-edit')) {
      return <OrderFormWorkspace {...props} module={module} />;
    }

    return <OrderWorkspace {...props} module={module} />;
  }

  return (
    <section className="admin-panel">
      <div className="empty-note">
        {copyByLocale(props.locale, 'This route is not part of the simplified warehouse admin scope.', '该路由不在当前精简后的仓储后台范围内。')}
      </div>
    </section>
  );
}

function InventoryWorkspace({ store, setStore, selections, setSelections, onNavigate, route, locale }: OperationalModuleViewProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const deferredSearch = useDeferredValue(search);
  const inventoryRows = useMemo(() => ops.buildInventorySnapshots(store), [store]);
  const text = {
    searchPlaceholder: copyByLocale(locale, 'Search SKU, product, warehouse, or location', '搜索 SKU、产品、仓库或库位'),
    allStatus: copyByLocale(locale, 'All status', '全部状态'),
    lowStock: copyByLocale(locale, 'Low stock', '低库存'),
    outOfStock: copyByLocale(locale, 'Out of stock', '缺货'),
    healthy: copyByLocale(locale, 'Healthy', '正常'),
    newInbound: copyByLocale(locale, 'New Inbound', '新建入库单'),
    listKicker: copyByLocale(locale, 'Inventory list', '库存列表'),
    listTitle: copyByLocale(locale, 'Stock ledger', '库存台账'),
    product: copyByLocale(locale, 'Product', '产品'),
    warehouse: copyByLocale(locale, 'Warehouse', '仓库'),
    location: copyByLocale(locale, 'Location', '库位'),
    onHand: copyByLocale(locale, 'On Hand', '现有库存'),
    threshold: copyByLocale(locale, 'Threshold', '阈值'),
    status: copyByLocale(locale, 'Status', '状态'),
    action: copyByLocale(locale, 'Action', '操作'),
    view: copyByLocale(locale, 'View', '查看'),
    emptyList: copyByLocale(locale, 'No inventory records matched the current search.', '当前搜索条件下没有匹配的库存记录。'),
    selectedRecord: copyByLocale(locale, 'Selected record', '当前记录'),
    backToList: copyByLocale(locale, 'Back to list', '返回列表'),
    category: copyByLocale(locale, 'Category', '分类'),
    country: copyByLocale(locale, 'Country', '国家'),
    lastUpdated: copyByLocale(locale, 'Last Updated', '最近更新'),
    inventoryNote: copyByLocale(
      locale,
      'Inventory is calculated from baseline records plus approved inbound and outbound orders in the current mock workspace.',
      '当前库存基于基础台账以及已审批通过的入库单和出库单计算得出。',
    ),
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return inventoryRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${row.productCode} ${row.productName} ${row.warehouseCode} ${row.warehouseName} ${row.location} ${row.country}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFilter = filterValue === 'all' || row.status === filterValue;

      return matchesSearch && matchesFilter;
    });
  }, [deferredSearch, filterValue, inventoryRows]);

  const selectedRow = filteredRows.find((row) => row.id === selections.inventoryId) ?? inventoryRows.find((row) => row.id === selections.inventoryId) ?? filteredRows[0] ?? inventoryRows[0];

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const rows = await readSpreadsheetFile(file);
    let workingStore = store;
    let successCount = 0;
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const product = matchProductByCode(workingStore, row['Product Code'] ?? row.Product ?? '');
      const warehouse = matchWarehouse(workingStore, row.Warehouse ?? '');
      const location = row.Location ?? '';
      const onHand = Number(row['On Hand'] ?? row['Qty On Hand'] ?? '');
      const threshold = Number(row.Threshold ?? row['Low Stock Threshold'] ?? '');

      if (!product || !warehouse || !location || !Number.isFinite(onHand) || !Number.isFinite(threshold)) {
        errors.push(copyByLocale(locale, `Row ${index + 2}: missing or invalid inventory fields.`, `第 ${index + 2} 行：库存字段缺失或无效。`));
        return;
      }

      const existing = workingStore.inventoryRecords.find(
        (record) => record.productId === product.id && record.warehouseId === warehouse.id,
      );

      workingStore = ops.upsertInventoryRecord(workingStore, {
        id: existing?.id ?? `INV-${warehouse.id}-${product.id}`,
        productId: product.id,
        warehouseId: warehouse.id,
        location: ops.sanitizeFreeText(location),
        onHandBase: onHand,
        threshold,
        updatedAt: ops.nowIso(),
      });
      successCount += 1;
    });

    if (successCount > 0) {
      setStore(workingStore);
    }

    setFeedback({
      tone: errors.length > 0 ? 'error' : 'success',
      title: errors.length > 0 ? copyByLocale(locale, 'Inventory import completed with issues', '库存导入完成，但存在问题') : copyByLocale(locale, 'Inventory import completed', '库存导入完成'),
      detail: copyByLocale(
        locale,
        `${successCount} rows imported successfully.${errors.length ? ` ${errors.length} rows need attention.` : ''}`,
        `成功导入 ${successCount} 行。${errors.length ? `仍有 ${errors.length} 行需要处理。` : ''}`,
      ),
      errors,
    });

    event.target.value = '';
  }

  function handleExport() {
    const exportRows: SpreadsheetRow[] = filteredRows.map((row) => ({
      'Product Code': row.productCode,
      Product: row.productName,
      Warehouse: row.warehouseCode,
      Country: row.country,
      Location: row.location,
      'On Hand': row.onHand,
      Threshold: row.threshold,
      Status: row.status,
      'Last Updated': row.lastUpdatedAt,
    }));

    downloadWorkbook(createSheetFileName('inventory-export'), 'Inventory', exportRows);
  }

  function handleTemplate() {
    downloadWorkbook(createSheetFileName('inventory-template'), 'Inventory Template', [
      {
        'Product Code': 'P-BOLT-A',
        Warehouse: 'WH-SH-01',
        Location: 'A1-04',
        'On Hand': 180,
        Threshold: 120,
      },
    ]);
  }

  return (
    <>
      <input ref={inputRef} className="hidden-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />

      <ImportFeedbackBanner feedback={feedback} locale={locale} onClose={() => setFeedback(null)} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={text.searchPlaceholder}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={[
          { value: 'all', label: text.allStatus },
          { value: 'Low Stock', label: text.lowStock },
          { value: 'Out of Stock', label: text.outOfStock },
          { value: 'Healthy', label: text.healthy },
        ]}
        onImport={() => inputRef.current?.click()}
        onTemplate={handleTemplate}
        onExport={handleExport}
        onNew={() => onNavigate('inbound-create')}
        locale={locale}
        newLabel={text.newInbound}
      />

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.listKicker}</p>
            <h2>{text.listTitle}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <span className="admin-inline-note">{formatRecordCount(locale, filteredRows.length)}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>{text.product}</th>
                <th>{text.warehouse}</th>
                <th>{text.location}</th>
                <th>{text.onHand}</th>
                <th>{text.threshold}</th>
                <th>{text.status}</th>
                <th>{text.action}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.productCode}</td>
                  <td>
                    <div className="table-primary">
                      <strong>{row.productName}</strong>
                      <span>{row.categoryName}</span>
                    </div>
                  </td>
                  <td>{row.warehouseCode}</td>
                  <td>{row.location}</td>
                  <td>{row.onHand}</td>
                  <td>{row.threshold}</td>
                  <td>
                    <StatusChip label={row.status} locale={locale} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        type="button"
                        onClick={() => {
                          setSelections((current) => ({ ...current, inventoryId: row.id }));
                          onNavigate('inventory-detail');
                        }}
                      >
                        {text.view}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 ? <p className="empty-note">{text.emptyList}</p> : null}
      </section>

      {route === 'inventory-detail' && selectedRow ? (
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="section-kicker">{text.selectedRecord}</p>
              <h2>{selectedRow.productCode}</h2>
            </div>

            <div className="admin-toolbar__actions">
              <StatusChip label={selectedRow.status} locale={locale} />
              <button className="secondary-button" type="button" onClick={() => onNavigate('inventory-list')}>
                {text.backToList}
              </button>
            </div>
          </div>

          <DetailGrid
            items={[
              { label: text.product, value: selectedRow.productName },
              { label: text.category, value: selectedRow.categoryName },
              { label: text.warehouse, value: selectedRow.warehouseName },
              { label: text.country, value: selectedRow.country },
              { label: text.location, value: selectedRow.location },
              { label: text.onHand, value: `${selectedRow.onHand} ${selectedRow.unit}` },
              { label: text.threshold, value: `${selectedRow.threshold} ${selectedRow.unit}` },
              { label: text.lastUpdated, value: ops.formatShortStamp(selectedRow.lastUpdatedAt, getLocaleTag(locale)) },
            ]}
          />

          <div className="admin-inline-note">{text.inventoryNote}</div>
        </section>
      ) : null}
    </>
  );
}

function OrderWorkspace({
  module,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
  route,
  locale,
  currentUser,
}: OperationalModuleViewProps & { module: OrderModule }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const deferredSearch = useDeferredValue(search);
  const routes = orderModuleRoutes(module);
  const records = (module === 'inbound' ? store.inboundOrders : store.outboundOrders) as Array<ops.InboundRecord | ops.OutboundRecord>;
  const selectedRecord = (
    module === 'inbound' ? ops.getSelectedInbound(store, selections) : ops.getSelectedOutbound(store, selections)
  ) as ops.InboundRecord | ops.OutboundRecord | undefined;
  const isInbound = module === 'inbound';
  const canApprove = ops.hasPermission(currentUser, 'approve_orders');
  const text = {
    searchPlaceholder: isInbound
      ? copyByLocale(locale, 'Search inbound no, warehouse, or partner', '搜索入库单号、仓库或合作方')
      : copyByLocale(locale, 'Search outbound no, warehouse, or partner', '搜索出库单号、仓库或合作方'),
    allApprovals: copyByLocale(locale, 'All approvals', '全部审批状态'),
    pendingApproval: copyByLocale(locale, 'Pending approval', '待审批'),
    approved: copyByLocale(locale, 'Approved', '已通过'),
    rejected: copyByLocale(locale, 'Rejected', '已驳回'),
    newOrder: isInbound ? copyByLocale(locale, 'New Inbound', '新建入库单') : copyByLocale(locale, 'New Outbound', '新建出库单'),
    listKicker: isInbound ? copyByLocale(locale, 'Inbound list', '入库列表') : copyByLocale(locale, 'Outbound list', '出库列表'),
    listTitle: isInbound ? copyByLocale(locale, 'Receipt orders', '收货订单') : copyByLocale(locale, 'Shipment orders', '发货订单'),
    orderNo: isInbound ? copyByLocale(locale, 'Inbound No', '入库单号') : copyByLocale(locale, 'Outbound No', '出库单号'),
    warehouse: copyByLocale(locale, 'Warehouse', '仓库'),
    partner: isInbound ? copyByLocale(locale, 'Supplier', '供应商') : copyByLocale(locale, 'Destination', '目的地'),
    units: copyByLocale(locale, 'Units', '数量'),
    orderStatus: copyByLocale(locale, 'Order Status', '订单状态'),
    approval: copyByLocale(locale, 'Approval', '审批状态'),
    created: copyByLocale(locale, 'Created', '创建时间'),
    action: copyByLocale(locale, 'Action', '操作'),
    view: copyByLocale(locale, 'View', '查看'),
    edit: copyByLocale(locale, 'Edit', '编辑'),
    approve: copyByLocale(locale, 'Approve', '通过'),
    emptyList: copyByLocale(locale, 'No orders matched the current search and filters.', '当前搜索和筛选条件下没有匹配的订单。'),
    selectedOrder: copyByLocale(locale, 'Selected order', '当前订单'),
    backToList: copyByLocale(locale, 'Back to list', '返回列表'),
    editOrder: copyByLocale(locale, 'Edit order', '编辑订单'),
    supplier: copyByLocale(locale, 'Supplier', '供应商'),
    referenceNo: copyByLocale(locale, 'Reference No', '参考单号'),
    plannedDate: copyByLocale(locale, 'Planned Date', '计划日期'),
    createdBy: copyByLocale(locale, 'Created By', '创建人'),
    createdAt: copyByLocale(locale, 'Created At', '创建时间'),
    destination: copyByLocale(locale, 'Destination', '目的地'),
    carrier: copyByLocale(locale, 'Carrier', '承运商'),
    shipmentDate: copyByLocale(locale, 'Shipment Date', '发运日期'),
    orderNotes: copyByLocale(locale, 'Order notes', '订单备注'),
    noNotes: copyByLocale(locale, 'No notes provided.', '未填写备注。'),
    rejectionReason: copyByLocale(locale, 'Rejection reason', '驳回原因'),
    approvalDecision: copyByLocale(locale, 'Approval decision', '审批决策'),
    approvalHint: copyByLocale(locale, 'Inventory will update only after this order is approved.', '只有订单审批通过后才会更新库存。'),
    approvalRestricted: copyByLocale(locale, 'Approval actions are restricted to administrators.', '审批操作仅限管理员执行。'),
    rejectPlaceholder: copyByLocale(locale, 'Optional rejection reason', '可填写驳回原因'),
    reject: copyByLocale(locale, 'Reject', '驳回'),
    postedNote: copyByLocale(locale, 'This order has already updated inventory in the current mock workspace.', '该订单已经在当前 mock 工作区中更新了库存。'),
    approvalBy: copyByLocale(locale, 'Approved By', '审批人'),
    approvalAt: copyByLocale(locale, 'Approval Time', '审批时间'),
    approvalResult: copyByLocale(locale, 'Approval Result', '审批结果'),
  };

  const filteredRecords = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return records.filter((record) => {
      const warehouse = ops.findWarehouse(store, record.warehouseId);
      const partner = isInboundRecord(record) ? record.supplierName : record.destination;
      const orderNo = isInboundRecord(record) ? record.inboundNo : record.outboundNo;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${orderNo} ${partner} ${warehouse?.warehouseCode ?? ''} ${warehouse?.warehouseName ?? ''} ${record.notes}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesFilter = filterValue === 'all' || record.approvalStatus === filterValue;
      return matchesSearch && matchesFilter;
    });
  }, [deferredSearch, filterValue, records, store]);

  const detailRecord =
    filteredRecords.find((record) => record.id === selectedRecord?.id) ??
    records.find((record) => record.id === selectedRecord?.id) ??
    filteredRecords[0] ??
    selectedRecord;
  const inboundDetailRecord = detailRecord && isInboundRecord(detailRecord) ? detailRecord : undefined;
  const outboundDetailRecord = detailRecord && !isInboundRecord(detailRecord) ? detailRecord : undefined;

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const rows = await readSpreadsheetFile(file);
    let workingStore = store;
    let successCount = 0;
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const warehouse = matchWarehouse(workingStore, row.Warehouse ?? '');
      const parsedLineItems = parseImportedLineItems(row['Line Items'] ?? row['Product Lines'] ?? '', workingStore, locale);

      if (!warehouse || parsedLineItems.errors.length > 0) {
        errors.push(
          copyByLocale(
            locale,
            `Row ${index + 2}: ${warehouse ? parsedLineItems.errors.join(' ') : 'Warehouse not found.'}`,
            `第 ${index + 2} 行：${warehouse ? parsedLineItems.errors.join(' ') : '未找到仓库。'}`,
          ),
        );
        return;
      }

      if (module === 'inbound') {
        if (!row.Supplier) {
          errors.push(copyByLocale(locale, `Row ${index + 2}: Supplier is required.`, `第 ${index + 2} 行：供应商必填。`));
          return;
        }

        const result = ops.saveInboundOrder(
          workingStore,
          {
            inboundNo: row['Inbound No'] ?? '',
            warehouseId: warehouse.id,
            supplierName: row.Supplier,
            referenceNo: row['Reference No'] ?? '',
            plannedDate: row['Planned Date'] ?? ops.todayInputValue(),
            notes: row.Notes ?? '',
            lineItems: parsedLineItems.lineItems,
          },
          { submitForApproval: true, actor: currentUser },
        );

        workingStore = result.store;
        successCount += 1;
        return;
      }

      if (!row.Destination) {
        errors.push(copyByLocale(locale, `Row ${index + 2}: Destination is required.`, `第 ${index + 2} 行：目的地必填。`));
        return;
      }

      const result = ops.saveOutboundOrder(
        workingStore,
        {
          outboundNo: row['Outbound No'] ?? '',
          warehouseId: warehouse.id,
          destination: row.Destination,
          carrier: row.Carrier ?? '',
          shipmentDate: row['Shipment Date'] ?? ops.todayInputValue(),
          notes: row.Notes ?? '',
          lineItems: parsedLineItems.lineItems,
        },
        { submitForApproval: true, actor: currentUser },
      );

      workingStore = result.store;
      successCount += 1;
    });

    if (successCount > 0) {
      setStore(workingStore);
    }

    setFeedback({
      tone: errors.length > 0 ? 'error' : 'success',
      title: errors.length > 0 ? copyByLocale(locale, 'Import finished with warnings', '导入完成，但存在提醒') : copyByLocale(locale, 'Import completed', '导入完成'),
      detail: copyByLocale(
        locale,
        `${successCount} ${module} orders imported.${errors.length ? ` ${errors.length} rows need review.` : ''}`,
        `成功导入 ${successCount} 条${isInbound ? '入库' : '出库'}订单。${errors.length ? `仍有 ${errors.length} 行需要检查。` : ''}`,
      ),
      errors,
    });

    event.target.value = '';
  }

  function handleExport() {
    const exportRows: SpreadsheetRow[] =
      module === 'inbound'
        ? filteredRecords.filter(isInboundRecord).map((record) => {
            const warehouse = ops.findWarehouse(store, record.warehouseId);
            return {
              'Inbound No': record.inboundNo,
              Warehouse: warehouse?.warehouseCode ?? record.warehouseId,
              Supplier: record.supplierName,
              'Reference No': record.referenceNo,
              'Planned Date': record.plannedDate,
              'Line Items': formatOrderLineItems(record.lineItems, store),
              'Order Status': record.status,
              Approval: record.approvalStatus,
              Notes: record.notes,
            };
          })
        : filteredRecords.filter((record): record is ops.OutboundRecord => !isInboundRecord(record)).map((record) => {
            const warehouse = ops.findWarehouse(store, record.warehouseId);
            return {
              'Outbound No': record.outboundNo,
              Warehouse: warehouse?.warehouseCode ?? record.warehouseId,
              Destination: record.destination,
              Carrier: record.carrier,
              'Shipment Date': record.shipmentDate,
              'Line Items': formatOrderLineItems(record.lineItems, store),
              'Order Status': record.status,
              Approval: record.approvalStatus,
              Notes: record.notes,
            };
          });

    downloadWorkbook(createSheetFileName(`${module}-export`), module === 'inbound' ? 'Inbound' : 'Outbound', exportRows);
  }

  function handleTemplate() {
    downloadWorkbook(createSheetFileName(`${module}-template`), module === 'inbound' ? 'Inbound Template' : 'Outbound Template', [
      module === 'inbound'
        ? {
            'Inbound No': 'INB-2001',
            Warehouse: 'WH-SH-01',
            Supplier: 'North Harbour Metals',
            'Reference No': 'ASN-9001',
            'Planned Date': '2026-03-30',
            'Line Items': 'P-BOLT-A:120 | P-CLAMP-D:24',
            Notes: 'Imported sample inbound request',
          }
        : {
            'Outbound No': 'OUT-3001',
            Warehouse: 'WH-NB-02',
            Destination: 'Hangzhou DC',
            Carrier: 'BlueLine Freight',
            'Shipment Date': '2026-03-30',
            'Line Items': 'P-NUT-B:48',
            Notes: 'Imported sample outbound request',
          },
    ]);
  }

  function quickApprove(id: string) {
    setStore((current) => ops.approveOrder(current, module, id, currentUser));
  }

  function submitReject() {
    if (!detailRecord) {
      return;
    }

    setStore((current) => ops.rejectOrder(current, module, detailRecord.id, rejectReason, currentUser));
    setRejectReason('');
  }

  return (
    <>
      <input ref={inputRef} className="hidden-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />

      <ImportFeedbackBanner feedback={feedback} locale={locale} onClose={() => setFeedback(null)} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={text.searchPlaceholder}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={[
          { value: 'all', label: text.allApprovals },
          { value: 'Pending Approval', label: text.pendingApproval },
          { value: 'Approved', label: text.approved },
          { value: 'Rejected', label: text.rejected },
        ]}
        onImport={() => inputRef.current?.click()}
        onTemplate={handleTemplate}
        onExport={handleExport}
        onNew={() => onNavigate(routes.create)}
        locale={locale}
        newLabel={text.newOrder}
      />

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.listKicker}</p>
            <h2>{text.listTitle}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <span className="admin-inline-note">{formatRecordCount(locale, filteredRecords.length)}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{text.orderNo}</th>
                <th>{text.warehouse}</th>
                <th>{text.partner}</th>
                <th>{text.units}</th>
                <th>{text.orderStatus}</th>
                <th>{text.approval}</th>
                <th>{text.created}</th>
                <th>{text.action}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const warehouse = ops.findWarehouse(store, record.warehouseId);
                const orderNo = isInboundRecord(record) ? record.inboundNo : record.outboundNo;
                const partner = isInboundRecord(record) ? record.supplierName : record.destination;

                return (
                  <tr key={record.id}>
                    <td>{orderNo}</td>
                    <td>{warehouse?.warehouseCode ?? record.warehouseId}</td>
                    <td>{partner}</td>
                    <td>{ops.countOrderUnits(record.lineItems)}</td>
                    <td>
                      <StatusChip label={record.status} locale={locale} />
                    </td>
                    <td>
                      <StatusChip label={record.approvalStatus} locale={locale} tone={getApprovalChipTone(record.approvalStatus)} />
                    </td>
                    <td>{ops.formatShortStamp(record.createdAt, getLocaleTag(locale))}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action"
                          type="button"
                          onClick={() => {
                            setSelections((current) => ({
                              ...current,
                              inboundId: module === 'inbound' ? record.id : current.inboundId,
                              outboundId: module === 'outbound' ? record.id : current.outboundId,
                            }));
                            onNavigate(routes.detail);
                          }}
                        >
                          {text.view}
                        </button>

                        {record.approvalStatus !== 'Approved' ? (
                          <button
                            className="table-action"
                            type="button"
                            onClick={() => {
                              setSelections((current) => ({
                                ...current,
                                inboundId: module === 'inbound' ? record.id : current.inboundId,
                                outboundId: module === 'outbound' ? record.id : current.outboundId,
                              }));
                              onNavigate(routes.edit);
                            }}
                          >
                            {text.edit}
                          </button>
                        ) : null}

                        {record.approvalStatus === 'Pending Approval' && canApprove ? (
                          <button className="table-action table-action--primary" type="button" onClick={() => quickApprove(record.id)}>
                            {text.approve}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 ? <p className="empty-note">{text.emptyList}</p> : null}
      </section>

      {route === routes.detail && detailRecord ? (
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="section-kicker">{text.selectedOrder}</p>
              <h2>{inboundDetailRecord ? inboundDetailRecord.inboundNo : outboundDetailRecord?.outboundNo}</h2>
            </div>

            <div className="admin-toolbar__actions">
              <StatusChip label={detailRecord.status} locale={locale} />
              <StatusChip label={detailRecord.approvalStatus} locale={locale} tone={getApprovalChipTone(detailRecord.approvalStatus)} />
              <button
                className="secondary-button"
                type="button"
                onClick={() => onNavigate(detailRecord.approvalStatus === 'Approved' ? routes.list : routes.edit)}
              >
                {detailRecord.approvalStatus === 'Approved' ? text.backToList : text.editOrder}
              </button>
            </div>
          </div>

          <DetailGrid
            items={
              inboundDetailRecord
                ? [
                    { label: text.warehouse, value: ops.findWarehouse(store, inboundDetailRecord.warehouseId)?.warehouseName ?? inboundDetailRecord.warehouseId },
                    { label: text.supplier, value: inboundDetailRecord.supplierName },
                    { label: text.referenceNo, value: inboundDetailRecord.referenceNo || '--' },
                    { label: text.plannedDate, value: inboundDetailRecord.plannedDate },
                    { label: text.createdBy, value: inboundDetailRecord.createdBy },
                    { label: text.createdAt, value: ops.formatShortStamp(inboundDetailRecord.createdAt, getLocaleTag(locale)) },
                    { label: text.approvalResult, value: getLocalizedStatus(locale, inboundDetailRecord.approvalStatus) },
                    { label: text.approvalBy, value: inboundDetailRecord.approvedBy || '--' },
                    { label: text.approvalAt, value: inboundDetailRecord.approvalUpdatedAt ? ops.formatShortStamp(inboundDetailRecord.approvalUpdatedAt, getLocaleTag(locale)) : '--' },
                  ]
                : [
                    { label: text.warehouse, value: ops.findWarehouse(store, outboundDetailRecord?.warehouseId ?? '')?.warehouseName ?? outboundDetailRecord?.warehouseId ?? '--' },
                    { label: text.destination, value: outboundDetailRecord?.destination ?? '--' },
                    { label: text.carrier, value: outboundDetailRecord?.carrier || '--' },
                    { label: text.shipmentDate, value: outboundDetailRecord?.shipmentDate ?? '--' },
                    { label: text.createdBy, value: outboundDetailRecord?.createdBy ?? '--' },
                    { label: text.createdAt, value: outboundDetailRecord ? ops.formatShortStamp(outboundDetailRecord.createdAt, getLocaleTag(locale)) : '--' },
                    { label: text.approvalResult, value: outboundDetailRecord ? getLocalizedStatus(locale, outboundDetailRecord.approvalStatus) : '--' },
                    { label: text.approvalBy, value: outboundDetailRecord?.approvedBy || '--' },
                    { label: text.approvalAt, value: outboundDetailRecord?.approvalUpdatedAt ? ops.formatShortStamp(outboundDetailRecord.approvalUpdatedAt, getLocaleTag(locale)) : '--' },
                  ]
            }
          />

          <LineItemsTable locale={locale} store={store} lineItems={detailRecord.lineItems} />

          <div className="admin-note-block">
            <strong>{text.orderNotes}</strong>
            <p>{detailRecord.notes || text.noNotes}</p>
          </div>

          {detailRecord.approvalReason ? (
            <div className="admin-note-block admin-note-block--warning">
              <strong>{text.rejectionReason}</strong>
              <p>{detailRecord.approvalReason}</p>
            </div>
          ) : null}

          {detailRecord.approvalStatus !== 'Approved' && canApprove ? (
            <div className="approval-decision-panel">
              <div className="approval-decision-panel__copy">
                <strong>{text.approvalDecision}</strong>
                <p>{text.approvalHint}</p>
              </div>

              <textarea
                className="admin-textarea"
                rows={3}
                value={rejectReason}
                placeholder={text.rejectPlaceholder}
                onChange={(event) => setRejectReason(event.target.value)}
              />

              <div className="admin-toolbar__actions">
                <button className="secondary-button" type="button" onClick={submitReject}>
                  {text.reject}
                </button>
                <button className="primary-button" type="button" onClick={() => quickApprove(detailRecord.id)}>
                  {text.approve}
                </button>
              </div>
            </div>
          ) : detailRecord.approvalStatus !== 'Approved' ? (
            <div className="admin-inline-note">{text.approvalRestricted}</div>
          ) : (
            <div className="admin-inline-note">{text.postedNote}</div>
          )}
        </section>
      ) : null}
    </>
  );
}

function OrderFormWorkspace({
  module,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
  route,
  locale,
  currentUser,
}: OperationalModuleViewProps & { module: OrderModule }) {
  const sourceRecord =
    module === 'inbound'
      ? route === 'inbound-edit'
        ? ops.getSelectedInbound(store, selections)
        : undefined
      : route === 'outbound-edit'
        ? ops.getSelectedOutbound(store, selections)
        : undefined;
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const [formData, setFormData] = useState<ops.InboundFormData | ops.OutboundFormData>(() => {
    if (module === 'inbound') {
      if (sourceRecord && 'supplierName' in sourceRecord) {
        return ops.mapInboundToFormData(sourceRecord);
      }

      const draft = ops.createInboundDraft();
      draft.inboundNo = ops.createInboundNumber(store);
      return draft;
    }

    if (sourceRecord && 'destination' in sourceRecord) {
      return ops.mapOutboundToFormData(sourceRecord);
    }

    const draft = ops.createOutboundDraft();
    draft.outboundNo = ops.createOutboundNumber(store);
    return draft;
  });

  const warehouseOptions = ops.buildWarehouseOptions(store);
  const isInbound = module === 'inbound';
  const text = {
    formKicker: isInbound ? copyByLocale(locale, 'Inbound form', '入库表单') : copyByLocale(locale, 'Outbound form', '出库表单'),
    updateOrder: copyByLocale(locale, 'Update order', '更新订单'),
    createOrder: copyByLocale(locale, 'Create order', '创建订单'),
    back: copyByLocale(locale, 'Back', '返回'),
    saveDraft: copyByLocale(locale, 'Save Draft', '保存草稿'),
    submitForApproval: copyByLocale(locale, 'Submit for Approval', '提交审批'),
    orderNo: isInbound ? copyByLocale(locale, 'Inbound No', '入库单号') : copyByLocale(locale, 'Outbound No', '出库单号'),
    warehouse: copyByLocale(locale, 'Warehouse', '仓库'),
    selectWarehouse: copyByLocale(locale, 'Select warehouse', '选择仓库'),
    supplier: copyByLocale(locale, 'Supplier', '供应商'),
    referenceNo: copyByLocale(locale, 'Reference No', '参考单号'),
    plannedDate: copyByLocale(locale, 'Planned Date', '计划日期'),
    destination: copyByLocale(locale, 'Destination', '目的地'),
    carrier: copyByLocale(locale, 'Carrier', '承运商'),
    shipmentDate: copyByLocale(locale, 'Shipment Date', '发运日期'),
    notes: copyByLocale(locale, 'Notes', '备注'),
    productLines: copyByLocale(locale, 'Product lines', '商品明细'),
    lineItems: copyByLocale(locale, 'Line items', '明细行'),
    addLine: copyByLocale(locale, 'Add line', '新增行'),
    warehouseRequired: copyByLocale(locale, 'Warehouse is required.', '仓库必填。'),
    supplierRequired: copyByLocale(locale, 'Supplier is required.', '供应商必填。'),
    destinationRequired: copyByLocale(locale, 'Destination is required.', '目的地必填。'),
    lineRequired: copyByLocale(locale, 'Add at least one product line.', '至少添加一条商品明细。'),
    cannotSave: copyByLocale(locale, 'Cannot save order', '无法保存订单'),
    resolveIssues: copyByLocale(locale, 'Please resolve the highlighted issues before saving.', '请先处理高亮提示的问题后再保存。'),
  };

  function patchFormData(next: Partial<ops.InboundFormData & ops.OutboundFormData>) {
    setFormData((current) => ({ ...current, ...next }));
  }

  function updateLineItems(lineItems: ops.OrderLineItem[]) {
    setFormData((current) => ({ ...current, lineItems }));
  }

  function validate() {
    const errors: string[] = [];
    const lineItems = formData.lineItems.filter((lineItem) => lineItem.productId && Number(lineItem.quantity) > 0);

    if (!formData.warehouseId) {
      errors.push(text.warehouseRequired);
    }

    if (module === 'inbound' && !('supplierName' in formData ? formData.supplierName.trim() : '')) {
      errors.push(text.supplierRequired);
    }

    if (module === 'outbound' && !('destination' in formData ? formData.destination.trim() : '')) {
      errors.push(text.destinationRequired);
    }

    if (lineItems.length === 0) {
      errors.push(text.lineRequired);
    }

    return errors;
  }

  function save(submitForApproval: boolean) {
    const errors = validate();

    if (errors.length > 0) {
      setFeedback({
        tone: 'error',
        title: text.cannotSave,
        detail: text.resolveIssues,
        errors,
      });
      return;
    }

    if (module === 'inbound') {
      const result = ops.saveInboundOrder(store, formData as ops.InboundFormData, {
        existingId: sourceRecord && 'supplierName' in sourceRecord ? sourceRecord.id : undefined,
        submitForApproval,
        actor: currentUser,
      });

      setStore(result.store);
      setSelections((current) => ({ ...current, inboundId: result.selectionId }));
      onNavigate('inbound-detail');
      return;
    }

    const result = ops.saveOutboundOrder(store, formData as ops.OutboundFormData, {
      existingId: sourceRecord && 'destination' in sourceRecord ? sourceRecord.id : undefined,
      submitForApproval,
      actor: currentUser,
    });

    setStore(result.store);
    setSelections((current) => ({ ...current, outboundId: result.selectionId }));
    onNavigate('outbound-detail');
  }

  return (
    <>
      <ImportFeedbackBanner feedback={feedback} locale={locale} onClose={() => setFeedback(null)} />

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.formKicker}</p>
            <h2>{route.endsWith('-edit') ? text.updateOrder : text.createOrder}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => onNavigate(module === 'inbound' ? 'inbound-list' : 'outbound-list')}
            >
              {text.back}
            </button>
            <button className="secondary-button" type="button" onClick={() => save(false)}>
              {text.saveDraft}
            </button>
            <button className="primary-button" type="button" onClick={() => save(true)}>
              {text.submitForApproval}
            </button>
          </div>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span>{text.orderNo}</span>
            <input
              className="admin-input"
              type="text"
              value={module === 'inbound' ? (formData as ops.InboundFormData).inboundNo : (formData as ops.OutboundFormData).outboundNo}
              onChange={(event) => patchFormData(module === 'inbound' ? { inboundNo: event.target.value } : { outboundNo: event.target.value })}
            />
          </label>

          <label className="form-field">
            <span>{text.warehouse}</span>
            <select className="admin-select" value={formData.warehouseId} onChange={(event) => patchFormData({ warehouseId: event.target.value })}>
              <option value="">{text.selectWarehouse}</option>
              {warehouseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {module === 'inbound' ? (
            <>
              <label className="form-field">
                <span>{text.supplier}</span>
                <input
                  className="admin-input"
                  type="text"
                  value={(formData as ops.InboundFormData).supplierName}
                  onChange={(event) => patchFormData({ supplierName: event.target.value })}
                />
              </label>

              <label className="form-field">
                <span>{text.referenceNo}</span>
                <input
                  className="admin-input"
                  type="text"
                  value={(formData as ops.InboundFormData).referenceNo}
                  onChange={(event) => patchFormData({ referenceNo: event.target.value })}
                />
              </label>

              <label className="form-field">
                <span>{text.plannedDate}</span>
                <input
                  className="admin-input"
                  type="date"
                  value={(formData as ops.InboundFormData).plannedDate}
                  onChange={(event) => patchFormData({ plannedDate: event.target.value })}
                />
              </label>
            </>
          ) : (
            <>
              <label className="form-field">
                <span>{text.destination}</span>
                <input
                  className="admin-input"
                  type="text"
                  value={(formData as ops.OutboundFormData).destination}
                  onChange={(event) => patchFormData({ destination: event.target.value })}
                />
              </label>

              <label className="form-field">
                <span>{text.carrier}</span>
                <input
                  className="admin-input"
                  type="text"
                  value={(formData as ops.OutboundFormData).carrier}
                  onChange={(event) => patchFormData({ carrier: event.target.value })}
                />
              </label>

              <label className="form-field">
                <span>{text.shipmentDate}</span>
                <input
                  className="admin-input"
                  type="date"
                  value={(formData as ops.OutboundFormData).shipmentDate}
                  onChange={(event) => patchFormData({ shipmentDate: event.target.value })}
                />
              </label>
            </>
          )}
        </div>

        <label className="form-field">
          <span>{text.notes}</span>
          <textarea
            className="admin-textarea"
            rows={3}
            value={formData.notes}
            onChange={(event) => patchFormData({ notes: event.target.value })}
          />
        </label>

        <div className="admin-panel__header admin-panel__header--sub">
          <div>
            <p className="section-kicker">{text.productLines}</p>
            <h3>{text.lineItems}</h3>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() => updateLineItems([...formData.lineItems, ops.createEmptyLineItem()])}
          >
            {text.addLine}
          </button>
        </div>

        <LineItemsTable locale={locale} store={store} lineItems={formData.lineItems} editable onChange={updateLineItems} />
      </section>
    </>
  );
}

function ApprovalWorkspace({ store, setStore, selections, setSelections, onNavigate, locale, currentUser }: OperationalModuleViewProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const deferredSearch = useDeferredValue(search);
  const queue = useMemo(() => ops.buildApprovalQueue(store), [store]);
  const text = {
    searchPlaceholder: copyByLocale(locale, 'Search order no, warehouse, partner, or requester', '搜索订单号、仓库、合作方或申请人'),
    allApprovals: copyByLocale(locale, 'All approvals', '全部审批状态'),
    pendingApproval: copyByLocale(locale, 'Pending approval', '待审批'),
    approved: copyByLocale(locale, 'Approved', '已通过'),
    rejected: copyByLocale(locale, 'Rejected', '已驳回'),
    newInbound: copyByLocale(locale, 'New Inbound', '新建入库单'),
    queueKicker: copyByLocale(locale, 'Approval queue', '审批队列'),
    queueTitle: copyByLocale(locale, 'Approval Center', '审批中心'),
    module: copyByLocale(locale, 'Module', '模块'),
    orderNo: copyByLocale(locale, 'Order No', '订单号'),
    warehouse: copyByLocale(locale, 'Warehouse', '仓库'),
    partner: copyByLocale(locale, 'Partner', '合作方'),
    units: copyByLocale(locale, 'Units', '数量'),
    orderStatus: copyByLocale(locale, 'Order Status', '订单状态'),
    approval: copyByLocale(locale, 'Approval', '审批状态'),
    action: copyByLocale(locale, 'Action', '操作'),
    view: copyByLocale(locale, 'View', '查看'),
    approve: copyByLocale(locale, 'Approve', '通过'),
    review: copyByLocale(locale, 'Review', '处理'),
    emptyList: copyByLocale(locale, 'No approval records matched the current filters.', '当前筛选条件下没有匹配的审批记录。'),
    selectedApproval: copyByLocale(locale, 'Selected approval', '当前审批项'),
    openDetail: copyByLocale(locale, 'Open detail', '打开详情'),
    submittedBy: copyByLocale(locale, 'Submitted By', '提交人'),
    submittedAt: copyByLocale(locale, 'Submitted At', '提交时间'),
    approvedBy: copyByLocale(locale, 'Approval By', '审批人'),
    approvedAt: copyByLocale(locale, 'Approval Time', '审批时间'),
    currentRejectionReason: copyByLocale(locale, 'Current rejection reason', '当前驳回原因'),
    decision: copyByLocale(locale, 'Decision', '审批决策'),
    decisionHint: copyByLocale(locale, 'Approved orders will post inventory movement immediately in the current mock store.', '审批通过后会立即在当前 mock 数据中写入库存变动。'),
    rejectionPlaceholder: copyByLocale(locale, 'Enter rejection reason', '填写驳回原因'),
    reject: copyByLocale(locale, 'Reject', '驳回'),
  };

  const filteredQueue = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return queue.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${item.orderNo} ${item.partner} ${item.module} ${item.warehouseCode} ${item.createdBy}`.toLowerCase().includes(normalizedSearch);
      const matchesFilter = filterValue === 'all' || item.approvalStatus === filterValue;

      return matchesSearch && matchesFilter;
    });
  }, [deferredSearch, filterValue, queue]);

  const selectedItem =
    filteredQueue.find((item) => item.key === selections.approvalKey) ??
    queue.find((item) => item.key === selections.approvalKey) ??
    filteredQueue[0] ??
    queue[0];

  function approve(item: ops.ApprovalQueueItem) {
    updateApprovalSelection(setSelections, item);
    setStore((current) => ops.approveOrder(current, item.module === 'Inbound' ? 'inbound' : 'outbound', item.id, currentUser));
  }

  function rejectSelected() {
    if (!selectedItem) {
      return;
    }

    updateApprovalSelection(setSelections, selectedItem);
    setStore((current) =>
      ops.rejectOrder(current, selectedItem.module === 'Inbound' ? 'inbound' : 'outbound', selectedItem.id, rejectReason, currentUser),
    );
    setRejectReason('');
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const rows = await readSpreadsheetFile(file);
    let workingStore = store;
    let successCount = 0;
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const module = (row.Module ?? '').toLowerCase();
      const orderNo = row['Order No'] ?? '';
      const decision = (row.Decision ?? '').toLowerCase();
      const reason = row.Reason ?? '';

      const queueItem = ops.buildApprovalQueue(workingStore).find(
        (item) => item.orderNo.toLowerCase() === orderNo.toLowerCase() && item.module.toLowerCase() === module,
      );

      if (!queueItem) {
        errors.push(copyByLocale(locale, `Row ${index + 2}: matching approval record not found.`, `第 ${index + 2} 行：未找到匹配的审批记录。`));
        return;
      }

      if (decision === 'approve' || decision === 'approved') {
        workingStore = ops.approveOrder(workingStore, queueItem.module === 'Inbound' ? 'inbound' : 'outbound', queueItem.id, currentUser);
        successCount += 1;
        return;
      }

      if (decision === 'reject' || decision === 'rejected') {
        workingStore = ops.rejectOrder(workingStore, queueItem.module === 'Inbound' ? 'inbound' : 'outbound', queueItem.id, reason, currentUser);
        successCount += 1;
        return;
      }

      errors.push(copyByLocale(locale, `Row ${index + 2}: Decision must be approve or reject.`, `第 ${index + 2} 行：审批结果必须为通过或驳回。`));
    });

    if (successCount > 0) {
      setStore(workingStore);
    }

    setFeedback({
      tone: errors.length > 0 ? 'error' : 'success',
      title: errors.length > 0 ? copyByLocale(locale, 'Approval import completed with issues', '审批导入完成，但存在问题') : copyByLocale(locale, 'Approval import completed', '审批导入完成'),
      detail: copyByLocale(
        locale,
        `${successCount} approval rows processed.${errors.length ? ` ${errors.length} rows need review.` : ''}`,
        `已处理 ${successCount} 条审批记录。${errors.length ? `仍有 ${errors.length} 行需要检查。` : ''}`,
      ),
      errors,
    });

    event.target.value = '';
  }

  function handleExport() {
    downloadWorkbook(createSheetFileName('approval-export'), 'Approval Queue', filteredQueue.map((item) => ({
      Module: item.module,
      'Order No': item.orderNo,
      Warehouse: item.warehouseCode,
      Partner: item.partner,
      Units: item.units,
      'Order Status': item.orderStatus,
      Approval: item.approvalStatus,
      'Submitted By': item.createdBy,
      'Submitted At': item.createdAt,
      'Approved By': item.approvedBy,
      'Approval Time': item.approvalUpdatedAt,
      Reason: item.approvalReason,
    })));
  }

  function handleTemplate() {
    downloadWorkbook(createSheetFileName('approval-template'), 'Approval Template', [
      {
        Module: 'Inbound',
        'Order No': 'INB-1048',
        Decision: 'Approve',
        Reason: '',
      },
    ]);
  }

  return (
    <>
      <input ref={inputRef} className="hidden-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />

      <ImportFeedbackBanner feedback={feedback} locale={locale} onClose={() => setFeedback(null)} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={text.searchPlaceholder}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={[
          { value: 'all', label: text.allApprovals },
          { value: 'Pending Approval', label: text.pendingApproval },
          { value: 'Approved', label: text.approved },
          { value: 'Rejected', label: text.rejected },
        ]}
        onImport={() => inputRef.current?.click()}
        onTemplate={handleTemplate}
        onExport={handleExport}
        onNew={() => onNavigate('inbound-create')}
        locale={locale}
        newLabel={text.newInbound}
      />

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.queueKicker}</p>
            <h2>{text.queueTitle}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <span className="admin-inline-note">{formatRecordCount(locale, filteredQueue.length)}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{text.module}</th>
                <th>{text.orderNo}</th>
                <th>{text.warehouse}</th>
                <th>{text.partner}</th>
                <th>{text.units}</th>
                <th>{text.orderStatus}</th>
                <th>{text.approval}</th>
                <th>{text.action}</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((item) => (
                <tr key={item.key}>
                  <td>{getLocalizedModule(locale, item.module)}</td>
                  <td>{item.orderNo}</td>
                  <td>{item.warehouseCode}</td>
                  <td>{item.partner}</td>
                  <td>{item.units}</td>
                  <td>
                    <StatusChip label={item.orderStatus} locale={locale} />
                  </td>
                  <td>
                    <StatusChip label={item.approvalStatus} locale={locale} tone={getApprovalChipTone(item.approvalStatus)} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-action"
                        type="button"
                        onClick={() => {
                          updateApprovalSelection(setSelections, item);
                          onNavigate(item.module === 'Inbound' ? 'inbound-detail' : 'outbound-detail');
                        }}
                      >
                        {text.view}
                      </button>
                      {item.approvalStatus === 'Pending Approval' ? (
                        <button className="table-action table-action--primary" type="button" onClick={() => approve(item)}>
                          {text.approve}
                        </button>
                      ) : null}
                      <button
                        className="table-action"
                        type="button"
                        onClick={() => {
                          updateApprovalSelection(setSelections, item);
                          setRejectReason(item.approvalReason);
                        }}
                      >
                        {text.review}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQueue.length === 0 ? <p className="empty-note">{text.emptyList}</p> : null}
      </section>

      {selectedItem ? (
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="section-kicker">{text.selectedApproval}</p>
              <h2>{selectedItem.orderNo}</h2>
            </div>

            <div className="admin-toolbar__actions">
              <StatusChip label={selectedItem.approvalStatus} locale={locale} tone={getApprovalChipTone(selectedItem.approvalStatus)} />
              <button
                className="secondary-button"
                type="button"
                onClick={() => onNavigate(selectedItem.module === 'Inbound' ? 'inbound-detail' : 'outbound-detail')}
              >
                {text.openDetail}
              </button>
            </div>
          </div>

          <DetailGrid
            items={[
              { label: text.module, value: getLocalizedModule(locale, selectedItem.module) },
              { label: text.warehouse, value: selectedItem.warehouseName },
              { label: text.partner, value: selectedItem.partner },
              { label: text.units, value: String(selectedItem.units) },
              { label: text.submittedBy, value: selectedItem.createdBy },
              { label: text.submittedAt, value: ops.formatShortStamp(selectedItem.createdAt, getLocaleTag(locale)) },
              { label: text.approvedBy, value: selectedItem.approvedBy || '--' },
              { label: text.approvedAt, value: selectedItem.approvalUpdatedAt ? ops.formatShortStamp(selectedItem.approvalUpdatedAt, getLocaleTag(locale)) : '--' },
            ]}
          />

          {selectedItem.approvalReason ? (
            <div className="admin-note-block admin-note-block--warning">
              <strong>{text.currentRejectionReason}</strong>
              <p>{selectedItem.approvalReason}</p>
            </div>
          ) : null}

          <div className="approval-decision-panel">
            <div className="approval-decision-panel__copy">
              <strong>{text.decision}</strong>
              <p>{text.decisionHint}</p>
            </div>

            <textarea
              className="admin-textarea"
              rows={3}
              value={rejectReason}
              placeholder={text.rejectionPlaceholder}
              onChange={(event) => setRejectReason(event.target.value)}
            />

            <div className="admin-toolbar__actions">
              <button className="secondary-button" type="button" onClick={rejectSelected}>
                {text.reject}
              </button>
              <button className="primary-button" type="button" onClick={() => approve(selectedItem)}>
                {text.approve}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function UserManagementWorkspace({ store, setStore, selections, setSelections, locale, currentUser }: OperationalModuleViewProps) {
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const deferredSearch = useDeferredValue(search);
  const adminCount = store.users.filter((user) => user.role === 'Admin').length;
  const text = {
    searchPlaceholder: copyByLocale(locale, 'Search name or email', '搜索姓名或邮箱'),
    allRoles: copyByLocale(locale, 'All roles', '全部角色'),
    admin: copyByLocale(locale, 'Admin', '管理员'),
    staff: copyByLocale(locale, 'Staff', '员工'),
    inviteStaff: copyByLocale(locale, 'Invite Staff', '邀请员工'),
    export: copyByLocale(locale, 'Export', '导出'),
    usersKicker: copyByLocale(locale, 'Access control', '权限控制'),
    usersTitle: copyByLocale(locale, 'User Management', '用户管理'),
    name: copyByLocale(locale, 'Name', '姓名'),
    email: copyByLocale(locale, 'Email', '邮箱'),
    role: copyByLocale(locale, 'Role', '角色'),
    status: copyByLocale(locale, 'Status', '状态'),
    lastLogin: copyByLocale(locale, 'Last Login', '最近登录'),
    action: copyByLocale(locale, 'Action', '操作'),
    view: copyByLocale(locale, 'View', '查看'),
    makeAdmin: copyByLocale(locale, 'Make Admin', '设为管理员'),
    makeStaff: copyByLocale(locale, 'Set Staff', '设为员工'),
    selectedUser: copyByLocale(locale, 'Selected user', '当前用户'),
    appointedBy: copyByLocale(locale, 'Appointed By', '任命人'),
    appointedAt: copyByLocale(locale, 'Appointed At', '任命时间'),
    permissionsUpdatedAt: copyByLocale(locale, 'Permission Updated', '权限更新时间'),
    roleSummary: copyByLocale(
      locale,
      'Admins can approve orders, manage user roles, and appoint other administrators. Staff can view and edit operational data only.',
      '管理员可审批订单、管理用户角色并任命其他管理员；员工仅可查看和编辑业务数据。',
    ),
    selfGuard: copyByLocale(locale, 'The last admin cannot remove their own admin access.', '最后一位管理员不能移除自己的管理员权限。'),
    emptyList: copyByLocale(locale, 'No users matched the current filters.', '当前筛选条件下没有匹配的用户。'),
    inviteSuccess: copyByLocale(locale, 'Staff account created', '员工账号已创建'),
    inviteDetail: copyByLocale(locale, 'A new staff profile was added to the mock workspace.', '新的员工账号已添加到当前 mock 工作区。'),
    roleUpdated: copyByLocale(locale, 'Role updated', '角色已更新'),
    roleUpdatedDetail: copyByLocale(locale, 'User permissions were updated in the mock workspace.', '当前 mock 工作区中的用户权限已更新。'),
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return store.users.filter((user) => {
      const matchesSearch = normalizedSearch.length === 0 || `${user.name} ${user.email}`.toLowerCase().includes(normalizedSearch);
      const matchesRole = filterValue === 'all' || user.role === filterValue;
      return matchesSearch && matchesRole;
    });
  }, [deferredSearch, filterValue, store.users]);

  const selectedUser =
    filteredUsers.find((user) => user.id === selections.userId) ??
    store.users.find((user) => user.id === selections.userId) ??
    filteredUsers[0] ??
    store.users[0];

  function selectUser(userId: string) {
    setSelections((current) => ({ ...current, userId }));
  }

  function inviteStaff() {
    const nextIndex = store.users.length + 1;
    const result = ops.registerWorkspaceUser(
      store,
      {
        email: `staff${nextIndex}@northline.com`,
        name: locale === 'zh' ? `新员工 ${nextIndex}` : `Team Member ${nextIndex}`,
      },
      currentUser,
    );

    setStore(result.store);
    selectUser(result.user.id);
    setFeedback({
      tone: 'success',
      title: text.inviteSuccess,
      detail: text.inviteDetail,
    });
  }

  function exportUsers() {
    downloadWorkbook(
      createSheetFileName('users-export'),
      'Users',
      filteredUsers.map((user) => ({
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Status: user.status,
        'Appointed By': user.appointedBy,
        'Appointed At': user.appointedAt,
        'Permission Updated': user.permissionsUpdatedAt,
        'Last Login': user.lastLoginAt,
      })),
    );
  }

  function changeRole(user: ops.WorkspaceUser, nextRole: ops.UserRole) {
    const nextStore = ops.updateUserRole(store, user.id, nextRole, currentUser);

    if (nextStore === store) {
      setFeedback({
        tone: 'error',
        title: text.role,
        detail: text.selfGuard,
      });
      return;
    }

    setStore(nextStore);
    selectUser(user.id);
    setFeedback({
      tone: 'success',
      title: text.roleUpdated,
      detail: text.roleUpdatedDetail,
    });
  }

  return (
    <>
      <ImportFeedbackBanner feedback={feedback} locale={locale} onClose={() => setFeedback(null)} />

      <section className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <input
            className="admin-input"
            type="search"
            value={search}
            placeholder={text.searchPlaceholder}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select className="admin-select" value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
            <option value="all">{text.allRoles}</option>
            <option value="Admin">{text.admin}</option>
            <option value="Staff">{text.staff}</option>
          </select>
        </div>

        <div className="admin-toolbar__actions">
          <button className="secondary-button" type="button" onClick={exportUsers}>
            {text.export}
          </button>
          <button className="primary-button" type="button" onClick={inviteStaff}>
            {text.inviteStaff}
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="section-kicker">{text.usersKicker}</p>
            <h2>{text.usersTitle}</h2>
          </div>

          <div className="admin-toolbar__actions">
            <span className="admin-inline-note">{formatRecordCount(locale, filteredUsers.length)}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{text.name}</th>
                <th>{text.email}</th>
                <th>{text.role}</th>
                <th>{text.status}</th>
                <th>{text.lastLogin}</th>
                <th>{text.action}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-chip ${user.role === 'Admin' ? 'status-chip--info' : 'status-chip--muted'}`}>
                      {getLocalizedRole(locale, user.role)}
                    </span>
                  </td>
                  <td>
                    <StatusChip label={user.status} locale={locale} tone={user.status === 'Active' ? 'positive' : 'muted'} />
                  </td>
                  <td>{ops.formatShortStamp(user.lastLoginAt, getLocaleTag(locale))}</td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action" type="button" onClick={() => selectUser(user.id)}>
                        {text.view}
                      </button>
                      {user.role === 'Staff' ? (
                        <button className="table-action table-action--primary" type="button" onClick={() => changeRole(user, 'Admin')}>
                          {text.makeAdmin}
                        </button>
                      ) : user.id !== currentUser.id || adminCount > 1 ? (
                        <button className="table-action" type="button" onClick={() => changeRole(user, 'Staff')}>
                          {text.makeStaff}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 ? <p className="empty-note">{text.emptyList}</p> : null}
      </section>

      {selectedUser ? (
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="section-kicker">{text.selectedUser}</p>
              <h2>{selectedUser.name}</h2>
            </div>

            <div className="admin-toolbar__actions">
              <span className={`status-chip ${selectedUser.role === 'Admin' ? 'status-chip--info' : 'status-chip--muted'}`}>
                {getLocalizedRole(locale, selectedUser.role)}
              </span>
              <StatusChip label={selectedUser.status} locale={locale} tone={selectedUser.status === 'Active' ? 'positive' : 'muted'} />
            </div>
          </div>

          <DetailGrid
            items={[
              { label: text.name, value: selectedUser.name },
              { label: text.email, value: selectedUser.email },
              { label: text.role, value: getLocalizedRole(locale, selectedUser.role) },
              { label: text.status, value: getLocalizedStatus(locale, selectedUser.status) },
              { label: text.appointedBy, value: selectedUser.appointedBy },
              { label: text.appointedAt, value: ops.formatShortStamp(selectedUser.appointedAt, getLocaleTag(locale)) },
              { label: text.permissionsUpdatedAt, value: ops.formatShortStamp(selectedUser.permissionsUpdatedAt, getLocaleTag(locale)) },
              { label: text.lastLogin, value: ops.formatShortStamp(selectedUser.lastLoginAt, getLocaleTag(locale)) },
            ]}
          />

          <div className="admin-note-block">
            <strong>{text.role}</strong>
            <p>{text.roleSummary}</p>
          </div>

          {selectedUser.role === 'Admin' && selectedUser.id === currentUser.id && adminCount <= 1 ? (
            <div className="admin-inline-note">{text.selfGuard}</div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
