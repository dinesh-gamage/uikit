import { useMemo, useState, type ReactNode } from 'react';
import { defaultValues, type ControlDef, type ControlValues } from './controls';
import './demo-page.scss';

export interface DemoDef {
  title: string;
  description?: string;
  controls: ControlDef[];
  render: (values: ControlValues) => ReactNode;
  code: (values: ControlValues) => string;
}

function ControlInput({ def, value, onChange }: { def: ControlDef; value: any; onChange: (v: any) => void }) {
  switch (def.type) {
    case 'boolean':
      return (
        <label className="sc-control__toggle">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span />
        </label>
      );
    case 'select':
      return (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {def.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          min={def.min}
          max={def.max}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    case 'json':
      return <JsonControl value={value} onChange={onChange} />;
    default:
      return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

function JsonControl({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2) ?? '');
  const [invalid, setInvalid] = useState(false);
  return (
    <textarea
      className={invalid ? 'sc-control__json sc-control__json--invalid' : 'sc-control__json'}
      value={text}
      rows={6}
      spellCheck={false}
      onChange={(e) => {
        setText(e.target.value);
        try {
          onChange(JSON.parse(e.target.value));
          setInvalid(false);
        } catch {
          setInvalid(true);
        }
      }}
    />
  );
}

export function DemoPage({ demo }: { demo: DemoDef }) {
  const [values, setValues] = useState<ControlValues>(() => defaultValues(demo.controls));
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => demo.code(values), [demo, values]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="sc-demo">
      <div className="sc-demo__head">
        <h1>{demo.title}</h1>
        {demo.description && <p>{demo.description}</p>}
      </div>
      <div className="sc-demo__body">
        <div className="sc-demo__stage">
          <div className="sc-demo__preview">{demo.render(values)}</div>
          <div className="sc-demo__codebar">
            <button onClick={() => setShowCode((s) => !s)}>{showCode ? 'Hide code' : 'Show code'}</button>
            <button onClick={copy}>{copied ? 'Copied!' : 'Copy code'}</button>
          </div>
          {showCode && <pre className="sc-demo__code"><code>{code}</code></pre>}
        </div>
        {demo.controls.length > 0 && (
          <aside className="sc-demo__controls">
            <h2>Props</h2>
            {demo.controls.map((c) => (
              <div className="sc-control" key={c.name}>
                <label>{c.label ?? c.name}</label>
                <ControlInput def={c} value={values[c.name]} onChange={(v) => setValues((s) => ({ ...s, [c.name]: v }))} />
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
