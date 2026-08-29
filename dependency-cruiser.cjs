module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: 'apps/mobile/src/features/[^/]+/domain' },
      to: {
        path: '^apps/mobile/src/(?:features/[^/]+/(?:data|presentation)|core|app)(?:/|$)|^node_modules/',
      },
    },
    {
      name: 'web-domain-is-pure',
      severity: 'error',
      from: { path: 'apps/web/src/core/.*/domain' },
      to: {
        path: '^apps/web/src/(?:components|hooks|providers|infrastructure|app)|^node_modules/',
      },
    },
    {
      name: 'presentation-does-not-use-data',
      severity: 'error',
      from: { path: 'apps/mobile/src/features/[^/]+/presentation' },
      to: { path: 'apps/mobile/src/features/[^/]+/data' },
    },
    {
      name: 'routes-are-adapters',
      severity: 'error',
      from: { path: 'apps/mobile/src/app' },
      to: { path: 'apps/mobile/src/features/[^/]+/(data|domain)' },
    },
    {
      name: 'mobile-does-not-import-apps',
      severity: 'error',
      from: { path: '^apps/mobile/' },
      to: { path: '^apps/(?:web|backend)/' },
    },
    {
      name: 'web-does-not-import-apps',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^apps/(?:mobile|backend)/' },
    },
    {
      name: 'backend-does-not-import-apps',
      severity: 'error',
      from: { path: '^apps/backend/' },
      to: { path: '^apps/(?:mobile|web)/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.architecture.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['types', 'import', 'require'],
    },
  },
};
