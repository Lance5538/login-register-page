import { useDeferredValue, useEffect, useId, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { ModulePage, Route, SummaryItem, WorkspaceRoute } from './content';
import * as ops from './operations';
import type {
  CategoryFormData,
  InboundFormData,
  OperationalModuleKey,
  OperationalSelections,
  OrderLineItem,
  OutboundFormData,
  ProductFormData,
  SearchOption,
  WorkspaceStore,
} from './operations';

type OperationalModuleViewProps = {
  route: WorkspaceRoute;
  page: ModulePage;
  store: WorkspaceStore;
  setStore: Dispatch<SetStateAction<WorkspaceStore>>;
  selections: OperationalSelections;
  setSelections: Dispatch<SetStateAction<OperationalSelections>>;
  onNavigate: (route: Route) => void;
};

type ErrorMap = Record<string, string>;
type TouchedMap = Record<string, boolean>;
type MasterDataModule = Extract<OperationalModuleKey, 'product' | 'category'>;
type WarehouseFlowModule = Extract<OperationalModuleKey, 'inbound' | 'outbound'>;
type WarehouseFlowMetric = {
  label: string;
  value: string;
};
type WarehouseFlowFact = {
  label: string;
  value: string;
};
type WarehouseFlowSnapshot = {
  title: string;
  status: string;
  detail: string;
  metrics: WarehouseFlowMetric[];
  facts: WarehouseFlowFact[];
};
type WarehouseFlowStep = {
  label: string;
  detail: string;
  state: 'done' | 'active' | 'pending';
};

const detailRouteByModule: Record<OperationalModuleKey, WorkspaceRoute> = {
  product: 'product-detail',
  category: 'category-detail',
  inbound: 'inbound-detail',
  outbound: 'outbound-detail',
};

const editRouteByModule: Record<OperationalModuleKey, WorkspaceRoute> = {
  product: 'product-edit',
  category: 'category-edit',
  inbound: 'inbound-edit',
  outbound: 'outbound-edit',
};

export default function OperationalModuleView({
  route,
  page,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
}: OperationalModuleViewProps) {
  const module = ops.getOperationalModule(route);

  if (!module) {
    return null;
  }

  const summary = resolveSummary(route, page.summary, store, selections);

  return (
    <>
      <section className="summary-strip" aria-label={`${page.title} summary`}>
        {summary.map((item) => (
          <div className="summary-item" key={item.label}>
            <span className="summary-item__label">{item.label}</span>
            <strong className="summary-item__value">{item.value}</strong>
            <p className="summary-item__detail">{item.detail}</p>
          </div>
        ))}
      </section>

      {page.kind === 'list' ? (
        <OperationalListPage
          module={module}
          page={page}
          store={store}
          selections={selections}
          setSelections={setSelections}
          onNavigate={onNavigate}
        />
      ) : page.kind === 'detail' ? (
        <OperationalDetailPage
          module={module}
          page={page}
          store={store}
          selections={selections}
          setSelections={setSelections}
          onNavigate={onNavigate}
        />
      ) : route === 'product-create' || route === 'product-edit' ? (
        <ProductFormPage
          mode={page.formMode ?? 'create'}
          page={page}
          store={store}
          setStore={setStore}
          selections={selections}
          setSelections={setSelections}
          onNavigate={onNavigate}
        />
      ) : route === 'category-create' || route === 'category-edit' ? (
        <CategoryFormPage
          mode={page.formMode ?? 'create'}
          page={page}
          store={store}
          setStore={setStore}
          selections={selections}
          setSelections={setSelections}
          onNavigate={onNavigate}
        />
      ) : route === 'inbound-create' || route === 'inbound-edit' ? (
        <InboundFormPage
          mode={page.formMode ?? 'create'}
          page={page}
          store={store}
          setStore={setStore}
          selections={selections}
          setSelections={setSelections}
          onNavigate={onNavigate}
        />
      ) : (
        <OutboundFormPage
          mode={page.formMode ?? 'create'}
          page={page}
          store={store}
          setStore={setStore}
          selections={selections}
          setSelections={setSelections}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}

function resolveSummary(
  route: WorkspaceRoute,
  fallback: SummaryItem[],
  store: WorkspaceStore,
  selections: OperationalSelections,
) {
  switch (route) {
    case 'product-list':
      return ops.buildProductListSummary(store);
    case 'product-detail':
    case 'product-edit':
      return ops.buildProductDetailSummary(store, selections);
    case 'category-list':
      return ops.buildCategoryListSummary(store);
    case 'category-detail':
    case 'category-edit':
      return ops.buildCategoryDetailSummary(store, selections);
    case 'inbound-list':
      return ops.buildInboundListSummary(store);
    case 'inbound-detail':
    case 'inbound-edit':
      return ops.buildInboundDetailSummary(store, selections);
    case 'outbound-list':
      return ops.buildOutboundListSummary(store);
    case 'outbound-detail':
    case 'outbound-edit':
      return ops.buildOutboundDetailSummary(store, selections);
    default:
      return fallback;
  }
}

function OperationalListPage({
  module,
  page,
  store,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'selections' | 'setSelections' | 'onNavigate'> & {
  module: OperationalModuleKey;
}) {
  const { recordIds, rows } = buildListData(module, store);
  const options = ops.buildSelectionOptions(store, module);
  const currentSelection = options.find((option) => option.value === getSelectedRecordId(module, selections));

  if (isWarehouseFlowModule(module)) {
    return (
      <WarehouseFlowListPage
        module={module}
        page={page}
        store={store}
        selections={selections}
        setSelections={setSelections}
        onNavigate={onNavigate}
        recordIds={recordIds}
        rows={rows}
        options={options}
      />
    );
  }

  if (isMasterDataModule(module)) {
    return (
      <MasterDataListPage
        module={module}
        page={page}
        store={store}
        selections={selections}
        setSelections={setSelections}
        onNavigate={onNavigate}
        recordIds={recordIds}
        rows={rows}
        options={options}
      />
    );
  }

  return (
    <section className="workspace-layout">
      <section className="page-panel page-panel--main">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Operational queue</p>
            <h2>{page.title}</h2>
          </div>
          <p className="section-copy">Use the list for fast scanning, then jump directly into detail or edit without leaving the current module flow.</p>
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

        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                {page.columns?.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const recordId = recordIds[index];

                return (
                  <tr key={recordId}>
                    {page.columns?.map((column) => (
                      <td key={column.key}>{renderTableCell(column.key, row[column.key] ?? '--')}</td>
                    ))}
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action-link"
                          type="button"
                          onClick={() => {
                            setRecordSelection(module, recordId, setSelections);
                            onNavigate(detailRouteByModule[module]);
                          }}
                        >
                          View
                        </button>
                        <button
                          className="table-action-link table-action-link--accent"
                          type="button"
                          onClick={() => {
                            setRecordSelection(module, recordId, setSelections);
                            onNavigate(editRouteByModule[module]);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <RailFrame page={page} onNavigate={onNavigate}>
        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Current selection</p>
              <h2>{currentSelection?.label ?? 'No record selected'}</h2>
            </div>
            <p className="section-copy">The list keeps one active record ready for detail and edit flows.</p>
          </div>

          <SelectionPreview
            title={currentSelection?.label ?? 'Select a record'}
            detail={currentSelection?.detail ?? 'Choose any record from the table or picker.'}
            tone={getSelectionTone(module, store, selections)}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Quick jump</p>
              <h2>Switch record</h2>
            </div>
          </div>

          <SearchSelectField
            label="Selected record"
            value={getSelectedRecordId(module, selections)}
            options={options}
            onChange={(value) => {
              setRecordSelection(module, value, setSelections);
            }}
            placeholder={`Search ${page.entityLabel.toLowerCase()}`}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Queue notes</p>
              <h2>Use for speed</h2>
            </div>
          </div>

          <ul className="mono-list">
            {getListRailNotes(module).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </RailFrame>
    </section>
  );
}

function OperationalDetailPage({
  module,
  page,
  store,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'selections' | 'setSelections' | 'onNavigate'> & {
  module: OperationalModuleKey;
}) {
  const detailSection = buildDetailSection(module, store, selections);
  const options = ops.buildSelectionOptions(store, module);
  const selectedOption = options.find((option) => option.value === getSelectedRecordId(module, selections));

  if (isWarehouseFlowModule(module)) {
    return (
      <WarehouseFlowDetailPage
        module={module}
        page={page}
        store={store}
        selections={selections}
        setSelections={setSelections}
        onNavigate={onNavigate}
        detailSection={detailSection}
        options={options}
      />
    );
  }

  if (isMasterDataModule(module)) {
    return (
      <MasterDataDetailPage
        module={module}
        page={page}
        store={store}
        selections={selections}
        setSelections={setSelections}
        onNavigate={onNavigate}
        detailSection={detailSection}
        options={options}
      />
    );
  }

  return (
    <section className="workspace-layout">
      <section className="page-panel page-panel--main">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Detail page</p>
            <h2>{page.title}</h2>
          </div>
          <p className="section-copy">The selected record stays synced with the list and edit form so the mock workflow feels continuous.</p>
        </div>

        <div className="detail-groups">
          {detailSection.groups.map((group) => (
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

        {detailSection.lineItems?.length ? (
          <section className="detail-slab">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Item details</p>
                <h2>Linked line items</h2>
              </div>
              <p className="section-copy">Product code and unit stay linked to the selected master data so operators can verify the order quickly.</p>
            </div>

            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Product Code</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {detailSection.lineItems.map((lineItem) => (
                    <tr key={lineItem.id}>
                      <td>{lineItem.productName}</td>
                      <td>{lineItem.productCode}</td>
                      <td>{lineItem.quantity}</td>
                      <td>{lineItem.unit}</td>
                      <td>{lineItem.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {detailSection.notes ? (
          <section className="detail-slab detail-slab--notes">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Notes</p>
                <h2>{detailSection.notesLabel ?? 'Notes'}</h2>
              </div>
            </div>
            <p className="section-copy">{detailSection.notes}</p>
          </section>
        ) : null}
      </section>

      <RailFrame page={page} onNavigate={onNavigate}>
        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Selected record</p>
              <h2>{selectedOption?.label ?? page.entityLabel}</h2>
            </div>
            <p className="section-copy">Switch the current record without leaving the detail workspace.</p>
          </div>

          <SearchSelectField
            label="Current record"
            value={getSelectedRecordId(module, selections)}
            options={options}
            onChange={(value) => {
              setRecordSelection(module, value, setSelections);
            }}
            placeholder={`Search ${page.entityLabel.toLowerCase()}`}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Workflow notes</p>
              <h2>Stay aligned</h2>
            </div>
          </div>

          <ul className="mono-list">
            {getDetailRailNotes(module).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </RailFrame>
    </section>
  );
}

function isWarehouseFlowModule(module: OperationalModuleKey): module is WarehouseFlowModule {
  return module === 'inbound' || module === 'outbound';
}

function getWarehouseFlowConfig(module: WarehouseFlowModule) {
  if (module === 'inbound') {
    return {
      queueKicker: 'Receiving queue',
      queueDescription: 'Start from the live receipt queue. Select one order to review, edit, or continue processing.',
      detailKicker: 'Receipt workspace',
      detailDescription: 'Review the selected receipt header, product lines, and confirmation state in one place.',
      formKicker: 'Receipt setup',
      formDescription: 'Complete the header first, then add product lines before final confirmation.',
      primaryCreateLabel: 'New receipt',
      reviewLabel: 'Review selected',
      editLabel: 'Edit receipt',
      backLabel: 'Back to queue',
      selectedLabel: 'Selected receipt',
      switchLabel: 'Receipt record',
      partnerLabel: 'Supplier',
      dateLabel: 'Planned date',
      extraLabel: 'Reference no.',
      emptyPartner: 'Pending supplier',
      emptyWarehouse: 'Select warehouse',
      formLead: 'Choose warehouse, supplier, and date before adding receipt lines.',
      confirmLabel: 'Confirm Receipt',
    };
  }

  return {
    queueKicker: 'Dispatch queue',
    queueDescription: 'Start from the live shipment queue. Select one order to review, edit, or continue processing.',
    detailKicker: 'Shipment workspace',
    detailDescription: 'Review the selected shipment header, product lines, and dispatch state in one place.',
    formKicker: 'Shipment setup',
    formDescription: 'Complete the header first, then add product lines before final confirmation.',
    primaryCreateLabel: 'New shipment',
    reviewLabel: 'Review selected',
    editLabel: 'Edit shipment',
    backLabel: 'Back to queue',
    selectedLabel: 'Selected shipment',
    switchLabel: 'Shipment record',
    partnerLabel: 'Destination',
    dateLabel: 'Ship date',
    extraLabel: 'Carrier',
    emptyPartner: 'Pending destination',
    emptyWarehouse: 'Select warehouse',
    formLead: 'Choose warehouse, destination, and ship date before adding shipment lines.',
    confirmLabel: 'Confirm Shipment',
  };
}

function getWarehouseFlowRecord(module: WarehouseFlowModule, store: WorkspaceStore, selections: OperationalSelections) {
  return module === 'inbound' ? ops.getSelectedInbound(store, selections) : ops.getSelectedOutbound(store, selections);
}

function buildWarehouseFlowSnapshot(
  module: WarehouseFlowModule,
  store: WorkspaceStore,
  record: WorkspaceStore['inboundOrders'][number] | WorkspaceStore['outboundOrders'][number],
): WarehouseFlowSnapshot {
  const config = getWarehouseFlowConfig(module);
  const warehouse = ops.findWarehouse(store, record.warehouseId);
  const warehouseCode = warehouse?.warehouseCode ?? record.warehouseId;
  const warehouseName = warehouse?.warehouseName ?? record.warehouseId;

  if (module === 'inbound') {
    const inboundRecord = record as WorkspaceStore['inboundOrders'][number];

    return {
      title: inboundRecord.inboundNo,
      status: inboundRecord.status,
      detail: `${inboundRecord.supplierName || config.emptyPartner} · ${warehouseName}`,
      metrics: [
        { label: 'Warehouse', value: warehouseCode },
        { label: config.partnerLabel, value: inboundRecord.supplierName || config.emptyPartner },
        { label: 'Lines', value: String(ops.countLineItems(inboundRecord.lineItems)).padStart(2, '0') },
        { label: 'Qty total', value: String(sumQuantities(inboundRecord.lineItems)) },
      ],
      facts: [
        { label: config.dateLabel, value: inboundRecord.plannedDate || 'Pending' },
        { label: config.extraLabel, value: inboundRecord.referenceNo || '--' },
        { label: 'Created by', value: inboundRecord.createdBy },
        { label: 'Confirmed', value: inboundRecord.confirmedAt ? ops.formatLongDate(inboundRecord.confirmedAt) : 'Pending' },
      ],
    };
  }

  const outboundRecord = record as WorkspaceStore['outboundOrders'][number];

  return {
    title: outboundRecord.outboundNo,
    status: outboundRecord.status,
    detail: `${outboundRecord.destination || config.emptyPartner} · ${warehouseName}`,
    metrics: [
      { label: 'Warehouse', value: warehouseCode },
      { label: config.partnerLabel, value: outboundRecord.destination || config.emptyPartner },
      { label: 'Lines', value: String(ops.countLineItems(outboundRecord.lineItems)).padStart(2, '0') },
      { label: 'Qty total', value: String(sumQuantities(outboundRecord.lineItems)) },
    ],
    facts: [
      { label: config.dateLabel, value: outboundRecord.shipmentDate || 'Pending' },
      { label: config.extraLabel, value: outboundRecord.carrier || '--' },
      { label: 'Created by', value: outboundRecord.createdBy },
      { label: 'Confirmed', value: outboundRecord.confirmedAt ? ops.formatLongDate(outboundRecord.confirmedAt) : 'Pending' },
    ],
  };
}

function buildInboundFormSnapshot(formData: InboundFormData, store: WorkspaceStore): WarehouseFlowSnapshot {
  const config = getWarehouseFlowConfig('inbound');
  const warehouse = ops.findWarehouse(store, formData.warehouseId);

  return {
    title: formData.inboundNo || 'New receipt',
    status: formData.status,
    detail: `${formData.supplierName.trim() || config.emptyPartner} · ${warehouse?.warehouseName ?? config.emptyWarehouse}`,
    metrics: [
      { label: 'Warehouse', value: warehouse?.warehouseCode ?? '--' },
      { label: config.partnerLabel, value: formData.supplierName.trim() || config.emptyPartner },
      { label: 'Lines', value: String(ops.countLineItems(formData.lineItems)).padStart(2, '0') },
      { label: 'Qty total', value: String(sumQuantities(formData.lineItems)) },
    ],
    facts: [
      { label: config.dateLabel, value: formData.plannedDate || 'Pending' },
      { label: config.extraLabel, value: formData.referenceNo.trim() || '--' },
    ],
  };
}

function buildOutboundFormSnapshot(formData: OutboundFormData, store: WorkspaceStore): WarehouseFlowSnapshot {
  const config = getWarehouseFlowConfig('outbound');
  const warehouse = ops.findWarehouse(store, formData.warehouseId);

  return {
    title: formData.outboundNo || 'New shipment',
    status: formData.status,
    detail: `${formData.destination.trim() || config.emptyPartner} · ${warehouse?.warehouseName ?? config.emptyWarehouse}`,
    metrics: [
      { label: 'Warehouse', value: warehouse?.warehouseCode ?? '--' },
      { label: config.partnerLabel, value: formData.destination.trim() || config.emptyPartner },
      { label: 'Lines', value: String(ops.countLineItems(formData.lineItems)).padStart(2, '0') },
      { label: 'Qty total', value: String(sumQuantities(formData.lineItems)) },
    ],
    facts: [
      { label: config.dateLabel, value: formData.shipmentDate || 'Pending' },
      { label: config.extraLabel, value: formData.carrier.trim() || '--' },
    ],
  };
}

function hasReadyLineItem(lineItems: OrderLineItem[]) {
  return lineItems.some((lineItem) => Boolean(lineItem.productId) && Number(lineItem.quantity) > 0);
}

function buildInboundFormSteps(formData: InboundFormData): WarehouseFlowStep[] {
  const headerReady = Boolean(formData.warehouseId && formData.supplierName.trim() && formData.plannedDate.trim());
  const linesReady = hasReadyLineItem(formData.lineItems);

  return [
    {
      label: '1. Header',
      detail: 'Warehouse, supplier, date',
      state: headerReady ? 'done' : 'active',
    },
    {
      label: '2. Lines',
      detail: 'Add at least one receipt line',
      state: headerReady ? (linesReady ? 'done' : 'active') : 'pending',
    },
    {
      label: '3. Confirm',
      detail: 'Finalize the receipt',
      state: formData.status === 'Confirmed' ? 'done' : headerReady && linesReady ? 'active' : 'pending',
    },
  ];
}

function buildOutboundFormSteps(formData: OutboundFormData): WarehouseFlowStep[] {
  const headerReady = Boolean(formData.warehouseId && formData.destination.trim() && formData.shipmentDate.trim());
  const linesReady = hasReadyLineItem(formData.lineItems);

  return [
    {
      label: '1. Header',
      detail: 'Warehouse, destination, date',
      state: headerReady ? 'done' : 'active',
    },
    {
      label: '2. Lines',
      detail: 'Add at least one shipment line',
      state: headerReady ? (linesReady ? 'done' : 'active') : 'pending',
    },
    {
      label: '3. Confirm',
      detail: 'Release the shipment',
      state: formData.status === 'Shipped' ? 'done' : headerReady && linesReady ? 'active' : 'pending',
    },
  ];
}

function WarehouseFlowHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="warehouse-flow-header">
      <div className="warehouse-flow-header__copy">
        <p className="section-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="section-copy">{description}</p>
      </div>

      {actions ? <div className="warehouse-flow-header__actions">{actions}</div> : null}
    </section>
  );
}

function WarehouseFlowSpotlight({ kicker, snapshot }: { kicker: string; snapshot: WarehouseFlowSnapshot }) {
  return (
    <section className="warehouse-flow-spotlight">
      <div className="warehouse-flow-spotlight__lead">
        <div className="warehouse-flow-spotlight__eyebrow">
          <p className="section-kicker">{kicker}</p>
          <StatusPill value={snapshot.status} />
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

function WarehouseFlowFacts({ facts }: { facts: WarehouseFlowFact[] }) {
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

function WarehouseFlowSteps({ items }: { items: WarehouseFlowStep[] }) {
  return (
    <section className="warehouse-flow-steps" aria-label="Workflow progress">
      {items.map((item) => (
        <div className={`warehouse-flow-step warehouse-flow-step--${item.state}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.detail}</strong>
        </div>
      ))}
    </section>
  );
}

function WarehouseFlowListPage({
  module,
  page,
  store,
  selections,
  setSelections,
  onNavigate,
  recordIds,
  rows,
  options,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'selections' | 'setSelections' | 'onNavigate'> & {
  module: WarehouseFlowModule;
  recordIds: string[];
  rows: Record<string, string>[];
  options: SearchOption[];
}) {
  const config = getWarehouseFlowConfig(module);
  const selectedRecordId = getSelectedRecordId(module, selections);
  const selectedRecord = getWarehouseFlowRecord(module, store, selections);
  const spotlight = buildWarehouseFlowSnapshot(module, store, selectedRecord);

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={config.queueKicker}
          title={page.title}
          description={config.queueDescription}
          actions={
            <>
              <button className="primary-button" type="button" onClick={() => onNavigate(module === 'inbound' ? 'inbound-create' : 'outbound-create')}>
                {config.primaryCreateLabel}
              </button>
              <button className="secondary-button" type="button" onClick={() => onNavigate(detailRouteByModule[module])}>
                {config.reviewLabel}
              </button>
              <button className="ghost-link" type="button" onClick={() => onNavigate(editRouteByModule[module])}>
                {config.editLabel}
              </button>
            </>
          }
        />

        <WarehouseFlowSpotlight kicker={config.selectedLabel} snapshot={spotlight} />

        <div className="table-wrap table-wrap--warehouse">
          <table className="orders-table orders-table--warehouse">
            <thead>
              <tr>
                {page.columns?.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const recordId = recordIds[index];
                const isSelected = recordId === selectedRecordId;

                return (
                  <tr
                    key={recordId}
                    className={`orders-table__row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      setRecordSelection(module, recordId, setSelections);
                    }}
                  >
                    {page.columns?.map((column) => (
                      <td key={column.key}>{renderTableCell(column.key, row[column.key] ?? '--')}</td>
                    ))}
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action-link table-action-link--accent"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRecordSelection(module, recordId, setSelections);
                            onNavigate(detailRouteByModule[module]);
                          }}
                        >
                          Review
                        </button>
                        <button
                          className="table-action-link"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRecordSelection(module, recordId, setSelections);
                            onNavigate(editRouteByModule[module]);
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">{config.selectedLabel}</p>
              <h2>Switch order</h2>
            </div>
          </div>

          <SearchSelectField
            label={config.switchLabel}
            value={selectedRecordId}
            options={options}
            onChange={(value) => {
              setRecordSelection(module, value, setSelections);
            }}
            placeholder={`Search ${config.switchLabel.toLowerCase()}`}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Key facts</p>
              <h2>{spotlight.title}</h2>
            </div>
            <p className="section-copy">Keep the active order in view while scanning the live queue.</p>
          </div>

          <WarehouseFlowFacts facts={spotlight.facts} />
        </section>
      </aside>
    </section>
  );
}

function WarehouseFlowDetailPage({
  module,
  page,
  store,
  selections,
  setSelections,
  onNavigate,
  detailSection,
  options,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'selections' | 'setSelections' | 'onNavigate'> & {
  module: WarehouseFlowModule;
  detailSection: ReturnType<typeof buildDetailSection>;
  options: SearchOption[];
}) {
  const config = getWarehouseFlowConfig(module);
  const selectedRecordId = getSelectedRecordId(module, selections);
  const selectedRecord = getWarehouseFlowRecord(module, store, selections);
  const spotlight = buildWarehouseFlowSnapshot(module, store, selectedRecord);

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={config.detailKicker}
          title={page.title}
          description={config.detailDescription}
          actions={
            <>
              <button className="primary-button" type="button" onClick={() => onNavigate(editRouteByModule[module])}>
                {config.editLabel}
              </button>
              <button className="secondary-button" type="button" onClick={() => onNavigate(module === 'inbound' ? 'inbound-list' : 'outbound-list')}>
                {config.backLabel}
              </button>
            </>
          }
        />

        <WarehouseFlowSpotlight kicker={config.selectedLabel} snapshot={spotlight} />

        <div className="detail-groups detail-groups--warehouse">
          {detailSection.groups.map((group) => (
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

        {detailSection.lineItems?.length ? (
          <section className="detail-slab">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Line review</p>
                <h2>Product lines</h2>
              </div>
              <p className="section-copy">Keep header and line quantities aligned before final confirmation.</p>
            </div>

            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Product Code</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {detailSection.lineItems.map((lineItem) => (
                    <tr key={lineItem.id}>
                      <td>{lineItem.productName}</td>
                      <td>{lineItem.productCode}</td>
                      <td>{lineItem.quantity}</td>
                      <td>{lineItem.unit}</td>
                      <td>{lineItem.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {detailSection.notes ? (
          <section className="detail-slab detail-slab--notes">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Notes</p>
                <h2>{detailSection.notesLabel ?? 'Notes'}</h2>
              </div>
            </div>
            <p className="section-copy">{detailSection.notes}</p>
          </section>
        ) : null}
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">{config.selectedLabel}</p>
              <h2>Switch order</h2>
            </div>
          </div>

          <SearchSelectField
            label={config.switchLabel}
            value={selectedRecordId}
            options={options}
            onChange={(value) => {
              setRecordSelection(module, value, setSelections);
            }}
            placeholder={`Search ${config.switchLabel.toLowerCase()}`}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Key facts</p>
              <h2>{spotlight.title}</h2>
            </div>
          </div>

          <WarehouseFlowFacts facts={spotlight.facts} />
        </section>
      </aside>
    </section>
  );
}

function isMasterDataModule(module: OperationalModuleKey): module is MasterDataModule {
  return module === 'product' || module === 'category';
}

function getMasterDataConfig(module: MasterDataModule) {
  if (module === 'product') {
    return {
      queueKicker: 'Product master',
      queueDescription: 'Manage SKU records with category and warehouse ownership visible from one workspace.',
      detailKicker: 'Product workspace',
      detailDescription: 'Review the selected SKU, linked category, warehouse assignment, and current master-data status.',
      formKicker: 'Product setup',
      formDescription: 'Capture product identity first, then confirm category, warehouse, code, and unit before saving.',
      primaryCreateLabel: 'New product',
      reviewLabel: 'Review selected',
      editLabel: 'Edit product',
      backLabel: 'Back to list',
      selectedLabel: 'Selected product',
      switchLabel: 'Product record',
      emptyTitle: 'New product',
      formLead: 'Start with product name and category, then confirm warehouse and unit.',
      saveLabel: 'Save Product',
      updateLabel: 'Update Product',
    };
  }

  return {
    queueKicker: 'Category structure',
    queueDescription: 'Maintain category naming, status, and linked product coverage from one workspace.',
    detailKicker: 'Category workspace',
    detailDescription: 'Review the selected category, status, description, and linked product coverage.',
    formKicker: 'Category setup',
    formDescription: 'Set the category name first, then complete code, description, and status before saving.',
    primaryCreateLabel: 'New category',
    reviewLabel: 'Review selected',
    editLabel: 'Edit category',
    backLabel: 'Back to list',
    selectedLabel: 'Selected category',
    switchLabel: 'Category record',
    emptyTitle: 'New category',
    formLead: 'Start with the category name, then finalize code and status.',
    saveLabel: 'Save Category',
    updateLabel: 'Update Category',
  };
}

function getMasterDataRecord(module: MasterDataModule, store: WorkspaceStore, selections: OperationalSelections) {
  return module === 'product' ? ops.getSelectedProduct(store, selections) : ops.getSelectedCategory(store, selections);
}

function buildMasterDataSnapshot(
  module: MasterDataModule,
  store: WorkspaceStore,
  record: WorkspaceStore['products'][number] | WorkspaceStore['categories'][number],
): WarehouseFlowSnapshot {
  if (module === 'product') {
    const product = record as WorkspaceStore['products'][number];
    const category = ops.findCategory(store, product.categoryId);
    const warehouse = ops.findWarehouse(store, product.warehouseId);

    return {
      title: product.productName,
      status: product.status,
      detail: `${product.productCode} · ${category?.categoryName ?? 'Unassigned'} · ${warehouse?.warehouseName ?? 'Unassigned'}`,
      metrics: [
        { label: 'Code', value: product.productCode },
        { label: 'Category', value: category?.categoryName ?? 'Unassigned' },
        { label: 'Warehouse', value: warehouse?.warehouseCode ?? 'Unassigned' },
        { label: 'Unit', value: product.unit },
      ],
      facts: [
        { label: 'Created', value: ops.formatLongDate(product.createdAt) },
        { label: 'Updated', value: ops.formatLongDate(product.updatedAt) },
      ],
    };
  }

  const category = record as WorkspaceStore['categories'][number];
  const linkedProducts = store.products.filter((product) => product.categoryId === category.id).length;

  return {
    title: category.categoryName,
    status: category.status,
    detail: `${category.categoryCode} · ${linkedProducts} linked products`,
    metrics: [
      { label: 'Code', value: category.categoryCode },
      { label: 'Linked', value: String(linkedProducts) },
      { label: 'Updated by', value: category.updatedBy },
      { label: 'Status', value: category.status },
    ],
    facts: [
      { label: 'Updated', value: ops.formatLongDate(category.updatedAt) },
      { label: 'Description', value: category.description || '--' },
    ],
  };
}

function buildProductFormSnapshot(formData: ProductFormData, store: WorkspaceStore): WarehouseFlowSnapshot {
  const config = getMasterDataConfig('product');
  const category = ops.findCategory(store, formData.categoryId);
  const warehouse = ops.findWarehouse(store, formData.warehouseId);

  return {
    title: formData.productName.trim() || config.emptyTitle,
    status: formData.status,
    detail: `${formData.productCode || 'Auto code'} · ${category?.categoryName ?? 'Select category'} · ${warehouse?.warehouseName ?? 'Select warehouse'}`,
    metrics: [
      { label: 'Code', value: formData.productCode || 'Auto' },
      { label: 'Category', value: category?.categoryName ?? 'Pending' },
      { label: 'Warehouse', value: warehouse?.warehouseCode ?? 'Pending' },
      { label: 'Unit', value: formData.unit || 'Auto' },
    ],
    facts: [],
  };
}

function buildCategoryFormSnapshot(
  formData: CategoryFormData,
  linkedProductCount: number,
): WarehouseFlowSnapshot {
  const config = getMasterDataConfig('category');

  return {
    title: formData.categoryName.trim() || config.emptyTitle,
    status: formData.status,
    detail: `${formData.categoryCode || 'Auto code'} · ${linkedProductCount} linked products`,
    metrics: [
      { label: 'Code', value: formData.categoryCode || 'Auto' },
      { label: 'Linked', value: String(linkedProductCount) },
      { label: 'Description', value: formData.description.trim() ? 'Ready' : 'Optional' },
      { label: 'Notes', value: formData.notes.trim() ? 'Ready' : 'Optional' },
    ],
    facts: formData.description.trim() ? [{ label: 'Description', value: formData.description.trim() }] : [],
  };
}

function buildProductFormSteps(formData: ProductFormData): WarehouseFlowStep[] {
  const basicsReady = Boolean(formData.productName.trim() && formData.categoryId);
  const contextReady = Boolean(formData.warehouseId && formData.productCode.trim() && formData.unit.trim());

  return [
    {
      label: '1. Basics',
      detail: 'Name and category',
      state: basicsReady ? 'done' : 'active',
    },
    {
      label: '2. Context',
      detail: 'Warehouse, code, unit',
      state: basicsReady ? (contextReady ? 'done' : 'active') : 'pending',
    },
    {
      label: '3. Save',
      detail: 'Publish or keep draft',
      state: formData.status === 'Active' ? 'done' : basicsReady && contextReady ? 'active' : 'pending',
    },
  ];
}

function buildCategoryFormSteps(formData: CategoryFormData): WarehouseFlowStep[] {
  const basicsReady = Boolean(formData.categoryName.trim());
  const contextReady = Boolean(formData.categoryCode.trim());

  return [
    {
      label: '1. Basics',
      detail: 'Name first',
      state: basicsReady ? 'done' : 'active',
    },
    {
      label: '2. Context',
      detail: 'Code and status',
      state: basicsReady ? (contextReady ? 'done' : 'active') : 'pending',
    },
    {
      label: '3. Save',
      detail: 'Publish or keep draft',
      state: formData.status === 'Active' ? 'done' : basicsReady && contextReady ? 'active' : 'pending',
    },
  ];
}

function MasterDataListPage({
  module,
  page,
  store,
  selections,
  setSelections,
  onNavigate,
  recordIds,
  rows,
  options,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'selections' | 'setSelections' | 'onNavigate'> & {
  module: MasterDataModule;
  recordIds: string[];
  rows: Record<string, string>[];
  options: SearchOption[];
}) {
  const config = getMasterDataConfig(module);
  const selectedRecordId = getSelectedRecordId(module, selections);
  const selectedRecord = getMasterDataRecord(module, store, selections);
  const spotlight = buildMasterDataSnapshot(module, store, selectedRecord);

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={config.queueKicker}
          title={page.title}
          description={config.queueDescription}
          actions={
            <>
              <button className="primary-button" type="button" onClick={() => onNavigate(module === 'product' ? 'product-create' : 'category-create')}>
                {config.primaryCreateLabel}
              </button>
              <button className="secondary-button" type="button" onClick={() => onNavigate(detailRouteByModule[module])}>
                {config.reviewLabel}
              </button>
              <button className="ghost-link" type="button" onClick={() => onNavigate(editRouteByModule[module])}>
                {config.editLabel}
              </button>
            </>
          }
        />

        <WarehouseFlowSpotlight kicker={config.selectedLabel} snapshot={spotlight} />

        <div className="table-wrap table-wrap--warehouse">
          <table className="orders-table">
            <thead>
              <tr>
                {page.columns?.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const recordId = recordIds[index];
                const isSelected = recordId === selectedRecordId;

                return (
                  <tr
                    key={recordId}
                    className={`orders-table__row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      setRecordSelection(module, recordId, setSelections);
                    }}
                  >
                    {page.columns?.map((column) => (
                      <td key={column.key}>{renderTableCell(column.key, row[column.key] ?? '--')}</td>
                    ))}
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action-link table-action-link--accent"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRecordSelection(module, recordId, setSelections);
                            onNavigate(detailRouteByModule[module]);
                          }}
                        >
                          Review
                        </button>
                        <button
                          className="table-action-link"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRecordSelection(module, recordId, setSelections);
                            onNavigate(editRouteByModule[module]);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">{config.selectedLabel}</p>
              <h2>Switch record</h2>
            </div>
          </div>

          <SearchSelectField
            label={config.switchLabel}
            value={selectedRecordId}
            options={options}
            onChange={(value) => {
              setRecordSelection(module, value, setSelections);
            }}
            placeholder={`Search ${config.switchLabel.toLowerCase()}`}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Key facts</p>
              <h2>{spotlight.title}</h2>
            </div>
            <p className="section-copy">Keep the active master record in view while scanning the list.</p>
          </div>

          <WarehouseFlowFacts facts={spotlight.facts} />
        </section>
      </aside>
    </section>
  );
}

function MasterDataDetailPage({
  module,
  page,
  store,
  selections,
  setSelections,
  onNavigate,
  detailSection,
  options,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'selections' | 'setSelections' | 'onNavigate'> & {
  module: MasterDataModule;
  detailSection: ReturnType<typeof buildDetailSection>;
  options: SearchOption[];
}) {
  const config = getMasterDataConfig(module);
  const selectedRecordId = getSelectedRecordId(module, selections);
  const selectedRecord = getMasterDataRecord(module, store, selections);
  const spotlight = buildMasterDataSnapshot(module, store, selectedRecord);

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={config.detailKicker}
          title={page.title}
          description={config.detailDescription}
          actions={
            <>
              <button className="primary-button" type="button" onClick={() => onNavigate(editRouteByModule[module])}>
                {config.editLabel}
              </button>
              <button className="secondary-button" type="button" onClick={() => onNavigate(module === 'product' ? 'product-list' : 'category-list')}>
                {config.backLabel}
              </button>
            </>
          }
        />

        <WarehouseFlowSpotlight kicker={config.selectedLabel} snapshot={spotlight} />

        <div className="detail-groups">
          {detailSection.groups.map((group) => (
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

        {detailSection.notes ? (
          <section className="detail-slab detail-slab--notes">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Notes</p>
                <h2>{detailSection.notesLabel ?? 'Notes'}</h2>
              </div>
            </div>
            <p className="section-copy">{detailSection.notes}</p>
          </section>
        ) : null}
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">{config.selectedLabel}</p>
              <h2>Switch record</h2>
            </div>
          </div>

          <SearchSelectField
            label={config.switchLabel}
            value={selectedRecordId}
            options={options}
            onChange={(value) => {
              setRecordSelection(module, value, setSelections);
            }}
            placeholder={`Search ${config.switchLabel.toLowerCase()}`}
          />
        </section>

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Key facts</p>
              <h2>{spotlight.title}</h2>
            </div>
          </div>

          <WarehouseFlowFacts facts={spotlight.facts} />
        </section>
      </aside>
    </section>
  );
}

function ProductFormPage({
  mode,
  page,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
}) {
  const sourceRecord = mode === 'edit' ? ops.getSelectedProduct(store, selections) : undefined;

  return (
    <ProductFormEditor
      key={`${mode}:${sourceRecord?.id ?? 'create'}`}
      mode={mode}
      page={page}
      store={store}
      setStore={setStore}
      sourceRecord={sourceRecord}
      selections={selections}
      setSelections={setSelections}
      onNavigate={onNavigate}
    />
  );
}

function ProductFormEditor({
  mode,
  page,
  store,
  setStore,
  sourceRecord,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
  sourceRecord?: WorkspaceStore['products'][number];
}) {
  const [formData, setFormData] = useState<ProductFormData>(() =>
    sourceRecord ? ops.mapProductToFormData(sourceRecord) : ops.createProductDraft(),
  );
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [codeLocked, setCodeLocked] = useState(Boolean(sourceRecord?.productCode));
  const [unitLocked, setUnitLocked] = useState(Boolean(sourceRecord?.unit));
  const categoryOptions = ops.buildCategoryOptions(store);
  const warehouseOptions = ops.buildWarehouseOptions(store);

  const errors = validateProductForm(formData);

  function updateField<Key extends keyof ProductFormData>(key: Key, value: ProductFormData[Key]) {
    setFormData((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if ((key === 'productName' || key === 'categoryId') && !codeLocked) {
        next.productCode =
          next.productName.trim() && next.categoryId ? ops.suggestProductCode(next.productName, next.categoryId, store) : '';
      }

      if (key === 'categoryId' && !unitLocked) {
        next.unit = next.categoryId ? ops.suggestUnit(next.categoryId, store) : '';
      }

      return next;
    });
  }

  function saveProduct(isDraftAction: boolean) {
    setSubmitCount((count) => count + 1);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const nextTimestamp = ops.nowIso();
    const nextStatus = isDraftAction ? formData.status : formData.status === 'Draft' ? 'Active' : formData.status;
    const nextRecordId = sourceRecord?.id ?? `${ops.sanitizeCode(formData.productCode) || 'PRODUCT'}-${store.products.length + 1}`;

    const nextRecord = {
      id: nextRecordId,
      productCode: formData.productCode,
      productName: formData.productName.trim(),
      categoryId: formData.categoryId,
      warehouseId: formData.warehouseId,
      unit: formData.unit.trim(),
      status: nextStatus,
      notes: formData.notes.trim(),
      createdAt: sourceRecord?.createdAt ?? nextTimestamp,
      updatedAt: nextTimestamp,
    } satisfies WorkspaceStore['products'][number];

    setStore((current) => ({
      ...current,
      products: sourceRecord
        ? current.products.map((product) => (product.id === sourceRecord.id ? nextRecord : product))
        : [nextRecord, ...current.products],
    }));

    setSelections((current) => ({
      ...current,
      productId: nextRecord.id,
    }));

    if (mode === 'create') {
      onNavigate('product-edit');
    }
  }

  const flowConfig = getMasterDataConfig('product');
  const flowSteps = buildProductFormSteps(formData);
  const previewSnapshot = buildProductFormSnapshot(formData, store);
  const readyToSave = flowSteps[0].state === 'done' && flowSteps[1].state === 'done';

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={flowConfig.formKicker}
          title={page.title}
          description={flowConfig.formDescription}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => onNavigate('product-list')}>
                {flowConfig.backLabel}
              </button>
              {mode === 'edit' ? (
                <button className="ghost-link" type="button" onClick={() => onNavigate(detailRouteByModule.product)}>
                  Review product
                </button>
              ) : null}
            </>
          }
        />

        <WarehouseFlowSteps items={flowSteps} />

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Identity" description="Start with product name and category.">
            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Product name"
                value={formData.productName}
                onChange={(value) => updateField('productName', value)}
                onBlur={() => setTouchedFlag('productName', setTouched)}
                placeholder="Enter the product name"
                required
                error={getVisibleError('productName', errors, touched, submitCount)}
              />
              <SearchSelectField
                label="Category"
                value={formData.categoryId}
                options={categoryOptions}
                onChange={(value) => {
                  updateField('categoryId', value);
                }}
                onBlur={() => setTouchedFlag('categoryId', setTouched)}
                placeholder="Search category"
                required
                error={getVisibleError('categoryId', errors, touched, submitCount)}
              />
            </div>
          </FormSection>

          <FormSection title="Operational Context" description="Confirm warehouse, code, unit, and status before saving.">
            <div className="form-section__grid form-section__grid--two">
              <SearchSelectField
                label="Warehouse"
                value={formData.warehouseId}
                options={warehouseOptions}
                onChange={(value) => {
                  updateField('warehouseId', value);
                }}
                onBlur={() => setTouchedFlag('warehouseId', setTouched)}
                placeholder="Search warehouse"
                required
                error={getVisibleError('warehouseId', errors, touched, submitCount)}
              />
              <SelectField
                label="Status"
                value={formData.status}
                options={ops.productStatusOptions}
                onChange={(value) => updateField('status', value as ProductFormData['status'])}
              />
            </div>

            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Product code"
                value={formData.productCode}
                onChange={(value) => {
                  setCodeLocked(true);
                  updateField('productCode', ops.sanitizeCode(value));
                }}
                onBlur={() => setTouchedFlag('productCode', setTouched)}
                placeholder="Generated from category and product name"
                required
                error={getVisibleError('productCode', errors, touched, submitCount)}
              />
              <TextField
                label="Unit"
                value={formData.unit}
                onChange={(value) => {
                  setUnitLocked(true);
                  updateField('unit', value);
                }}
                onBlur={() => setTouchedFlag('unit', setTouched)}
                placeholder="Pack, Unit, Set"
                required
                error={getVisibleError('unit', errors, touched, submitCount)}
              />
            </div>
          </FormSection>

          <FormSection title="Notes">
            <TextAreaField
              label="Product notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add receiving, picking, or exception notes"
            />
          </FormSection>

          <section className="form-section form-section--actions">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Finish</p>
                <h2>Save the record</h2>
              </div>
              <p className="section-copy">
                {readyToSave
                  ? 'Save as draft while the master data is still forming, or publish the current product record.'
                  : flowConfig.formLead}
              </p>
            </div>

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => saveProduct(true)}>
                Save Draft
              </button>
              <button className="primary-button" type="button" onClick={() => saveProduct(false)}>
                {mode === 'create' ? flowConfig.saveLabel : flowConfig.updateLabel}
              </button>
              <button className="ghost-link" type="button" onClick={() => onNavigate('product-list')}>
                {flowConfig.backLabel}
              </button>
            </div>
          </section>
        </form>
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        {mode === 'edit' ? (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">{flowConfig.selectedLabel}</p>
                <h2>Switch record</h2>
              </div>
            </div>

            <SearchSelectField
              label={flowConfig.switchLabel}
              value={selections.productId}
              options={ops.buildSelectionOptions(store, 'product')}
              onChange={(value) => setSelections((current) => ({ ...current, productId: value }))}
              placeholder="Search product record"
            />
          </section>
        ) : (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Start here</p>
                <h2>{flowConfig.primaryCreateLabel}</h2>
              </div>
              <p className="section-copy">{flowConfig.formLead}</p>
            </div>
          </section>
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{previewSnapshot.title}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            {previewSnapshot.metrics.map((metric) => (
              <PreviewStat key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          {previewSnapshot.facts.length ? <WarehouseFlowFacts facts={previewSnapshot.facts} /> : null}
        </section>
      </aside>
    </section>
  );
}

function CategoryFormPage({
  mode,
  page,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
}) {
  const sourceRecord = mode === 'edit' ? ops.getSelectedCategory(store, selections) : undefined;

  return (
    <CategoryFormEditor
      key={`${mode}:${sourceRecord?.id ?? 'create'}`}
      mode={mode}
      page={page}
      store={store}
      setStore={setStore}
      sourceRecord={sourceRecord}
      selections={selections}
      setSelections={setSelections}
      onNavigate={onNavigate}
    />
  );
}

function CategoryFormEditor({
  mode,
  page,
  store,
  setStore,
  sourceRecord,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
  sourceRecord?: WorkspaceStore['categories'][number];
}) {
  const [formData, setFormData] = useState<CategoryFormData>(() =>
    sourceRecord ? ops.mapCategoryToFormData(sourceRecord) : ops.createCategoryDraft(),
  );
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [codeLocked, setCodeLocked] = useState(Boolean(sourceRecord?.categoryCode));
  const linkedProductCount = sourceRecord ? store.products.filter((product) => product.categoryId === sourceRecord.id).length : 0;

  const errors = validateCategoryForm(formData);

  function updateField<Key extends keyof CategoryFormData>(key: Key, value: CategoryFormData[Key]) {
    setFormData((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === 'categoryName' && !codeLocked) {
        next.categoryCode = next.categoryName.trim() ? ops.suggestCategoryCode(next.categoryName, store) : '';
      }

      return next;
    });
  }

  function saveCategory(isDraftAction: boolean) {
    setSubmitCount((count) => count + 1);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const nextTimestamp = ops.nowIso();
    const nextStatus = isDraftAction ? formData.status : formData.status === 'Draft' ? 'Active' : formData.status;
    const nextRecordId = sourceRecord?.id ?? `${ops.sanitizeCode(formData.categoryCode) || 'CATEGORY'}-${store.categories.length + 1}`;

    const nextRecord = {
      id: nextRecordId,
      categoryCode: formData.categoryCode,
      categoryName: formData.categoryName.trim(),
      description: formData.description.trim(),
      status: nextStatus,
      notes: formData.notes.trim(),
      updatedAt: nextTimestamp,
      updatedBy: ops.currentOperator,
    } satisfies WorkspaceStore['categories'][number];

    setStore((current) => ({
      ...current,
      categories: sourceRecord
        ? current.categories.map((category) => (category.id === sourceRecord.id ? nextRecord : category))
        : [nextRecord, ...current.categories],
    }));

    setSelections((current) => ({
      ...current,
      categoryId: nextRecord.id,
    }));

    if (mode === 'create') {
      onNavigate('category-edit');
    }
  }

  const flowConfig = getMasterDataConfig('category');
  const flowSteps = buildCategoryFormSteps(formData);
  const previewSnapshot = buildCategoryFormSnapshot(formData, linkedProductCount);
  const readyToSave = flowSteps[0].state === 'done' && flowSteps[1].state === 'done';

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={flowConfig.formKicker}
          title={page.title}
          description={flowConfig.formDescription}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => onNavigate('category-list')}>
                {flowConfig.backLabel}
              </button>
              {mode === 'edit' ? (
                <button className="ghost-link" type="button" onClick={() => onNavigate(detailRouteByModule.category)}>
                  Review category
                </button>
              ) : null}
            </>
          }
        />

        <WarehouseFlowSteps items={flowSteps} />

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Identity" description="Start with the category name.">
            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Category name"
                value={formData.categoryName}
                onChange={(value) => updateField('categoryName', value)}
                onBlur={() => setTouchedFlag('categoryName', setTouched)}
                placeholder="Enter the category name"
                required
                error={getVisibleError('categoryName', errors, touched, submitCount)}
              />
              <TextField
                label="Category code"
                value={formData.categoryCode}
                onChange={(value) => {
                  setCodeLocked(true);
                  updateField('categoryCode', ops.sanitizeCode(value));
                }}
                onBlur={() => setTouchedFlag('categoryCode', setTouched)}
                placeholder="Generated from the category name"
                required
                error={getVisibleError('categoryCode', errors, touched, submitCount)}
              />
            </div>
          </FormSection>

          <FormSection title="Operational Context" description="Confirm description and status before saving.">
            <div className="form-section__grid form-section__grid--two">
              <TextAreaField
                label="Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Short explanation of what belongs in this category"
              />
              <SelectField
                label="Status"
                value={formData.status}
                options={ops.categoryStatusOptions}
                onChange={(value) => updateField('status', value as CategoryFormData['status'])}
              />
            </div>
          </FormSection>

          <FormSection title="Notes">
            <TextAreaField
              label="Category notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add assignment rules, cleanup notes, or status context"
            />
          </FormSection>

          <section className="form-section form-section--actions">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Finish</p>
                <h2>Save the record</h2>
              </div>
              <p className="section-copy">
                {readyToSave
                  ? 'Save as draft while the structure is still under review, or publish the current category record.'
                  : flowConfig.formLead}
              </p>
            </div>

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => saveCategory(true)}>
                Save Draft
              </button>
              <button className="primary-button" type="button" onClick={() => saveCategory(false)}>
                {mode === 'create' ? flowConfig.saveLabel : flowConfig.updateLabel}
              </button>
              <button className="ghost-link" type="button" onClick={() => onNavigate('category-list')}>
                {flowConfig.backLabel}
              </button>
            </div>
          </section>
        </form>
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        {mode === 'edit' ? (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">{flowConfig.selectedLabel}</p>
                <h2>Switch record</h2>
              </div>
            </div>

            <SearchSelectField
              label={flowConfig.switchLabel}
              value={selections.categoryId}
              options={ops.buildSelectionOptions(store, 'category')}
              onChange={(value) => setSelections((current) => ({ ...current, categoryId: value }))}
              placeholder="Search category record"
            />
          </section>
        ) : (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Start here</p>
                <h2>{flowConfig.primaryCreateLabel}</h2>
              </div>
              <p className="section-copy">{flowConfig.formLead}</p>
            </div>
          </section>
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{previewSnapshot.title}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            {previewSnapshot.metrics.map((metric) => (
              <PreviewStat key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          {previewSnapshot.facts.length ? <WarehouseFlowFacts facts={previewSnapshot.facts} /> : null}
        </section>
      </aside>
    </section>
  );
}

function InboundFormPage({
  mode,
  page,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
}) {
  const sourceRecord = mode === 'edit' ? ops.getSelectedInbound(store, selections) : undefined;

  return (
    <InboundFormEditor
      key={`${mode}:${sourceRecord?.id ?? 'create'}`}
      mode={mode}
      page={page}
      store={store}
      setStore={setStore}
      sourceRecord={sourceRecord}
      selections={selections}
      setSelections={setSelections}
      onNavigate={onNavigate}
    />
  );
}

function InboundFormEditor({
  mode,
  page,
  store,
  setStore,
  sourceRecord,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
  sourceRecord?: WorkspaceStore['inboundOrders'][number];
}) {
  const [formData, setFormData] = useState<InboundFormData>(() => {
    if (sourceRecord) {
      return ops.mapInboundToFormData(sourceRecord);
    }

    const nextDraft = ops.createInboundDraft();
    nextDraft.inboundNo = ops.createInboundNumber(store);
    return nextDraft;
  });
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitCount, setSubmitCount] = useState(0);
  const warehouseOptions = ops.buildWarehouseOptions(store);
  const productOptions = ops.buildProductOptions(store);

  const errors = validateInboundForm(formData);

  function updateField<Key extends keyof InboundFormData>(key: Key, value: InboundFormData[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateLineItem(index: number, patch: Partial<OrderLineItem>) {
    setFormData((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem, lineIndex) => (lineIndex === index ? { ...lineItem, ...patch } : lineItem)),
    }));
  }

  function addLineItem() {
    setFormData((current) => ({
      ...current,
      lineItems: [...current.lineItems, ops.createEmptyLineItem()],
    }));
  }

  function removeLineItem(index: number) {
    setFormData((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, lineIndex) => lineIndex !== index),
    }));
  }

  function saveInbound(confirmReceipt: boolean) {
    setSubmitCount((count) => count + 1);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const nextTimestamp = ops.nowIso();
    const nextRecord = {
      id: sourceRecord?.id ?? formData.inboundNo,
      inboundNo: formData.inboundNo,
      warehouseId: formData.warehouseId,
      status: confirmReceipt ? 'Confirmed' : formData.status,
      supplierName: formData.supplierName.trim(),
      referenceNo: formData.referenceNo.trim(),
      plannedDate: formData.plannedDate,
      createdBy: sourceRecord?.createdBy ?? ops.currentOperator,
      createdAt: sourceRecord?.createdAt ?? nextTimestamp,
      confirmedAt: confirmReceipt ? nextTimestamp : sourceRecord?.confirmedAt ?? '',
      notes: formData.notes.trim(),
      lineItems: getCommittedLineItems(formData.lineItems).map((lineItem) => ({ ...lineItem })),
    } satisfies WorkspaceStore['inboundOrders'][number];

    setStore((current) => ({
      ...current,
      inboundOrders: sourceRecord
        ? current.inboundOrders.map((order) => (order.id === sourceRecord.id ? nextRecord : order))
        : [nextRecord, ...current.inboundOrders],
    }));

    setSelections((current) => ({
      ...current,
      inboundId: nextRecord.id,
    }));

    if (mode === 'create') {
      onNavigate('inbound-edit');
    }
  }

  const flowConfig = getWarehouseFlowConfig('inbound');
  const flowSteps = buildInboundFormSteps(formData);
  const previewSnapshot = buildInboundFormSnapshot(formData, store);
  const readyToConfirm = flowSteps[0].state === 'done' && flowSteps[1].state === 'done';

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={flowConfig.formKicker}
          title={page.title}
          description={flowConfig.formDescription}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => onNavigate('inbound-list')}>
                {flowConfig.backLabel}
              </button>
              {mode === 'edit' ? (
                <button className="ghost-link" type="button" onClick={() => onNavigate(detailRouteByModule.inbound)}>
                  Review receipt
                </button>
              ) : null}
            </>
          }
        />

        <WarehouseFlowSteps items={flowSteps} />

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Order Header" description="Start with warehouse, supplier, and planned date.">
            <div className="form-section__grid form-section__grid--two">
              <ReadonlyField label="Inbound number" value={formData.inboundNo || 'Generated on save'} />
              <SearchSelectField
                label="Warehouse"
                value={formData.warehouseId}
                options={warehouseOptions}
                onChange={(value) => updateField('warehouseId', value)}
                onBlur={() => setTouchedFlag('warehouseId', setTouched)}
                placeholder="Search warehouse"
                required
                error={getVisibleError('warehouseId', errors, touched, submitCount)}
              />
            </div>

            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Supplier"
                value={formData.supplierName}
                onChange={(value) => updateField('supplierName', value)}
                onBlur={() => setTouchedFlag('supplierName', setTouched)}
                placeholder="Enter the supplier name"
                required
                error={getVisibleError('supplierName', errors, touched, submitCount)}
              />
              <TextField
                label="Reference number"
                value={formData.referenceNo}
                onChange={(value) => updateField('referenceNo', value)}
                placeholder="ASN, packing list, or dock reference"
              />
            </div>

            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Planned date"
                value={formData.plannedDate}
                onChange={(value) => updateField('plannedDate', value)}
                onBlur={() => setTouchedFlag('plannedDate', setTouched)}
                placeholder="YYYY-MM-DD"
                required
                error={getVisibleError('plannedDate', errors, touched, submitCount)}
                type="date"
              />
              <SelectField
                label="Status"
                value={formData.status}
                options={ops.inboundStatusOptions}
                onChange={(value) => updateField('status', value as InboundFormData['status'])}
              />
            </div>
          </FormSection>

          <FormSection title="Product Lines" description="Add at least one product line with quantity before confirmation.">
            <LineItemsEditor
              lineItems={formData.lineItems}
              productOptions={productOptions}
              store={store}
              touched={touched}
              submitCount={submitCount}
              errors={errors}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
              onLineItemChange={updateLineItem}
              setTouched={setTouched}
            />
          </FormSection>

          <FormSection title="Notes">
            <TextAreaField
              label="Inbound notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add dock instructions or receipt exceptions"
            />
          </FormSection>

          <section className="form-section form-section--actions">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Finish</p>
                <h2>Save or confirm</h2>
              </div>
              <p className="section-copy">
                {readyToConfirm
                  ? 'Save the receipt as work in progress or confirm it when warehouse review is complete.'
                  : flowConfig.formLead}
              </p>
            </div>

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => saveInbound(false)}>
                Save Draft
              </button>
              <button className="primary-button" type="button" onClick={() => saveInbound(true)}>
                {flowConfig.confirmLabel}
              </button>
              <button className="ghost-link" type="button" onClick={() => onNavigate('inbound-list')}>
                {flowConfig.backLabel}
              </button>
            </div>
          </section>
        </form>
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        {mode === 'edit' ? (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">{flowConfig.selectedLabel}</p>
                <h2>Switch order</h2>
              </div>
            </div>

            <SearchSelectField
              label={flowConfig.switchLabel}
              value={selections.inboundId}
              options={ops.buildSelectionOptions(store, 'inbound')}
              onChange={(value) => setSelections((current) => ({ ...current, inboundId: value }))}
              placeholder="Search receipt record"
            />
          </section>
        ) : (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Start here</p>
                <h2>{flowConfig.primaryCreateLabel}</h2>
              </div>
              <p className="section-copy">{flowConfig.formLead}</p>
            </div>
          </section>
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{previewSnapshot.title}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            {previewSnapshot.metrics.map((metric) => (
              <PreviewStat key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <WarehouseFlowFacts facts={previewSnapshot.facts} />
        </section>
      </aside>
    </section>
  );
}

function OutboundFormPage({
  mode,
  page,
  store,
  setStore,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
}) {
  const sourceRecord = mode === 'edit' ? ops.getSelectedOutbound(store, selections) : undefined;

  return (
    <OutboundFormEditor
      key={`${mode}:${sourceRecord?.id ?? 'create'}`}
      mode={mode}
      page={page}
      store={store}
      setStore={setStore}
      sourceRecord={sourceRecord}
      selections={selections}
      setSelections={setSelections}
      onNavigate={onNavigate}
    />
  );
}

function OutboundFormEditor({
  mode,
  page,
  store,
  setStore,
  sourceRecord,
  selections,
  setSelections,
  onNavigate,
}: Pick<OperationalModuleViewProps, 'page' | 'store' | 'setStore' | 'selections' | 'setSelections' | 'onNavigate'> & {
  mode: 'create' | 'edit';
  sourceRecord?: WorkspaceStore['outboundOrders'][number];
}) {
  const [formData, setFormData] = useState<OutboundFormData>(() => {
    if (sourceRecord) {
      return ops.mapOutboundToFormData(sourceRecord);
    }

    const nextDraft = ops.createOutboundDraft();
    nextDraft.outboundNo = ops.createOutboundNumber(store);
    return nextDraft;
  });
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitCount, setSubmitCount] = useState(0);
  const warehouseOptions = ops.buildWarehouseOptions(store);
  const productOptions = ops.buildProductOptions(store);

  const errors = validateOutboundForm(formData);

  function updateField<Key extends keyof OutboundFormData>(key: Key, value: OutboundFormData[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateLineItem(index: number, patch: Partial<OrderLineItem>) {
    setFormData((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem, lineIndex) => (lineIndex === index ? { ...lineItem, ...patch } : lineItem)),
    }));
  }

  function addLineItem() {
    setFormData((current) => ({
      ...current,
      lineItems: [...current.lineItems, ops.createEmptyLineItem()],
    }));
  }

  function removeLineItem(index: number) {
    setFormData((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, lineIndex) => lineIndex !== index),
    }));
  }

  function saveOutbound(confirmShipment: boolean) {
    setSubmitCount((count) => count + 1);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const nextTimestamp = ops.nowIso();
    const nextRecord = {
      id: sourceRecord?.id ?? formData.outboundNo,
      outboundNo: formData.outboundNo,
      warehouseId: formData.warehouseId,
      destination: formData.destination.trim(),
      carrier: formData.carrier.trim(),
      shipmentDate: formData.shipmentDate,
      status: confirmShipment ? 'Shipped' : formData.status,
      createdBy: sourceRecord?.createdBy ?? ops.currentOperator,
      createdAt: sourceRecord?.createdAt ?? nextTimestamp,
      confirmedAt: confirmShipment ? nextTimestamp : sourceRecord?.confirmedAt ?? '',
      notes: formData.notes.trim(),
      lineItems: getCommittedLineItems(formData.lineItems).map((lineItem) => ({ ...lineItem })),
    } satisfies WorkspaceStore['outboundOrders'][number];

    setStore((current) => ({
      ...current,
      outboundOrders: sourceRecord
        ? current.outboundOrders.map((order) => (order.id === sourceRecord.id ? nextRecord : order))
        : [nextRecord, ...current.outboundOrders],
    }));

    setSelections((current) => ({
      ...current,
      outboundId: nextRecord.id,
    }));

    if (mode === 'create') {
      onNavigate('outbound-edit');
    }
  }

  const flowConfig = getWarehouseFlowConfig('outbound');
  const flowSteps = buildOutboundFormSteps(formData);
  const previewSnapshot = buildOutboundFormSnapshot(formData, store);
  const readyToConfirm = flowSteps[0].state === 'done' && flowSteps[1].state === 'done';

  return (
    <section className="workspace-layout workspace-layout--warehouse-flow">
      <section className="page-panel page-panel--main page-panel--warehouse-main">
        <WarehouseFlowHeader
          kicker={flowConfig.formKicker}
          title={page.title}
          description={flowConfig.formDescription}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => onNavigate('outbound-list')}>
                {flowConfig.backLabel}
              </button>
              {mode === 'edit' ? (
                <button className="ghost-link" type="button" onClick={() => onNavigate(detailRouteByModule.outbound)}>
                  Review shipment
                </button>
              ) : null}
            </>
          }
        />

        <WarehouseFlowSteps items={flowSteps} />

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Order Header" description="Start with warehouse, destination, and ship date.">
            <div className="form-section__grid form-section__grid--two">
              <ReadonlyField label="Outbound number" value={formData.outboundNo || 'Generated on save'} />
              <SearchSelectField
                label="Warehouse"
                value={formData.warehouseId}
                options={warehouseOptions}
                onChange={(value) => updateField('warehouseId', value)}
                onBlur={() => setTouchedFlag('warehouseId', setTouched)}
                placeholder="Search warehouse"
                required
                error={getVisibleError('warehouseId', errors, touched, submitCount)}
              />
            </div>

            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Destination"
                value={formData.destination}
                onChange={(value) => updateField('destination', value)}
                onBlur={() => setTouchedFlag('destination', setTouched)}
                placeholder="Enter the destination"
                required
                error={getVisibleError('destination', errors, touched, submitCount)}
              />
              <TextField
                label="Carrier"
                value={formData.carrier}
                onChange={(value) => updateField('carrier', value)}
                placeholder="Carrier or transport partner"
              />
            </div>

            <div className="form-section__grid form-section__grid--two">
              <TextField
                label="Shipment date"
                value={formData.shipmentDate}
                onChange={(value) => updateField('shipmentDate', value)}
                onBlur={() => setTouchedFlag('shipmentDate', setTouched)}
                placeholder="YYYY-MM-DD"
                required
                error={getVisibleError('shipmentDate', errors, touched, submitCount)}
                type="date"
              />
              <SelectField
                label="Status"
                value={formData.status}
                options={ops.outboundStatusOptions}
                onChange={(value) => updateField('status', value as OutboundFormData['status'])}
              />
            </div>
          </FormSection>

          <FormSection title="Product Lines" description="Add at least one product line with quantity before confirmation.">
            <LineItemsEditor
              lineItems={formData.lineItems}
              productOptions={productOptions}
              store={store}
              touched={touched}
              submitCount={submitCount}
              errors={errors}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
              onLineItemChange={updateLineItem}
              setTouched={setTouched}
            />
          </FormSection>

          <FormSection title="Notes">
            <TextAreaField
              label="Outbound notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add dispatch instructions or shipment exceptions"
            />
          </FormSection>

          <section className="form-section form-section--actions">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Finish</p>
                <h2>Save or confirm</h2>
              </div>
              <p className="section-copy">
                {readyToConfirm
                  ? 'Save the shipment as work in progress or confirm it when packing review is complete.'
                  : flowConfig.formLead}
              </p>
            </div>

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => saveOutbound(false)}>
                Save Draft
              </button>
              <button className="primary-button" type="button" onClick={() => saveOutbound(true)}>
                {flowConfig.confirmLabel}
              </button>
              <button className="ghost-link" type="button" onClick={() => onNavigate('outbound-list')}>
                {flowConfig.backLabel}
              </button>
            </div>
          </section>
        </form>
      </section>

      <aside className="page-panel page-panel--rail page-panel--warehouse-rail">
        {mode === 'edit' ? (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">{flowConfig.selectedLabel}</p>
                <h2>Switch order</h2>
              </div>
            </div>

            <SearchSelectField
              label={flowConfig.switchLabel}
              value={selections.outboundId}
              options={ops.buildSelectionOptions(store, 'outbound')}
              onChange={(value) => setSelections((current) => ({ ...current, outboundId: value }))}
              placeholder="Search shipment record"
            />
          </section>
        ) : (
          <section className="rail-block">
            <div className="section-heading section-heading--stack">
              <div>
                <p className="section-kicker">Start here</p>
                <h2>{flowConfig.primaryCreateLabel}</h2>
              </div>
              <p className="section-copy">{flowConfig.formLead}</p>
            </div>
          </section>
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{previewSnapshot.title}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            {previewSnapshot.metrics.map((metric) => (
              <PreviewStat key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <WarehouseFlowFacts facts={previewSnapshot.facts} />
        </section>
      </aside>
    </section>
  );
}

function buildListData(module: OperationalModuleKey, store: WorkspaceStore) {
  switch (module) {
    case 'product':
      return {
        recordIds: store.products.map((product) => product.id),
        rows: ops.buildProductRows(store),
      };
    case 'category':
      return {
        recordIds: store.categories.map((category) => category.id),
        rows: ops.buildCategoryRows(store),
      };
    case 'inbound':
      return {
        recordIds: store.inboundOrders.map((order) => order.id),
        rows: ops.buildInboundRows(store),
      };
    case 'outbound':
      return {
        recordIds: store.outboundOrders.map((order) => order.id),
        rows: ops.buildOutboundRows(store),
      };
  }
}

function buildDetailSection(module: OperationalModuleKey, store: WorkspaceStore, selections: OperationalSelections) {
  switch (module) {
    case 'product':
      return ops.buildProductDetailSection(store, selections);
    case 'category':
      return ops.buildCategoryDetailSection(store, selections);
    case 'inbound':
      return ops.buildInboundDetailSection(store, selections);
    case 'outbound':
      return ops.buildOutboundDetailSection(store, selections);
  }
}

function getSelectedRecordId(module: OperationalModuleKey, selections: OperationalSelections) {
  switch (module) {
    case 'product':
      return selections.productId;
    case 'category':
      return selections.categoryId;
    case 'inbound':
      return selections.inboundId;
    case 'outbound':
      return selections.outboundId;
  }
}

function setRecordSelection(
  module: OperationalModuleKey,
  value: string,
  setSelections: Dispatch<SetStateAction<OperationalSelections>>,
) {
  setSelections((current) => {
    switch (module) {
      case 'product':
        return { ...current, productId: value };
      case 'category':
        return { ...current, categoryId: value };
      case 'inbound':
        return { ...current, inboundId: value };
      case 'outbound':
        return { ...current, outboundId: value };
    }
  });
}

function getSelectionTone(module: OperationalModuleKey, store: WorkspaceStore, selections: OperationalSelections) {
  switch (module) {
    case 'product':
      return ops.getStatusTone(ops.getSelectedProduct(store, selections)?.status ?? 'Draft');
    case 'category':
      return ops.getStatusTone(ops.getSelectedCategory(store, selections)?.status ?? 'Draft');
    case 'inbound':
      return ops.getStatusTone(ops.getSelectedInbound(store, selections)?.status ?? 'Draft');
    case 'outbound':
      return ops.getStatusTone(ops.getSelectedOutbound(store, selections)?.status ?? 'Draft');
  }
}

function getListRailNotes(module: OperationalModuleKey) {
  switch (module) {
    case 'product':
      return [
        'Use create for new master data and edit for minor corrections.',
        'Category and warehouse stay linked to reduce unassigned products.',
        'Status should communicate whether the SKU is ready for movement.',
      ];
    case 'category':
      return [
        'Keep category names short enough to scan in product search.',
        'Use Draft while naming is still under review.',
        'Hold should stop new assignments until cleanup is complete.',
      ];
    case 'inbound':
      return [
        'Create receipts from the list to keep warehouse ownership explicit.',
        'Pending QC should be used only after a quantity or quality exception.',
        'Confirm Receipt should happen after final line review.',
      ];
    case 'outbound':
      return [
        'Create shipments from the list to keep destination context visible.',
        'Use Picking and Packed to communicate operator progress.',
        'Confirm Shipment should happen only after dispatch handoff.',
      ];
  }
}

function getDetailRailNotes(module: OperationalModuleKey) {
  switch (module) {
    case 'product':
      return [
        'Use Edit Product when code, unit, or warehouse context changes.',
        'Product notes should help receiving and picking teams, not repeat the name.',
      ];
    case 'category':
      return [
        'Edit the category when naming, description, or status needs correction.',
        'Category notes should guide product assignment and cleanup decisions.',
      ];
    case 'inbound':
      return [
        'Review line items before confirming receipt.',
        'Supplier and reference details should stay close to the warehouse header.',
      ];
    case 'outbound':
      return [
        'Review line items and destination before confirming shipment.',
        'Carrier and staging notes should remain visible until dispatch is complete.',
      ];
  }
}

function renderTableCell(columnKey: string, value: string) {
  if (columnKey === 'status') {
    return <StatusPill value={value} />;
  }

  return value;
}

function validateProductForm(values: ProductFormData) {
  const errors: ErrorMap = {};

  if (!values.productName.trim()) {
    errors.productName = 'Enter a product name.';
  }

  if (!values.categoryId) {
    errors.categoryId = 'Select a category.';
  }

  if (!values.warehouseId) {
    errors.warehouseId = 'Select a warehouse.';
  }

  if (!values.productCode.trim()) {
    errors.productCode = 'Enter or generate a product code.';
  }

  if (!values.unit.trim()) {
    errors.unit = 'Enter a unit.';
  }

  return errors;
}

function validateCategoryForm(values: CategoryFormData) {
  const errors: ErrorMap = {};

  if (!values.categoryName.trim()) {
    errors.categoryName = 'Enter a category name.';
  }

  if (!values.categoryCode.trim()) {
    errors.categoryCode = 'Enter or generate a category code.';
  }

  return errors;
}

function validateInboundForm(values: InboundFormData) {
  const errors: ErrorMap = {};

  if (!values.warehouseId) {
    errors.warehouseId = 'Select a warehouse.';
  }

  if (!values.supplierName.trim()) {
    errors.supplierName = 'Enter a supplier name.';
  }

  if (!values.plannedDate.trim()) {
    errors.plannedDate = 'Enter the planned receipt date.';
  }

  validateLineItems(values.lineItems, errors);
  return errors;
}

function validateOutboundForm(values: OutboundFormData) {
  const errors: ErrorMap = {};

  if (!values.warehouseId) {
    errors.warehouseId = 'Select a warehouse.';
  }

  if (!values.destination.trim()) {
    errors.destination = 'Enter a destination.';
  }

  if (!values.shipmentDate.trim()) {
    errors.shipmentDate = 'Enter the shipment date.';
  }

  validateLineItems(values.lineItems, errors);
  return errors;
}

function validateLineItems(lineItems: OrderLineItem[], errors: ErrorMap) {
  const meaningfulLineIndexes = lineItems
    .map((lineItem, index) => ({
      index,
      hasContent: Boolean(lineItem.productId || lineItem.quantity.trim() || lineItem.notes.trim()),
    }))
    .filter((item) => item.hasContent)
    .map((item) => item.index);

  if (meaningfulLineIndexes.length === 0) {
    errors.lineItems = 'Add at least one line item.';
  }

  lineItems.forEach((lineItem, index) => {
    const shouldValidate = meaningfulLineIndexes.includes(index) || lineItems.length === 1;

    if (!shouldValidate) {
      return;
    }

    if (!lineItem.productId) {
      errors[`lineItems.${index}.productId`] = 'Select a product.';
    }

    if (!lineItem.quantity.trim()) {
      errors[`lineItems.${index}.quantity`] = 'Enter a quantity.';
      return;
    }

    const numericQuantity = Number(lineItem.quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      errors[`lineItems.${index}.quantity`] = 'Use a quantity greater than zero.';
    }
  });
}

function sumQuantities(lineItems: OrderLineItem[]) {
  return lineItems.reduce((total, lineItem) => total + (Number(lineItem.quantity) || 0), 0);
}

function getCommittedLineItems(lineItems: OrderLineItem[]) {
  return lineItems.filter((lineItem) => lineItem.productId || lineItem.quantity.trim() || lineItem.notes.trim());
}

function setTouchedFlag(key: string, setTouched: Dispatch<SetStateAction<TouchedMap>>) {
  setTouched((current) => ({
    ...current,
    [key]: true,
  }));
}

function getVisibleError(key: string, errors: ErrorMap, touched: TouchedMap, submitCount: number) {
  return touched[key] || submitCount > 0 ? errors[key] : undefined;
}

function RailFrame({
  page,
  onNavigate,
  children,
}: {
  page: ModulePage;
  onNavigate: (route: Route) => void;
  children?: ReactNode;
}) {
  return (
    <aside className="page-panel page-panel--rail">
      {children}

      <section className="rail-block">
        <div className="section-heading section-heading--stack">
          <div>
            <p className="section-kicker">Entity source</p>
            <h2>{page.entityLabel}</h2>
          </div>
          <p className="section-copy">Field names below stay aligned with the documented entity list while the form groups follow the business workflow.</p>
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
  );
}

function SelectionPreview({ title, detail, tone }: { title: string; detail: string; tone: string }) {
  return (
    <div className="preview-card">
      <div className="preview-card__top">
        <p>{title}</p>
        <StatusPill value={tone === 'positive' ? 'Ready' : tone === 'warning' ? 'Attention' : tone === 'muted' ? 'Draft' : 'Active'} />
      </div>
      <p>{detail}</p>
    </div>
  );
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="preview-stat">
      <span>{label}</span>
      {tone ? <StatusPill value={value} toneOverride={tone} /> : <strong>{value}</strong>}
    </div>
  );
}

function StatusPill({ value, toneOverride }: { value: string; toneOverride?: string }) {
  const tone = toneOverride ?? ops.getStatusTone(value);

  return <span className={`status-pill status-pill--${tone}`}>{value}</span>;
}

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <div className="section-heading section-heading--stack">
        <div>
          <p className="section-kicker">{title}</p>
          <h2>{title}</h2>
        </div>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldShell({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label className="field field--rich" htmlFor={htmlFor}>
      <span className="field__label">
        {label}
        {required ? <em>Required</em> : null}
      </span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  onBlur,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
  type?: 'text' | 'date';
}) {
  const id = useId();

  return (
    <FieldShell label={label} required={required} error={error} htmlFor={id}>
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
    </FieldShell>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const id = useId();

  return (
    <FieldShell label={label} htmlFor={id}>
      <textarea id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={5} />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <FieldShell label={label} htmlFor={id}>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  const id = useId();

  return (
    <FieldShell label={label} htmlFor={id}>
      <input id={id} value={value} readOnly />
    </FieldShell>
  );
}

function SearchSelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  required,
  error,
  onBlur,
}: {
  label: string;
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selectedOption?.label ?? '');
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => `${option.label} ${option.detail} ${option.keywords}`.toLowerCase().includes(normalizedQuery))
    : options;

  return (
    <FieldShell label={label} required={required} error={error} htmlFor={id}>
      <div ref={rootRef} className={`search-select ${open ? 'is-open' : ''}`}>
        <input
          id={id}
          value={open ? query : selectedOption?.label ?? query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            setQuery(selectedOption?.label ?? '');
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={onBlur}
        />
        <button
          className="search-select__toggle"
          type="button"
          onClick={() => {
            setOpen((current) => !current);
          }}
        >
          Browse
        </button>

        {open ? (
          <div className="search-select__panel">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  className={`search-select__option ${value === option.value ? 'is-active' : ''}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onChange(option.value);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </button>
              ))
            ) : (
              <div className="search-select__empty">No matches found.</div>
            )}
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}

function LineItemsEditor({
  lineItems,
  productOptions,
  store,
  touched,
  submitCount,
  errors,
  onAddLineItem,
  onRemoveLineItem,
  onLineItemChange,
  setTouched,
}: {
  lineItems: OrderLineItem[];
  productOptions: SearchOption[];
  store: WorkspaceStore;
  touched: TouchedMap;
  submitCount: number;
  errors: ErrorMap;
  onAddLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
  onLineItemChange: (index: number, patch: Partial<OrderLineItem>) => void;
  setTouched: Dispatch<SetStateAction<TouchedMap>>;
}) {
  return (
    <div className="line-items">
      <div className="line-items__header">
        <div>
          <p className="section-kicker">Order lines</p>
          <h3>Product lines</h3>
        </div>
        <button className="secondary-button secondary-button--compact" type="button" onClick={onAddLineItem}>
          Add Line
        </button>
      </div>

      {errors.lineItems && submitCount > 0 ? <p className="line-items__error">{errors.lineItems}</p> : null}

      <div className="line-items__rows">
        {lineItems.map((lineItem, index) => {
          const preview = ops.buildPreviewFields(store, lineItem);

          return (
            <section className="line-item-row" key={lineItem.id}>
              <div className="line-item-row__header">
                <div>
                  <p className="section-kicker">Line {index + 1}</p>
                  <h3>{preview.productName || 'Select product'}</h3>
                </div>
                <button
                  className="table-action-link"
                  type="button"
                  disabled={lineItems.length === 1}
                  onClick={() => onRemoveLineItem(index)}
                >
                  Remove
                </button>
              </div>

              <div className="form-section__grid form-section__grid--line">
                <SearchSelectField
                  label="Product"
                  value={lineItem.productId}
                  options={productOptions}
                  onChange={(value) => onLineItemChange(index, { productId: value })}
                  onBlur={() => setTouchedFlag(`lineItems.${index}.productId`, setTouched)}
                  placeholder="Search product"
                  required
                  error={getVisibleError(`lineItems.${index}.productId`, errors, touched, submitCount)}
                />
                <ReadonlyField label="Product code" value={preview.productCode || 'Auto'} />
                <TextField
                  label="Quantity"
                  value={lineItem.quantity}
                  onChange={(value) => onLineItemChange(index, { quantity: value })}
                  onBlur={() => setTouchedFlag(`lineItems.${index}.quantity`, setTouched)}
                  placeholder="Enter quantity"
                  required
                  error={getVisibleError(`lineItems.${index}.quantity`, errors, touched, submitCount)}
                />
                <ReadonlyField label="Unit" value={preview.unit || 'Auto'} />
              </div>

              <TextAreaField
                label="Line notes"
                value={lineItem.notes}
                onChange={(value) => onLineItemChange(index, { notes: value })}
                placeholder="Add line-specific handling notes"
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
