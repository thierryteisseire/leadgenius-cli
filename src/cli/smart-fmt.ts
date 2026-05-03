const ICONS: Record<string, string> = {
  email: '✉', status: '●', role: '👤', plan: '⭐', id: '#', company_id: '🏢', client_id: '📁',
  companyName: '🏢', firstName: '👤', name: '📛', createdAt: '📅', updatedAt: '🔄',
  authenticated: '✓', message: '💬', error: '✗', success: '●',
};

const STATUSES: Record<string, string> = {
  active: '\x1b[32m● active\x1b[0m', pending: '\x1b[33m● pending\x1b[0m',
  inactive: '\x1b[90m● inactive\x1b[0m', disabled: '\x1b[31m● disabled\x1b[0m',
  completed: '\x1b[32m● completed\x1b[0m', failed: '\x1b[31m● failed\x1b[0m',
  running: '\x1b[36m● running\x1b[0m', CONFIRMED: '\x1b[32m● confirmed\x1b[0m',
};

function formatVal(key: string, val: any): string {
  if (val === null || val === undefined) return '\x1b[90m—\x1b[0m';
  if (key === 'status' || key === 'apifyStatus') return STATUSES[val] || val;
  if (typeof val === 'boolean') return val ? '\x1b[32m✓ yes\x1b[0m' : '\x1b[90m✗ no\x1b[0m';
  if ((key.endsWith('At') || key === 'created' || key === 'modified' || key === 'lastUpdated') && typeof val === 'string' && val.includes('T'))
    return new Date(val).toLocaleString();
  if (Array.isArray(val)) return val.length === 0 ? '\x1b[90m(empty)\x1b[0m' : val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function labelFor(key: string): string {
  // camelCase → Title Case
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, c => c.toUpperCase()).trim();
}

function printRecord(obj: Record<string, any>, indent = '  ') {
  const keys = Object.keys(obj);
  const maxLabel = Math.max(...keys.map(k => labelFor(k).length), 10);
  for (const key of keys) {
    const label = labelFor(key).padEnd(maxLabel);
    const icon = ICONS[key] || ' ';
    console.log(`${indent}${icon} ${label}  ${formatVal(key, obj[key])}`);
  }
}

function printTable(items: any[]) {
  if (items.length === 0) { console.log('  \x1b[90m(no results)\x1b[0m'); return; }
  // Pick display columns: prefer common fields, limit to terminal width
  const allKeys = Object.keys(items[0]);
  const preferred = ['id', 'name', 'email', 'clientName', 'companyName', 'firstName', 'lastName', 'fullName', 'title', 'status', 'role', 'group', 'plan', 'type', 'platform', 'createdAt'];
  const cols = preferred.filter(k => allKeys.includes(k));
  if (cols.length < 3) { // fallback: first 6 non-object fields
    for (const k of allKeys) {
      if (cols.length >= 6) break;
      if (!cols.includes(k) && typeof items[0][k] !== 'object') cols.push(k);
    }
  }
  // Header
  const widths = cols.map(c => Math.max(labelFor(c).length, ...items.map(i => String(i[c] ?? '—').length).slice(0, 20), 4));
  const header = cols.map((c, i) => labelFor(c).padEnd(widths[i])).join('  ');
  console.log(`  \x1b[1m${header}\x1b[0m`);
  console.log(`  ${widths.map(w => '─'.repeat(w)).join('──')}`);
  // Rows (max 50)
  for (const item of items.slice(0, 50)) {
    const row = cols.map((c, i) => {
      const v = item[c];
      const s = v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v);
      return s.slice(0, 40).padEnd(widths[i]);
    }).join('  ');
    console.log(`  ${row}`);
  }
  if (items.length > 50) console.log(`  \x1b[90m... and ${items.length - 50} more\x1b[0m`);
}

export function smartFormat(res: any) {
  if (!res || typeof res !== 'object') { console.log(res); return; }

  // Error
  if (res.success === false) {
    console.log(`\n  \x1b[31m✗ ${res.error || 'Request failed'}\x1b[0m`);
    if (res.details) console.log(`  \x1b[90m${res.details}\x1b[0m`);
    if (res.code) console.log(`  \x1b[90mCode: ${res.code}\x1b[0m`);
    console.log();
    return;
  }

  const data = res.data;
  if (data === undefined || data === null) {
    if (res.message) console.log(`\n  \x1b[32m✓\x1b[0m ${res.message}\n`);
    else console.log(`\n  \x1b[32m✓\x1b[0m Success\n`);
    return;
  }

  console.log();

  // Array of items (list endpoints)
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : null;
  if (items) {
    console.log(`  \x1b[1m${items.length} result${items.length !== 1 ? 's' : ''}\x1b[0m${res.nextToken ? ' (more available)' : ''}`);
    console.log();
    if (items.length > 0 && typeof items[0] === 'object') {
      printTable(items);
    } else {
      for (const item of items) console.log(`  • ${item}`);
    }
    if (data.count !== undefined && data.count !== items.length) console.log(`\n  Total: ${data.count}`);
  }
  // Single object
  else if (typeof data === 'object') {
    printRecord(data);
  }
  // Primitive
  else {
    console.log(`  ${data}`);
  }

  if (res.message && !items) console.log(`\n  \x1b[90m${res.message}\x1b[0m`);
  console.log();
}
