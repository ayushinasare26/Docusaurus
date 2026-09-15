const sidebars = {
  tutorialSidebar: [
    'introduction',

    {
      type: 'category',
      label: 'Dashboard',
      items: [
        'dashboard/overview',
        'dashboard/customer-summary',
        'dashboard/monthly-sales',
        'dashboard/revenue-progress',
        'dashboard/call-volume',
        'dashboard/customer-lifetime-value',
        'dashboard/top-customers',
        'dashboard/customer-demographics',
        'dashboard/connect-xero',
      ],
    },

    {
      type: 'category',
      label: 'Customer Management',
      items: [
        'customer-management/overview',
        'customer-management/customer-list',
        'customer-management/search-and-filter',
        'customer-management/customer-actions',
        'customer-management/add-customer',
      ],
    },

    {
      type: 'category',
      label: 'Invoices',
      items: [
        'invoices/overview',
        'invoices/regular',
        'invoices/manual',
      ],
    },

    {
      type: 'category',
      label: 'Reseller Invoices',
      items: [
        'reseller-invoices/overview',
      ],
    },

    {
      type: 'category',
      label: 'Call Detail Records (CDR)',
      items: [
        'cdr/overview',
        'cdr/import-cdr',
        'cdr/gamma-ipdc-upload',
        'cdr/recent-uploads',
        'cdr/validation',
        'cdr/export-cdr',
      ],
    },

    {
      type: 'category',
      label: 'Products',
      items: [
        'products/product-list',
        'products/package-groups',
      ],
    },

    {
      type: 'category',
      label: 'Payments',
      items: [
        'payments/overview',
        'payments/add-payment',
      ],
    },

    {
      type: 'category',
      label: 'One-time Payments',
      items: [
        'onetimes/overview',
        'onetimes/add-payments',
      ],
    },

    {
      type: 'category',
      label: 'DIDs',
      items: [
        'dids/overview',
      ],
    },

    {
      type: 'category',
      label: 'Equipment Settings',
      items: [
        'equipment-settings/equipment',
        'equipment-settings/manufacturers',
      ],
    },

    {
      type: 'category',
      label: 'Rate Comparison',
      items: [
        'rate-comparison/overview',
      ],
    },

    {
      type: 'category',
      label: 'Reports',
      items: [
        'reports/overview',
      ],
    },

    {
      type: 'category',
      label: 'Users',
      items: [
        'users/overview',
      ],
    },
  ],
};

module.exports = sidebars;