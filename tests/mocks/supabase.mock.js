/**
 * Supabaseモック - テスト用のSupabaseクライアントモック
 */

class SupabaseMock {
  constructor() {
    this.mockData = {
      users: [],
      workouts: [],
      exercises: [],
      profiles: [],
    };
    this.currentUser = null;
  }

  // テーブル操作のモック
  from(table) {
    return new TableMock(table, this.mockData);
  }

  // 認証のモック
  get auth() {
    return {
      signUp: async (credentials) => {
        const { email, password } = credentials;
        if (!email || !password) {
          return {
            data: null,
            error: { message: 'メールアドレスとパスワードが必要です' },
          };
        }

        const user = {
          id: 'user-' + Date.now(),
          email,
          created_at: new Date().toISOString(),
        };

        this.mockData.users.push(user);
        this.currentUser = user;

        return { data: { user }, error: null };
      },

      signInWithPassword: async (credentials) => {
        const { email, password } = credentials;
        const user = this.mockData.users.find((u) => u.email === email);

        if (!user) {
          return { data: null, error: { message: 'ユーザーが見つかりません' } };
        }

        this.currentUser = user;
        return { data: { user }, error: null };
      },

      signOut: async () => {
        this.currentUser = null;
        return { error: null };
      },

      getUser: async () => {
        return { data: { user: this.currentUser }, error: null };
      },

      getSession: async () => {
        return {
          data: {
            session: this.currentUser ? { user: this.currentUser } : null,
          },
          error: null,
        };
      },

      onAuthStateChange: (callback) => {
        // モック実装 - 実際のコールバックは呼ばない
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    };
  }

  // リアルタイム機能のモック
  channel(name) {
    return {
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    };
  }

  // ストレージのモック
  get storage() {
    return {
      from: (bucket) => ({
        upload: async (path, file) => {
          return { data: { path }, error: null };
        },
        download: async (path) => {
          return { data: new Blob(), error: null };
        },
        remove: async (paths) => {
          return { data: [], error: null };
        },
      }),
    };
  }

  // モックデータをリセット
  resetMockData() {
    this.mockData = {
      users: [],
      workouts: [],
      exercises: [],
      profiles: [],
    };
    this.currentUser = null;
  }

  // テスト用データを設定
  setMockData(table, data) {
    this.mockData[table] = data;
  }

  // 現在のユーザーを設定
  setCurrentUser(user) {
    this.currentUser = user;
  }
}

class TableMock {
  constructor(tableName, mockData) {
    this.tableName = tableName;
    this.mockData = mockData;
    this.query = {
      select: '*',
      filters: [],
      order: null,
      limit: null,
    };
  }

  select(columns = '*') {
    this.query.select = columns;
    return this;
  }

  eq(column, value) {
    this.query.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this.query.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column, value) {
    this.query.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column, value) {
    this.query.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column, value) {
    this.query.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column, value) {
    this.query.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column, pattern) {
    this.query.filters.push({ type: 'like', column, pattern });
    return this;
  }

  in(column, values) {
    this.query.filters.push({ type: 'in', column, values });
    return this;
  }

  order(column, options = {}) {
    this.query.order = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  single() {
    return this._execute().then((result) => {
      if (result.error) return result;
      return {
        data: result.data && result.data.length > 0 ? result.data[0] : null,
        error: null,
      };
    });
  }

  async insert(data) {
    const records = Array.isArray(data) ? data : [data];
    const insertedRecords = records.map((record) => ({
      id: record.id || 'id-' + Date.now() + '-' + Math.random(),
      ...record,
      created_at: record.created_at || new Date().toISOString(),
    }));

    this.mockData[this.tableName].push(...insertedRecords);
    return { data: insertedRecords, error: null };
  }

  async update(data) {
    const tableData = this.mockData[this.tableName];
    const filteredData = this._applyFilters(tableData);

    filteredData.forEach((record) => {
      Object.assign(record, data, { updated_at: new Date().toISOString() });
    });

    return { data: filteredData, error: null };
  }

  async delete() {
    const tableData = this.mockData[this.tableName];
    const toDelete = this._applyFilters(tableData);

    toDelete.forEach((record) => {
      const index = tableData.indexOf(record);
      if (index > -1) {
        tableData.splice(index, 1);
      }
    });

    return { data: toDelete, error: null };
  }

  async _execute() {
    try {
      let data = [...this.mockData[this.tableName]];

      // フィルターを適用
      data = this._applyFilters(data);

      // ソートを適用
      if (this.query.order) {
        data.sort((a, b) => {
          const aVal = a[this.query.order.column];
          const bVal = b[this.query.order.column];

          if (aVal < bVal) return this.query.order.ascending ? -1 : 1;
          if (aVal > bVal) return this.query.order.ascending ? 1 : -1;
          return 0;
        });
      }

      // リミットを適用
      if (this.query.limit) {
        data = data.slice(0, this.query.limit);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  }

  _applyFilters(data) {
    return data.filter((record) => {
      return this.query.filters.every((filter) => {
        const value = record[filter.column];

        switch (filter.type) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          case 'like':
            return String(value).includes(filter.pattern.replace(/%/g, ''));
          case 'in':
            return filter.values.includes(value);
          default:
            return true;
        }
      });
    });
  }

  // Promiseとして実行
  then(onResolve, onReject) {
    return this._execute().then(onResolve, onReject);
  }

  catch(onReject) {
    return this._execute().catch(onReject);
  }
}

// エクスポート
if (typeof module !== 'undefined') {
  module.exports = { SupabaseMock, TableMock };
} else if (typeof window !== 'undefined') {
  window.SupabaseMock = SupabaseMock;
  window.TableMock = TableMock;
}
