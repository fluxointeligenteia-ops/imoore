const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const uploadsPath = path.resolve(__dirname, 'uploads');
fs.mkdirSync(uploadsPath, { recursive: true });

const users = [
  {
    id: randomUUID(),
    nome: 'Admin Imoore',
    email: 'admin@imoore.com',
    senha: bcrypt.hashSync('imoore@2026', 10),
    perfil: 'admin',
    creci: '52050-J',
    telefone: '+5513991091887',
    ativo: true,
    criado_em: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    nome: 'Corretor Imoore',
    email: 'corretor@imoore.com',
    senha: bcrypt.hashSync('imoore123', 10),
    perfil: 'corretor',
    creci: '52050-J',
    telefone: '+5513991091887',
    ativo: true,
    criado_em: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    nome: 'CRM Imoore',
    email: 'crm@imoore.com',
    senha: bcrypt.hashSync('crm@2026', 10),
    perfil: 'crm',
    creci: '',
    telefone: '+5513991091887',
    ativo: true,
    criado_em: new Date().toISOString(),
  },
];

const imoveis = [];
const leads = [];

const TABLES = {
  usuarios: users,
  imoveis,
  leads,
};

const cloneRow = (row) => JSON.parse(JSON.stringify(row));

const withDefaults = (tableName, row) => {
  const item = {
    ...row,
    id: row.id || randomUUID(),
    criado_em: row.criado_em || new Date().toISOString(),
    atualizado_em: row.atualizado_em || new Date().toISOString(),
  };

  if (tableName === 'imoveis') {
    item.fotos = row.fotos || [];
    item.status = row.status || 'pendente';
  }

  return item;
};

const applyFilter = (rows, filters) => {
  if (!filters || filters.length === 0) return rows;
  return rows.filter((row) => filters.every((filter) => {
    if (filter.op === 'in') return filter.values.includes(row[filter.field]);
    return row[filter.field] === filter.value;
  }));
};

const applyOrder = (rows, orderBy) => {
  if (!orderBy) return rows;
  return [...rows].sort((a, b) => {
    const aValue = a[orderBy.column];
    const bValue = b[orderBy.column];
    if (aValue === bValue) return 0;
    if (orderBy.ascending) return aValue < bValue ? -1 : 1;
    return aValue > bValue ? -1 : 1;
  });
};

const executeQuery = async (query) => {
  const tableName = query.tableName;
  const rows = TABLES[tableName];
  if (!rows) {
    return { data: null, error: { message: `Tabela demo não suportada: ${tableName}` } };
  }

  if (query.action === 'select') {
    let result = applyFilter(rows, query.filters);
    result = applyOrder(result, query.orderBy);
    if (query.limitCount != null) {
      result = result.slice(0, query.limitCount);
    }
    return { data: result.map(cloneRow), error: null };
  }

  if (query.action === 'insert') {
    const inserted = query.rows.map((row) => {
      const item = withDefaults(tableName, row);
      rows.push(item);
      return cloneRow(item);
    });
    return { data: inserted.length === 1 ? inserted[0] : inserted, error: null };
  }

  if (query.action === 'upsert') {
    const inserted = query.rows.map((row) => {
      const conflictKey = query.onConflict;
      const existingIndex = rows.findIndex((item) => item[conflictKey] === row[conflictKey]);
      if (existingIndex >= 0) {
        rows[existingIndex] = { ...rows[existingIndex], ...row, atualizado_em: new Date().toISOString() };
        return cloneRow(rows[existingIndex]);
      }
      const item = withDefaults(tableName, row);
      rows.push(item);
      return cloneRow(item);
    });
    return { data: inserted.length === 1 ? inserted[0] : inserted, error: null };
  }

  if (query.action === 'update') {
    const targets = applyFilter(rows, query.filters);
    const updated = targets.map((item) => {
      const index = rows.findIndex((row) => row.id === item.id);
      rows[index] = { ...rows[index], ...query.updates, atualizado_em: new Date().toISOString() };
      return cloneRow(rows[index]);
    });
    return { data: updated.length === 1 ? updated[0] : updated, error: null };
  }

  if (query.action === 'delete') {
    const keep = rows.filter((item) => {
      if (!query.filters || query.filters.length === 0) return false;
      return !query.filters.every((filter) => {
        if (filter.op === 'in') return filter.values.includes(item[filter.field]);
        return item[filter.field] === filter.value;
      });
    });
    TABLES[tableName].length = 0;
    keep.forEach((item) => TABLES[tableName].push(item));
    return { data: null, error: null };
  }

  return { data: null, error: { message: 'Ação demo desconhecida' } };
};

const createQuery = (tableName) => {
  const query = {
    tableName,
    action: 'select',
    columns: '*',
    filters: [],
    orderBy: null,
    limitCount: null,
    rows: null,
    updates: null,
    onConflict: null,
  };

  const wrapper = {
    select(columns = '*') {
      if (!['insert', 'update', 'upsert'].includes(query.action)) {
        query.action = 'select';
      }
      query.columns = columns;
      return this;
    },
    eq(field, value) {
      query.filters.push({ op: 'eq', field, value });
      return this;
    },
    in(field, values) {
      query.filters.push({ op: 'in', field, values });
      return this;
    },
    order(column, opts = {}) {
      query.orderBy = { column, ascending: opts.ascending !== false };
      return this;
    },
    limit(count) {
      query.limitCount = count;
      return this;
    },
    insert(rows) {
      query.action = 'insert';
      query.rows = Array.isArray(rows) ? rows : [rows];
      return this;
    },
    upsert(rows, options = {}) {
      query.action = 'upsert';
      query.rows = Array.isArray(rows) ? rows : [rows];
      query.onConflict = options.onConflict;
      return this;
    },
    update(updates) {
      query.action = 'update';
      query.updates = updates;
      return this;
    },
    delete() {
      query.action = 'delete';
      return this;
    },
    async single() {
      const result = await executeQuery(query);
      if (Array.isArray(result.data)) {
        result.data = result.data[0] || null;
      }
      return result;
    },
    then(resolve, reject) {
      executeQuery(query).then(resolve, reject);
    },
  };

  return wrapper;
};

const createDemoClient = () => {
  return {
    isDemo: true,
    from: (tableName) => createQuery(tableName),
    storage: {
      from: () => ({
        upload: async (filePath, buffer) => {
          const filename = `${Date.now()}-${path.basename(filePath)}`;
          const targetPath = path.join(uploadsPath, filename);
          fs.writeFileSync(targetPath, buffer);
          return { error: null };
        },
        getPublicUrl: (filePath) => {
          const filename = path.basename(filePath);
          const publicUrl = `http://localhost:3001/uploads/${filename}`;
          return { data: { publicUrl } };
        },
      }),
    },
  };
};

module.exports = {
  createDemoClient,
};
