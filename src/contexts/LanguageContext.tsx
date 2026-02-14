import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation objects
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    products: 'Products',
    inventory: 'Inventory',
    purchases: 'Purchases',
    sales: 'Sales',
    clients: 'Clients',
    suppliers: 'Suppliers',
    fixedAssets: 'Fixed Assets',
    investments: 'Investments',
    prepaidExpenses: 'Prepaid Expenses',
    payments: 'Payments',
    cashRegister: 'Cash Register',
    adjustments: 'Adjustments',
    reports: 'Reports',
    
    // Common Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    print: 'Print',
    close: 'Close',
    submit: 'Submit',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    
    // Common Fields
    code: 'Code',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    notes: 'Notes',
    
    // Dashboard
    totalSales: 'Total Sales',
    totalClients: 'Total Clients',
    totalPurchases: 'Total Purchases',
    netRevenue: 'Net Revenue',
    profit: 'Profit',
    loss: 'Loss',
    lowStockAlert: 'Low Stock Alert',
    recentSales: 'Recent Sales',
    recentPurchases: 'Recent Purchases',
    unpaidSales: 'Unpaid Sales',
    unpaidPurchases: 'Unpaid Purchases',
    totalProducts: 'Total Products',
    activeProducts: 'Active Products',
    loadingDashboard: 'Loading dashboard...',
    noSalesYet: 'No sales yet',
    noPurchasesYet: 'No purchases yet',
    
    // Inventory
    inventorySheet: 'Inventory Sheet',
    trackPurchasesAndSales: 'Track purchases and sales of goods',
    exportToExcel: 'Export to Excel',
    startDate: 'Start Date',
    endDate: 'End Date',
    productFilter: 'Product Filter',
    allProducts: 'All Products',
    searchProduct: 'Search Product',
    registrationNo: 'Registration No.',
    rncSupplier: 'RNC Supplier',
    operation: 'Operation',
    amountInAmount: 'Amount in Amount',
    balanceInAmount: 'Balance in Amount',
    balanceIn: 'Balance in',
    balanceInQuantity: 'Balance in Quantity',
    averageUnitCost: 'Average Unit Cost',
    year: 'Year',
    month: 'Month',
    currentBalance: 'Current Balance',
    averageCost: 'Average Cost',
    totalIncome: 'Total Income',
    totalCost: 'Total Cost',
    grossMargin: 'Gross Margin',
    grossMarginPercent: '% Gross Margin',
    grossMarginOnRevenue: '% Gross Margin on Revenue',
    grossMarginOnCost: '% Gross Margin on Cost',
    noInventoryMovements: 'No inventory movements found for the selected criteria',
    adjustDateRange: 'Try adjusting your date range or product filter',
    
    // Payments
    paymentsManagement: 'Payments Management',
    trackPayments: 'Track payments to suppliers and from clients',
    newPayment: 'New Payment',
    editPayment: 'Edit Payment',
    paymentsOut: 'Payments Out',
    paymentsIn: 'Payments In',
    netCashFlow: 'Net Cash Flow',
    allPaymentTypes: 'All Payment Types',
    paymentOut: 'Payment Out',
    paymentIn: 'Payment In',
    toSuppliers: 'To Suppliers',
    fromClients: 'From Clients',
    paymentOutToSupplier: 'Payment Out (To Supplier)',
    paymentInFromClient: 'Payment In (From Client)',
    invoicesToApply: 'Invoices to which this payment will be applied',
    listOutstandingCredit: 'List outstanding credit invoices',
    listOutstandingCash: 'List outstanding cash invoices',
    invoiceNo: 'Invoice No.',
    balancePending: 'Balance Pending',
    amountToPay: 'Amount to Pay',
    totalAmountToApply: 'Total Amount to Apply',
    
    // Products
    newProduct: 'New Product',
    productCode: 'Product Code',
    productName: 'Product Name',
    description: 'Description',
    unitOfMeasurement: 'Unit of Measurement',
    amount: 'Amount',
    quantity: 'Quantity',
    unitPrice: 'Unit Cost',
    unitCost: 'Unit Cost',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxRate: 'Tax Rate',
    taxAmount: 'Tax Amount',
    total: 'Total',
    stock: 'Stock',
    category: 'Category',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    price: 'Price',
    
    // Purchases
    newPurchase: 'New Purchase',
    registrationNumber: 'Registration Number',
    registrationDate: 'Registration Date',
    date: 'Date',
    supplier: 'Supplier',
    supplierRnc: "Supplier's RNC",
    supplierName: 'Supplier Name',
    selectSupplier: 'Select a supplier',
    ncf: 'NCF',
    purchaseType: 'Purchase Type',
    paymentTerms: 'Payment Terms',
    paymentMethod: 'Payment Method',
    paymentStatus: 'Payment Status',
    cash: 'Cash',
    credit: 'Credit',
    bankTransfer: 'Bank Transfer',
    creditCard: 'Credit Card',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    paidAmount: 'Paid Amount',
    balance: 'Balance',
    balanceDue: 'Balance Due',
    
    // Associated Invoices
    associatedInvoices: 'Other Invoices Associated with this Purchase',
    addInvoice: 'Add Invoice',
    concept: 'Concept',
    purchaseOf: 'Purchase of:',
    freight: 'Freight',
    customs: 'Customs',
    insurance: 'Insurance',
    handling: 'Handling',
    storage: 'Storage',
    other: 'Other',
    
    // Sales
    newSale: 'New Sale',
    client: 'Client',
    clientRnc: "Client's RNC",
    clientName: 'Client Name',
    selectClient: 'Select a client',
    saleType: 'Sale Type',
    discount: 'Discount',
    newClient: 'New Client',
    editClient: 'Edit Client',
    idTaxNumber: 'ID/Tax Number',
    rncsupplier: 'RNC Supplier',
    
    // Suppliers
    newSupplier: 'New Supplier',
    editSupplier: 'Edit Supplier',
    
    // Forms
    required: 'Required',
    optional: 'Optional',
    enterValue: 'Enter value',
    selectOption: 'Select option',
    
    // Table Headers
    actions: 'Actions',
    viewDetails: 'View Details',
    makePayment: 'Make Payment',
    collectPayment: 'Collect Payment',
    
    // Messages
    successCreate: 'Created successfully',
    successUpdate: 'Updated successfully',
    successDelete: 'Deleted successfully',
    errorCreate: 'Error creating',
    errorUpdate: 'Error updating',
    errorDelete: 'Error deleting',
    confirmDelete: 'Are you sure you want to delete this item?',
    noData: 'No data available',
    loading: 'Loading...',
    
    // Purchase Summary
    purchaseSummary: 'Purchase Summary',
    productTotal: 'Product Total',
    associatedCosts: 'Associated Costs',
    grandTotal: 'GRAND TOTAL',
    createPurchase: 'Create Purchase',
    createSale: 'Create Sale',
    
    // Misc
    show: 'Show',
    hide: 'Hide',
    merchandiseForSale: 'Merchandise for sale or consumption',
    service: 'Service',
    fixedAsset: 'Fixed Asset',
    completed: 'Completed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    saleNumber: 'Sale Number',
    purchaseNumber: 'Purchase Number',
    totalAmount: 'Total Amount',
    paymentAmount: 'Payment Amount',
    paymentType: 'Payment Type',
    addProducts: 'Add Products',
    product: 'Product',
    qty: 'Qty',
    
    // Payment Alerts and Messages
    noOutstandingInvoicesSupplier: '⚠️ No outstanding invoices found for this supplier.\n\nPossible reasons:\n1. All purchases are paid\n2. Purchases are Cash type (not Credit)\n3. No purchases exist for this supplier',
    noOutstandingInvoicesClient: '⚠️ No outstanding invoices found for this client.\n\nPossible reasons:\n1. All sales are paid\n2. Sales are Cash type (not Credit)\n3. No sales exist for this client',
    errorLoadingInvoices: 'Error loading outstanding invoices. Check console for details.',
    pleaseSelectEntity: 'Please select a supplier or client',
    warningNoInvoices: '⚠️ WARNING: No invoices selected!\n\nThis payment will be recorded but NOT applied to any invoices.\nThe purchase/sale balances will NOT be updated.\n\nDo you want to continue anyway?\n\nClick "Cancel" to go back and select invoices.',
    paymentSavedSuccess: '✅ Payment saved successfully!\n\nApplied to {count} invoice(s).',
    paymentSavedNoInvoices: '⚠️ Payment saved but NOT applied to any invoices.\n\nYou can delete and recreate it with invoice selection.',
    selectSupplierOrClient: 'Select Supplier/Client',
    invoicesToApplyPayment: 'Invoices to which this payment will be applied',
    checkToSelect: 'Check to select invoice',
    totalToApply: 'Total Amount to Apply',
    overpaymentDetected: 'Overpayment Detected',
    overpaymentMessage: 'Payment amount ({payment}) exceeds total applied amount ({applied}). The excess amount of {excess} will be recorded as a credit balance for future use.',
    enterValidAmount: 'Please enter a valid payment amount',
  },
  
  es: {
    // Navegación
    dashboard: 'Panel',
    products: 'Productos',
    inventory: 'Inventario',
    purchases: 'Compras',
    sales: 'Ventas',
    clients: 'Clientes',
    suppliers: 'Proveedores',
    fixedAssets: 'Activos Fijos',
    investments: 'Inversiones',
    prepaidExpenses: 'Gastos Prepagados',
    payments: 'Pagos',
    cashRegister: 'Caja',
    adjustments: 'Ajustes',
    reports: 'Reportes',
    
    // Acciones Comunes
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    print: 'Imprimir',
    close: 'Cerrar',
    submit: 'Enviar',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    
    // Campos Comunes
    code: 'Código',
    name: 'Nombre',
    phone: 'Teléfono',
    address: 'Dirección',
    notes: 'Notas',
    
    // Panel
    totalSales: 'Total de Ventas',
    totalClients: 'Total de Clientes',
    totalPurchases: 'Total de Compras',
    netRevenue: 'Ingresos Netos',
    profit: 'Ganancia',
    loss: 'Pérdida',
    lowStockAlert: 'Alerta de Stock Bajo',
    recentSales: 'Ventas Recientes',
    recentPurchases: 'Compras Recientes',
    unpaidSales: 'Ventas No Pagadas',
    unpaidPurchases: 'Compras No Pagadas',
    totalProducts: 'Total de Productos',
    activeProducts: 'Productos Activos',
    loadingDashboard: 'Cargando panel...',
    noSalesYet: 'Aún no hay ventas',
    noPurchasesYet: 'Aún no hay compras',
    
    // Inventario
    inventorySheet: 'Hoja de Inventario',
    trackPurchasesAndSales: 'Seguimiento de compras y ventas de mercancías',
    exportToExcel: 'Exportar a Excel',
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Fin',
    productFilter: 'Filtro de Producto',
    allProducts: 'Todos los Productos',
    searchProduct: 'Buscar Producto',
    registrationNo: 'Número de Registro',
    rncSupplier: 'RNC Proveedor',
    operation: 'Operación',
    amountInAmount: 'Cantidad en Monto',
    balanceInAmount: 'Saldo en Monto',
    balanceIn: 'Saldo en',
    balanceInQuantity: 'Saldo en Cantidad',
    averageUnitCost: 'Costo Unitario Promedio',
    year: 'Año',
    month: 'Mes',
    currentBalance: 'Saldo Actual',
    averageCost: 'Costo Promedio',
    totalIncome: 'Ingresos Totales',
    totalCost: 'Costo Total',
    grossMargin: 'Margen Bruto',
    grossMarginPercent: '% Margen Bruto',
    grossMarginOnRevenue: '% Margen Bruto sobre Ingresos',
    grossMarginOnCost: '% Margen Bruto sobre Costo',
    noInventoryMovements: 'No se encontraron movimientos de inventario para los criterios seleccionados',
    adjustDateRange: 'Intente ajustar su rango de fechas o filtro de producto',
    
    // Pagos
    paymentsManagement: 'Gestión de Pagos',
    trackPayments: 'Seguimiento de pagos a proveedores y de clientes',
    newPayment: 'Nuevo Pago',
    editPayment: 'Editar Pago',
    paymentsOut: 'Pagos Salientes',
    paymentsIn: 'Pagos Entrantes',
    netCashFlow: 'Flujo de Caja Neto',
    allPaymentTypes: 'Todos los Tipos de Pago',
    paymentOut: 'Pago Saliente',
    paymentIn: 'Pago Entrante',
    toSuppliers: 'A Proveedores',
    fromClients: 'De Clientes',
    paymentOutToSupplier: 'Pago Saliente (A Proveedor)',
    paymentInFromClient: 'Pago Entrante (De Cliente)',
    invoicesToApply: 'Facturas a las que se aplicará este pago',
    listOutstandingCredit: 'Listar facturas de crédito pendientes',
    listOutstandingCash: 'Listar facturas de efectivo pendientes',
    invoiceNo: 'Número de Factura',
    balancePending: 'Saldo Pendiente',
    amountToPay: 'Monto a Pagar',
    totalAmountToApply: 'Monto Total a Aplicar',
    
    // Productos
    newProduct: 'Nuevo Producto',
    productCode: 'Código de Producto',
    productName: 'Nombre del Producto',
    description: 'Descripción',
    unitOfMeasurement: 'Unidad de Medida',
    amount: 'Cantidad',
    quantity: 'Cantidad',
    unitPrice: 'Costo Unitario',
    unitCost: 'Costo Unitario',
    subtotal: 'Subtotal',
    tax: 'Impuesto',
    taxRate: 'Tasa de Impuesto',
    taxAmount: 'Monto de Impuesto',
    total: 'Total',
    stock: 'Existencia',
    category: 'Categoría',
    status: 'Estado',
    active: 'Activo',
    inactive: 'Inactivo',
    price: 'Precio',
    
    // Compras
    newPurchase: 'Nueva Compra',
    registrationNumber: 'Número de Registro',
    registrationDate: 'Fecha de Registro',
    date: 'Fecha',
    supplier: 'Proveedor',
    supplierRnc: 'RNC del Proveedor',
    supplierName: 'Nombre del Proveedor',
    selectSupplier: 'Seleccionar un proveedor',
    ncf: 'NCF',
    purchaseType: 'Tipo de Compra',
    paymentTerms: 'Términos de Pago',
    paymentMethod: 'Método de Pago',
    paymentStatus: 'Estado de Pago',
    cash: 'Efectivo',
    credit: 'Crédito',
    bankTransfer: 'Transferencia Bancaria',
    creditCard: 'Tarjeta de Crédito',
    paid: 'Pagado',
    unpaid: 'No Pagado',
    partial: 'Parcial',
    paidAmount: 'Monto Pagado',
    balance: 'Saldo',
    balanceDue: 'Saldo Pendiente',
    
    // Facturas Asociadas
    associatedInvoices: 'Otras Facturas Asociadas con esta Compra',
    addInvoice: 'Agregar Factura',
    concept: 'Concepto',
    purchaseOf: 'Compra de:',
    freight: 'Flete',
    customs: 'Aduanas',
    insurance: 'Seguro',
    handling: 'Manejo',
    storage: 'Almacenamiento',
    other: 'Otro',
    
    // Ventas
    newSale: 'Nueva Venta',
    client: 'Cliente',
    clientRnc: 'RNC del Cliente',
    clientName: 'Nombre del Cliente',
    selectClient: 'Seleccionar un cliente',
    saleType: 'Tipo de Venta',
    discount: 'Descuento',
    newClient: 'Nuevo Cliente',
    editClient: 'Editar Cliente',
    idTaxNumber: 'ID/Número Fiscal',
    rncsupplier: 'ID Fiscal',
    
    // Proveedores
    newSupplier: 'Nuevo Proveedor',
    editSupplier: 'Editar Proveedor',
    
    // Formularios
    required: 'Requerido',
    optional: 'Opcional',
    enterValue: 'Ingresar valor',
    selectOption: 'Seleccionar opción',
    
    // Encabezados de Tabla
    actions: 'Acciones',
    viewDetails: 'Ver Detalles',
    makePayment: 'Realizar Pago',
    collectPayment: 'Cobrar Pago',
    
    // Mensajes
    successCreate: 'Creado exitosamente',
    successUpdate: 'Actualizado exitosamente',
    successDelete: 'Eliminado exitosamente',
    errorCreate: 'Error al crear',
    errorUpdate: 'Error al actualizar',
    errorDelete: 'Error al eliminar',
    confirmDelete: '¿Está seguro de que desea eliminar este elemento?',
    noData: 'No hay datos disponibles',
    loading: 'Cargando...',
    
    // Resumen de Compra
    purchaseSummary: 'Resumen de Compra',
    productTotal: 'Total de Productos',
    associatedCosts: 'Costos Asociados',
    grandTotal: 'TOTAL GENERAL',
    createPurchase: 'Crear Compra',
    createSale: 'Crear Venta',
    
    // Varios
    show: 'Mostrar',
    hide: 'Ocultar',
    merchandiseForSale: 'Mercancía para venta o consumo',
    service: 'Servicio',
    fixedAsset: 'Activo Fijo',
    completed: 'Completado',
    pending: 'Pendiente',
    cancelled: 'Cancelado',
    saleNumber: 'Número de Venta',
    purchaseNumber: 'Número de Compra',
    totalAmount: 'Monto Total',
    paymentAmount: 'Monto de Pago',
    paymentType: 'Tipo de Pago',
    addProducts: 'Agregar Productos',
    product: 'Producto',
    qty: 'Cant',
    
    // Alertas y Mensajes de Pago
    noOutstandingInvoicesSupplier: '⚠️ No se encontraron facturas pendientes para este proveedor.\n\nPosibles razones:\n1. Todas las compras están pagadas\n2. Las compras son de tipo Efectivo (no Crédito)\n3. No existen compras para este proveedor',
    noOutstandingInvoicesClient: '⚠️ No se encontraron facturas pendientes para este cliente.\n\nPosibles razones:\n1. Todas las ventas están pagadas\n2. Las ventas son de tipo Efectivo (no Crédito)\n3. No existen ventas para este cliente',
    errorLoadingInvoices: 'Error al cargar facturas pendientes. Revise la consola para más detalles.',
    pleaseSelectEntity: 'Por favor seleccione un proveedor o cliente',
    warningNoInvoices: '⚠️ ADVERTENCIA: ¡No se seleccionaron facturas!\n\nEste pago se registrará pero NO se aplicará a ninguna factura.\nLos saldos de compra/venta NO se actualizarán.\n\n¿Desea continuar de todos modos?\n\nHaga clic en "Cancelar" para volver y seleccionar facturas.',
    paymentSavedSuccess: '✅ ¡Pago guardado exitosamente!\n\nAplicado a {count} factura(s).',
    paymentSavedNoInvoices: '⚠️ Pago guardado pero NO aplicado a ninguna factura.\n\nPuede eliminarlo y recrearlo con selección de facturas.',
    selectSupplierOrClient: 'Seleccionar Proveedor/Cliente',
    invoicesToApplyPayment: 'Facturas a las que se aplicará este pago',
    checkToSelect: 'Marcar para seleccionar factura',
    totalToApply: 'Monto Total a Aplicar',
    overpaymentDetected: 'Sobrepago Detectado',
    overpaymentMessage: 'El monto del pago ({payment}) excede el monto total aplicado ({applied}). El exceso de {excess} se registrará como saldo a crédito para uso futuro.',
    enterValidAmount: 'Por favor ingrese un monto de pago válido',
  }
};

type Language = 'en' | 'es';
type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get saved language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'es') ? saved : 'en';
  });

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
