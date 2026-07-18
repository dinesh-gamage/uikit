import { useState } from 'react';
import { Pagination } from '../../src/pagination';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

function Stage({ v }: { v: ControlValues }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(v.pageSize as number);
  const unknownTotal = !!v.unknownTotal;
  const total = v.total as number;
  const remaining = Math.max(total - (page - 1) * pageSize, 0);
  const pageLength = Math.min(pageSize, remaining);

  return (
    <div className="sc-demo-widgets__stack sc-demo-widgets__stack--wide">
      <Pagination
        page={page}
        pageSize={pageSize}
        total={unknownTotal ? undefined : total}
        pageLength={unknownTotal ? pageLength : undefined}
        compact={!!v.compact}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      <span className="sc-demo-widgets__result">page {page}</span>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Pagination',
  description:
    'Standalone pagination control — range label, page-size select, and prev/next buttons. Supports an unknown-total ("load more"-style) mode driven by how many items actually rendered on the current page.',
  controls: [
    { type: 'number', name: 'total', defaultValue: 87, min: 0, max: 500 },
    { type: 'number', name: 'pageSize', defaultValue: 20, min: 1, max: 100 },
    { type: 'boolean', name: 'compact', defaultValue: false },
    { type: 'boolean', name: 'unknownTotal', label: 'unknown total', defaultValue: false },
  ],
  render: (v) => <Stage key={JSON.stringify(v)} v={v} />,
  code: (v) => {
    const props = [
      v.unknownTotal ? ' pageLength={pageLength}' : ` total={${v.total}}`,
      ` pageSize={${v.pageSize}}`,
      v.compact ? ' compact' : '',
    ].join('');
    return `import { Pagination } from '@dinesh-gamage/uikit/pagination';

<Pagination page={page}${props} onPageChange={setPage} onPageSizeChange={setPageSize} />`;
  },
};

export default function PaginationDemo() {
  return <DemoPage demo={demo} />;
}
