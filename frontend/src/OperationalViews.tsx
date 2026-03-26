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

  return (
    <section className="workspace-layout">
      <section className="page-panel page-panel--main">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Operational form</p>
            <h2>{page.title}</h2>
          </div>
          <p className="section-copy">Category and warehouse use linked selectors, while product code and unit can fill automatically as the master data takes shape.</p>
        </div>

        <div className="form-banner">
          <p className="section-kicker">Northline pattern</p>
          <p className="section-copy">Required now: product name, category, warehouse. Save the rest only when it improves the operator handoff.</p>
        </div>

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection
            title="Basic Information"
            description="Capture the product identity first so linked fields can auto-complete downstream details."
          >
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
          </FormSection>

          <FormSection
            title="Item Details"
            description="Keep code and unit close to the linked master-data fields so operators can verify the record at a glance."
          >
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

          <FormSection title="Notes" description="Keep only the handling context that should remain visible when the record is edited later.">
            <TextAreaField
              label="Product notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add receiving, picking, or exception notes"
            />
          </FormSection>

          <FormActionBar
            title="Actions"
            description="Save a draft while the product is still taking shape, or save the product into the local operational set."
            secondaryActionLabel="Save Draft"
            primaryActionLabel={mode === 'create' ? 'Save Product' : 'Update Product'}
            onSecondaryAction={() => saveProduct(true)}
            onPrimaryAction={() => saveProduct(false)}
          />
        </form>
      </section>

      <RailFrame page={page} onNavigate={onNavigate}>
        {mode === 'edit' ? (
          <SelectionRailBlock
            title="Selected product"
            description="Switch the current product without leaving the form."
            label="Product record"
            value={selections.productId}
            options={ops.buildSelectionOptions(store, 'product')}
            onChange={(value) => setSelections((current) => ({ ...current, productId: value }))}
          />
        ) : (
          <GuidanceRailBlock
            title="Create flow"
            description={ops.buildFormSummaryDetail(store, 'product')}
            items={[
              'Category drives the code suggestion.',
              'Warehouse stays required to prevent unassigned products.',
              'Unit can start with the category recommendation and be refined only when needed.',
            ]}
          />
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{formData.productName || 'New product'}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Code" value={formData.productCode || 'Auto'} />
            <PreviewStat label="Unit" value={formData.unit || 'Auto'} />
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            <PreviewStat label="Warehouse" value={findOptionLabel(warehouseOptions, formData.warehouseId) || 'Pending'} />
          </div>
        </section>
      </RailFrame>
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

  return (
    <section className="workspace-layout">
      <section className="page-panel page-panel--main">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Operational form</p>
            <h2>{page.title}</h2>
          </div>
          <p className="section-copy">The category form stays short on purpose: operators can create structure quickly, then enrich it only when product mapping needs more context.</p>
        </div>

        <div className="form-banner">
          <p className="section-kicker">Northline pattern</p>
          <p className="section-copy">Required now: category name. The code can be generated and refined before the category becomes active.</p>
        </div>

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Basic Information" description="Create the category label first so products can start linking to it immediately.">
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

          <FormSection title="Item Details" description="Keep the live category description and status visible to reduce misclassification downstream.">
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

          <FormSection title="Notes" description="Use notes for category guidance that should remain visible when products are assigned later.">
            <TextAreaField
              label="Category notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add assignment rules, cleanup notes, or status context"
            />
          </FormSection>

          <FormActionBar
            title="Actions"
            description="Save the category in draft while the naming is still being aligned, or save it into the active local product structure."
            secondaryActionLabel="Save Draft"
            primaryActionLabel={mode === 'create' ? 'Save Category' : 'Update Category'}
            onSecondaryAction={() => saveCategory(true)}
            onPrimaryAction={() => saveCategory(false)}
          />
        </form>
      </section>

      <RailFrame page={page} onNavigate={onNavigate}>
        {mode === 'edit' ? (
          <SelectionRailBlock
            title="Selected category"
            description="Switch the current category without leaving the form."
            label="Category record"
            value={selections.categoryId}
            options={ops.buildSelectionOptions(store, 'category')}
            onChange={(value) => setSelections((current) => ({ ...current, categoryId: value }))}
          />
        ) : (
          <GuidanceRailBlock
            title="Create flow"
            description={ops.buildFormSummaryDetail(store, 'category')}
            items={[
              'Keep the name clear enough for product assignment.',
              'Use Draft while the category structure is still being reviewed.',
              'Description should help operations, not restate the name.',
            ]}
          />
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{formData.categoryName || 'New category'}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Code" value={formData.categoryCode || 'Auto'} />
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            <PreviewStat label="Linked products" value={String(linkedProductCount)} />
          </div>
        </section>
      </RailFrame>
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

  const totalUnits = sumQuantities(formData.lineItems);

  return (
    <section className="workspace-layout">
      <section className="page-panel page-panel--main">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Operational form</p>
            <h2>{page.title}</h2>
          </div>
          <p className="section-copy">The inbound flow keeps header fields, line items, and notes separate so receiving teams can move quickly without missing warehouse context.</p>
        </div>

        <div className="form-banner">
          <p className="section-kicker">Northline pattern</p>
          <p className="section-copy">Required now: warehouse, supplier, and one product line. Product code and unit are pulled from the selected product automatically.</p>
        </div>

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Basic Information" description="Capture the inbound header first so the receiving queue has warehouse ownership and supplier context immediately.">
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

          <FormSection title="Item Details" description="Each line keeps the linked product searchable while code and unit fill in automatically to reduce receiving errors.">
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

          <FormSection title="Notes" description="Use notes for dock instructions, QC handoff, or supplier-specific exceptions that should travel with the receipt.">
            <TextAreaField
              label="Inbound notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add receipt instructions or follow-up context"
            />
          </FormSection>

          <FormActionBar
            title="Actions"
            description="Save the inbound header and lines without final confirmation, or confirm the receipt once quantities are ready."
            secondaryActionLabel="Save Draft"
            primaryActionLabel="Confirm Receipt"
            onSecondaryAction={() => saveInbound(false)}
            onPrimaryAction={() => saveInbound(true)}
          />
        </form>
      </section>

      <RailFrame page={page} onNavigate={onNavigate}>
        {mode === 'edit' ? (
          <SelectionRailBlock
            title="Selected inbound"
            description="Switch the current receipt without leaving the form."
            label="Inbound order"
            value={selections.inboundId}
            options={ops.buildSelectionOptions(store, 'inbound')}
            onChange={(value) => setSelections((current) => ({ ...current, inboundId: value }))}
          />
        ) : (
          <GuidanceRailBlock
            title="Receipt flow"
            description={ops.buildFormSummaryDetail(store, 'inbound')}
            items={[
              'Header fields establish warehouse ownership before item entry.',
              'Line items should always be product-led, not free text.',
              'Confirm Receipt should be the last action after quantity review.',
            ]}
          />
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{formData.inboundNo || 'New inbound'}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            <PreviewStat label="Supplier" value={formData.supplierName || 'Pending'} />
            <PreviewStat label="Lines" value={String(ops.countLineItems(formData.lineItems))} />
            <PreviewStat label="Qty total" value={String(totalUnits)} />
          </div>
        </section>
      </RailFrame>
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

  const totalUnits = sumQuantities(formData.lineItems);

  return (
    <section className="workspace-layout">
      <section className="page-panel page-panel--main">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Operational form</p>
            <h2>{page.title}</h2>
          </div>
          <p className="section-copy">The outbound flow keeps shipment planning, line items, and dispatch notes separate so teams can move from picking to confirmation without losing context.</p>
        </div>

        <div className="form-banner">
          <p className="section-kicker">Northline pattern</p>
          <p className="section-copy">Required now: warehouse, destination, and one product line. Product code and unit come from the selected product automatically.</p>
        </div>

        <form
          className="workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FormSection title="Basic Information" description="Capture the shipment header first so the dispatch queue has warehouse ownership, destination, and carrier context immediately.">
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

          <FormSection title="Item Details" description="Each line keeps the linked product searchable while code and unit fill in automatically to reduce picking and dispatch errors.">
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

          <FormSection title="Notes" description="Use notes for staging, carrier, or dispatch instructions that should remain visible through shipment confirmation.">
            <TextAreaField
              label="Outbound notes"
              value={formData.notes}
              onChange={(value) => updateField('notes', value)}
              placeholder="Add dispatch instructions or exception notes"
            />
          </FormSection>

          <FormActionBar
            title="Actions"
            description="Save the shipment as work in progress, or confirm shipment once the outbound order is ready to leave."
            secondaryActionLabel="Save Draft"
            primaryActionLabel="Confirm Shipment"
            onSecondaryAction={() => saveOutbound(false)}
            onPrimaryAction={() => saveOutbound(true)}
          />
        </form>
      </section>

      <RailFrame page={page} onNavigate={onNavigate}>
        {mode === 'edit' ? (
          <SelectionRailBlock
            title="Selected outbound"
            description="Switch the current shipment without leaving the form."
            label="Outbound order"
            value={selections.outboundId}
            options={ops.buildSelectionOptions(store, 'outbound')}
            onChange={(value) => setSelections((current) => ({ ...current, outboundId: value }))}
          />
        ) : (
          <GuidanceRailBlock
            title="Shipment flow"
            description={ops.buildFormSummaryDetail(store, 'outbound')}
            items={[
              'Header fields establish destination and warehouse ownership before line entry.',
              'Line items should always use product search to avoid code mismatch.',
              'Confirm Shipment should be the last action after packing review.',
            ]}
          />
        )}

        <section className="rail-block">
          <div className="section-heading section-heading--stack">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>{formData.outboundNo || 'New outbound'}</h2>
            </div>
          </div>

          <div className="preview-grid">
            <PreviewStat label="Status" value={formData.status} tone={ops.getStatusTone(formData.status)} />
            <PreviewStat label="Destination" value={formData.destination || 'Pending'} />
            <PreviewStat label="Lines" value={String(ops.countLineItems(formData.lineItems))} />
            <PreviewStat label="Qty total" value={String(totalUnits)} />
          </div>
        </section>
      </RailFrame>
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

function findOptionLabel(options: SearchOption[], value: string) {
  return options.find((option) => option.value === value)?.label;
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

function GuidanceRailBlock({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <section className="rail-block">
      <div className="section-heading section-heading--stack">
        <div>
          <p className="section-kicker">Workflow notes</p>
          <h2>{title}</h2>
        </div>
        <p className="section-copy">{description}</p>
      </div>

      <ul className="mono-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function SelectionRailBlock({
  title,
  description,
  label,
  value,
  options,
  onChange,
}: {
  title: string;
  description: string;
  label: string;
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
}) {
  return (
    <section className="rail-block">
      <div className="section-heading section-heading--stack">
        <div>
          <p className="section-kicker">Selected record</p>
          <h2>{title}</h2>
        </div>
        <p className="section-copy">{description}</p>
      </div>

      <SearchSelectField label={label} value={value} options={options} onChange={onChange} placeholder={`Search ${title.toLowerCase()}`} />
    </section>
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

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <div className="section-heading section-heading--stack">
        <div>
          <p className="section-kicker">{title}</p>
          <h2>{title}</h2>
        </div>
        <p className="section-copy">{description}</p>
      </div>
      {children}
    </section>
  );
}

function FormActionBar({
  title,
  description,
  secondaryActionLabel,
  primaryActionLabel,
  onSecondaryAction,
  onPrimaryAction,
}: {
  title: string;
  description: string;
  secondaryActionLabel: string;
  primaryActionLabel: string;
  onSecondaryAction: () => void;
  onPrimaryAction: () => void;
}) {
  return (
    <section className="form-section form-section--actions">
      <div className="section-heading section-heading--stack">
        <div>
          <p className="section-kicker">{title}</p>
          <h2>{title}</h2>
        </div>
        <p className="section-copy">{description}</p>
      </div>

      <div className="button-row">
        <button className="secondary-button" type="button" onClick={onSecondaryAction}>
          {secondaryActionLabel}
        </button>
        <button className="primary-button" type="button" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </button>
      </div>
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
          <p className="section-kicker">Line items</p>
          <h3>Header + item rows</h3>
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
