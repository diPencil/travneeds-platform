/**
 * TravNeeds Modular Platform — Expanded Travel Module Catalogue
 *
 * Defines the complete commercial travel catalogue:
 *
 * 1. Travel Products:
 *    - Tours & Packages (implemented & available)
 *    - Car Rental (implemented fleet/requests foundation)
 *    - Nile Cruises (implemented within tours catalogue)
 *    - Hotels (planned)
 *    - Flights (planned)
 *    - Visas (planned)
 *    - Hajj & Umrah (planned)
 *    - Transfers & Chauffeur (planned)
 *    - Activities & Experiences (planned)
 *    - Attractions & Tickets (planned)
 *    - Rail & Bus Tickets (planned)
 *    - Travel Insurance (planned)
 *
 * 2. Travel Operations:
 *    - Group Bookings (planned)
 *    - DMC Operations (planned)
 *    - Tour Guides (planned)
 *    - Quotations & Itinerary Builder (planned)
 *    - Dynamic Packaging (planned)
 *    - Supplier Management (planned)
 *    - Corporate Travel (planned)
 *
 * 3. Business Management:
 *    - Travel CRM (implemented)
 *    - Finance & Invoicing (implemented)
 *    - Travel Expenses (planned)
 *    - B2B Agent Portal (planned)
 *    - Supplier Extranet (planned)
 *
 * Every module features truthful implementation status, dependencies, and full EN/AR/ES/IT localization.
 */

import type { ModuleManifest } from './types';
import { platformModuleRegistry } from './registry';

// ============================================================================
// 1. CORE & BASE PLATFORM
// ============================================================================

export const CorePlatformManifest: ModuleManifest = {
  id: 'core',
  name: 'TravNeeds Core Platform',
  displayName: {
    en: 'Core Platform',
    ar: 'المنصة الأساسية',
    es: 'Plataforma Principal',
    it: 'Piattaforma Principale',
  },
  description: {
    en: 'Identity, security, RBAC permissions, document sequences, media manager and audit logging.',
    ar: 'إدارة الهوية، الأمان، صلاحيات المستخدمين، تسلسل المستندات، مدير الوسائط وسجل التدقيق.',
    es: 'Identidad, seguridad, permisos RBAC, secuencias de documentos, gestor de medios y auditoría.',
    it: 'Identità, sicurezza, permessi RBAC, sequenze di documenti, gestione media e registro di controllo.',
  },
  version: '1.0.0',
  category: 'core_operations',
  lifecycle: 'implemented',
  isCore: true,
  requiredDependencies: [],
  optionalDependencies: [],
  permissions: [
    { key: 'users.manage', action: 'manage', label: { en: 'Manage staff and users', ar: 'إدارة الموظفين والمستخدمين' } },
    { key: 'roles.manage', action: 'manage', label: { en: 'Manage roles and permissions', ar: 'إدارة الأدوار والصلاحيات' } },
    { key: 'settings.edit', action: 'edit', label: { en: 'Edit settings', ar: 'تعديل الإعدادات' } },
  ],
  features: [
    { key: 'core.rbac', name: { en: 'Role-Based Access Control', ar: 'التحكم بالوصول حسب الدور' } },
    { key: 'core.audit', name: { en: 'Staff Action Audit Trail', ar: 'سجل تدقيق إجراءات الفريق' } },
  ],
  navigation: [
    { key: 'nav.dashboard', section: 'main', label: { en: 'Dashboard', ar: 'لوحة التحكم' }, href: '/admin/dashboard' },
    { key: 'nav.users', section: 'settings', label: { en: 'Users & Roles', ar: 'المستخدمون والأدوار' }, href: '/admin/users' },
  ],
  routes: {
    adminPrefix: '/admin',
    apiPrefix: '/api',
  },
};

// ============================================================================
// 2. TRAVEL PRODUCTS
// ============================================================================

export const ToursModuleManifest: ModuleManifest = {
  id: 'tours',
  name: 'Tours & Travel Packages',
  displayName: {
    en: 'Tours & Packages',
    ar: 'الرحلات والبرامج السياحية',
    es: 'Circuitos y Paquetes',
    it: 'Tour e Pacchetti',
  },
  description: {
    en: 'Multi-day packages, one-day excursions, Nile cruises, Shore trips, and 11-step interactive builder.',
    ar: 'باقات الرحلات متعددة الأيام، الرحلات اليومية، كروز النيل، والرحلات الشاطئية مع منشئ الرحلات التفاعلي.',
  },
  version: '1.0.0',
  category: 'travel_products',
  lifecycle: 'available_for_subscription',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['transfers', 'car_rental'],
  permissions: [
    { key: 'tours.view', action: 'view', label: { en: 'View Tours', ar: 'عرض الرحلات' } },
    { key: 'tours.edit', action: 'edit', label: { en: 'Create & Edit Tours', ar: 'إنشاء وتعديل الرحلات' } },
    { key: 'tours.publish', action: 'publish', label: { en: 'Publish Tours', ar: 'نشر الرحلات' } },
  ],
  features: [
    { key: 'tours.builder', name: { en: '11-Step Trip Builder', ar: 'منشئ الرحلات ذو الـ 11 خطوة' } },
    { key: 'tours.multiday', name: { en: 'Multi-Day Package Engine', ar: 'محرك الباقات متعددة الأيام' } },
    { key: 'tours.oneday', name: { en: 'One-Day Tours Engine', ar: 'محرك رحلات اليوم الواحد' } },
    { key: 'tours.cruises', name: { en: 'Nile Cruise Itineraries', ar: 'برامج كروز النيل' } },
  ],
  navigation: [
    { key: 'nav.trips', section: 'catalogue', label: { en: 'Trips & Tours', ar: 'الرحلات والبرامج' }, href: '/admin/trips' },
  ],
  routes: {
    adminPrefix: '/admin/trips',
    publicPrefix: '/all-tours',
    apiPrefix: '/api/tours',
  },
};

export const CarRentalModuleManifest: ModuleManifest = {
  id: 'car_rental',
  name: 'Car Rental & Vehicle Fleet',
  displayName: {
    en: 'Car Rental',
    ar: 'تأجير السيارات',
    es: 'Alquiler de Coches',
    it: 'Noleggio Auto',
  },
  description: {
    en: 'Fleet inventory, rental categories, location pickup/dropoff pricing, and booking requests.',
    ar: 'مخزون السيارات، فئات التأجير، تسعير محطات الاستلام والتسليم، وطلبات الحجز.',
  },
  version: '1.0.0',
  category: 'travel_products',
  lifecycle: 'implemented',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [
    { key: 'cars.view', action: 'view', label: { en: 'View Fleet', ar: 'عرض الأسطول' } },
    { key: 'cars.edit', action: 'edit', label: { en: 'Manage Fleet', ar: 'إدارة الأسطول' } },
  ],
  features: [
    { key: 'cars.fleet', name: { en: 'Vehicle Fleet Management', ar: 'إدارة أسطول المركبات' } },
    { key: 'cars.pricing', name: { en: 'Location Route Pricing', ar: 'تسعير مسارات المواقع' } },
  ],
  navigation: [
    { key: 'nav.cars', section: 'catalogue', label: { en: 'Rent Cars', ar: 'تأجير السيارات' }, href: '/admin/cars' },
  ],
  routes: {
    adminPrefix: '/admin/cars',
    publicPrefix: '/rent-car',
    apiPrefix: '/api/cars',
  },
};

export const HotelsModuleManifest: ModuleManifest = {
  id: 'hotels',
  name: 'Hotel Reservations & Lodging',
  displayName: {
    en: 'Hotel Reservations',
    ar: 'حجوزات الفنادق',
    es: 'Reservas de Hotel',
    it: 'Prenotazioni Alberghiere',
  },
  description: {
    en: 'Direct hotel inventory, room categories, seasonal allotments, and rate plans.',
    ar: 'التعاقد المباشر مع الفنادق، تصنيفات الغرف، المخصصات الموسمية، وخطط الأسعار.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [
    { key: 'hotels.view', action: 'view', label: { en: 'View Hotels', ar: 'عرض الفنادق', es: 'Ver Hoteles', it: 'Visualizza Hotel' } },
    { key: 'hotels.edit', action: 'edit', label: { en: 'Edit Hotels & Rooms', ar: 'تعديل الفنادق والغرف', es: 'Editar Hoteles y Habitaciones', it: 'Modifica Hotel e Camere' } },
    { key: 'hotels.manage', action: 'manage', label: { en: 'Manage Inventory & Allotments', ar: 'إدارة الغرف والمخصصات', es: 'Gestionar Inventario y Cupos', it: 'Gestisci Inventario e Allotment' } },
    { key: 'hotels.rates', action: 'manage', label: { en: 'Configure Rate Plans', ar: 'إعداد خطط الأسعار', es: 'Configurar Planes de Tarifas', it: 'Configura Piani Tariffari' } },
  ],
  features: [
    { key: 'hotels.allotments', name: { en: 'Room Allotments', ar: 'المخصصات الفندقية' } },
    { key: 'hotels.rate_plans', name: { en: 'Rate Plans & Board Basis', ar: 'خطط الأسعار ونظام الوجبات' } },
    { key: 'hotels.policies', name: { en: 'Hotel & Room Policies', ar: 'سياسات الفنادق والغرف' } },
    { key: 'hotels.inventory_calendar', name: { en: 'Daily Inventory Calendar', ar: 'تقويم الإشغال اليومي' } },
    { key: 'hotels.booking_integration', name: { en: 'Booking Engine Integration', ar: 'الربط مع محرك الحجز' } },
  ],
  navigation: [],
  routes: {
    adminPrefix: '/admin/hotels',
    publicPrefix: '/hotels',
    apiPrefix: '/api/hotels',
  },
};

export const FlightsModuleManifest: ModuleManifest = {
  id: 'flights',
  name: 'Flight Reservations & GDS Ticketing',
  displayName: {
    en: 'Flight Ticketing',
    ar: 'حجوزات الطيران',
    es: 'Billetes de Avión',
    it: 'Biglietteria Aerea',
  },
  description: {
    en: 'Charter seat blocks, group flight bookings, and scheduled air ticketing.',
    ar: 'حجز مقاعد الطيران العارض، رحلات المجموعات، وإصدار التذاكر المجدولة.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const VisaModuleManifest: ModuleManifest = {
  id: 'visa',
  name: 'Visa Services & Entry Permits',
  displayName: {
    en: 'Visa Services',
    ar: 'خدمات التأشيرات',
    es: 'Servicios de Visado',
    it: 'Servizi Visti',
  },
  description: {
    en: 'Electronic visa applications, document verification, and embassy appointment assistance.',
    ar: 'معالجة التأشيرات الإلكترونية، تدقيق المستندات، ومواعيد السفارات.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const HajjUmrahModuleManifest: ModuleManifest = {
  id: 'hajj_umrah',
  name: 'Hajj & Umrah Pilgrimage',
  displayName: {
    en: 'Hajj & Umrah',
    ar: 'الحج والعمرة',
    es: 'Hajj y Umrah',
    it: 'Hajj e Umrah',
  },
  description: {
    en: 'Pilgrim group management, Nusuk platform alignment, Makkah/Madinah lodging, and ground logistics.',
    ar: 'إدارة أفواج المعتمرين والحجاج، التوافق مع منصة نسك، فنادق مكة والمدينة، والنقل الميداني.',
  },
  version: '0.1.0',
  category: 'specialized_tourism',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['hotels', 'transfers', 'flights', 'visa'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const TransfersModuleManifest: ModuleManifest = {
  id: 'transfers',
  name: 'Transfers & Chauffeur Services',
  displayName: {
    en: 'Transfers & Chauffeur',
    ar: 'النقل والتوصيل الخاص',
    es: 'Traslados y Chófer',
    it: 'Trasferimenti e Autista',
  },
  description: {
    en: 'Airport pick-up/drop-off, private intercity transfers, and hourly chauffeur bookings.',
    ar: 'النقل من وإلى المطارات، التنقل الخاص بين المدن، وحجوزات السائقين بالساعة.',
  },
  version: '0.1.0',
  category: 'transport_fleet',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['car_rental'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const CruisesModuleManifest: ModuleManifest = {
  id: 'cruises',
  name: 'Cruises & Boat Charters',
  displayName: {
    en: 'Cruises & Boat Charters',
    ar: 'الكروز والمراكب السياحية',
    es: 'Cruceros y Barcos',
    it: 'Crociere e Imbarcazioni',
  },
  description: {
    en: 'Cabin categories, deck plans, sailing schedules, and private felucca/dahabiya charters.',
    ar: 'تصنيفات الكبائن، مخططات الأسطح، جداول الإبحار، وتأجير الدهبيات والفلوكات الخاصة.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const ExperiencesModuleManifest: ModuleManifest = {
  id: 'experiences',
  name: 'Activities & Experiences',
  displayName: {
    en: 'Activities & Experiences',
    ar: 'الأنشطة والتجارب السياحية',
    es: 'Actividades y Experiencias',
    it: 'Attività ed Esperienze',
  },
  description: {
    en: 'Desert safaris, hot air ballooning, diving sessions, and cultural workshops.',
    ar: 'رحلات السفاري، المنطاد الهوائي، جولات الغوص، والورش الثقافية والحرفية.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const AttractionsModuleManifest: ModuleManifest = {
  id: 'attractions',
  name: 'Attractions & Museum Tickets',
  displayName: {
    en: 'Attractions & Tickets',
    ar: 'المعالم وتذاكر المزارات',
    es: 'Atracciones y Entradas',
    it: 'Attrazioni e Biglietti',
  },
  description: {
    en: 'Museum passes, archaeological site e-tickets, fast-track entry, and audio guides.',
    ar: 'تذاكر المتاحف، تصاريح المواقع الأثرية الإلكترونية، الدخول السريع، والأدلة الصوتية.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const RailBusModuleManifest: ModuleManifest = {
  id: 'rail_bus',
  name: 'Rail & Bus Ticketing',
  displayName: {
    en: 'Rail & Bus Tickets',
    ar: 'تذاكر القطارات والحافلات',
    es: 'Billetes de Tren y Autobús',
    it: 'Biglietti Treno e Autobus',
  },
  description: {
    en: 'Sleeper trains, express railway booking, and intercity coach ticketing.',
    ar: 'قطارات النوم، السكك الحديدية السريعة، وتذاكر الحافلات السياحية بين المدن.',
  },
  version: '0.1.0',
  category: 'transport_fleet',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const InsuranceModuleManifest: ModuleManifest = {
  id: 'insurance',
  name: 'Travel Insurance Policies',
  displayName: {
    en: 'Travel Insurance',
    ar: 'تأمين السفر',
    es: 'Seguro de Viaje',
    it: 'Assicurazione di Viaggio',
  },
  description: {
    en: 'Medical coverage, trip cancellation policies, baggage loss protection, and claims tracking.',
    ar: 'التغطية الطبية، إلغاء السفر، حماية الأمتعة، ومتابعة مطالبات التأمين.',
  },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours', 'flights'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

// ============================================================================
// 3. TRAVEL OPERATIONS
// ============================================================================

export const GroupBookingsModuleManifest: ModuleManifest = {
  id: 'group_bookings',
  name: 'Group Bookings & Series Logistics',
  displayName: {
    en: 'Group Bookings',
    ar: 'حجوزات المجموعات والأفواج',
    es: 'Reservas de Grupos',
    it: 'Prenotazioni di Gruppo',
  },
  description: {
    en: 'Rooming lists, group passenger manifests, split invoicing, and tour leader coordination.',
    ar: 'قوائم تسكين الغرف، كشوف المسافرين، الفواتير المقسمة، وتنسيق قادة الأفواج.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours', 'hotels'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const DmcOperationsModuleManifest: ModuleManifest = {
  id: 'dmc_operations',
  name: 'DMC & Inbound Tour Operations',
  displayName: {
    en: 'DMC Operations',
    ar: 'عمليات شركات السياحة الداخلية (DMC)',
    es: 'Operaciones DMC',
    it: 'Operazioni DMC',
  },
  description: {
    en: 'Daily operations manifest, airport meet-and-greet dispatch, driver rosters, and incident tracking.',
    ar: 'بيان التشغيل اليومي، استقبال وتوديع المطارات، جداول السائقين، ومتابعة الحالات الطارئة.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours', 'transfers'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const TourGuidesModuleManifest: ModuleManifest = {
  id: 'tour_guides',
  name: 'Tour Guides & Representatives',
  displayName: {
    en: 'Tour Guides',
    ar: 'المرشدون السياحيون والممثلون',
    es: 'Guías Turísticos',
    it: 'Guide Turistiche',
  },
  description: {
    en: 'Licensed guide directory, spoken languages, assignment scheduling, and service vouchers.',
    ar: 'دليل المرشدين المرخصين، اللغات المتقنة، جداول التكليفات الميدانية، وسندات الأتعاب.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const QuotationsModuleManifest: ModuleManifest = {
  id: 'quotations',
  name: 'Quotations & Itinerary Builder',
  displayName: {
    en: 'Quotations & Itineraries',
    ar: 'عروض الأسعار ومخطط المسارات',
    es: 'Presupuestos e Itinerarios',
    it: 'Preventivi e Itinerari',
  },
  description: {
    en: 'Custom client proposal generation, interactive day-by-day itineraries, and cost markups.',
    ar: 'إنشاء عروض الأسعار المخصصة للعملاء، مسارات تفاعلية يوماً بيوم، وهوامش الربح.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours', 'hotels', 'transfers'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const DynamicPackagingModuleManifest: ModuleManifest = {
  id: 'dynamic_packaging',
  name: 'Dynamic Packaging Engine',
  displayName: {
    en: 'Dynamic Packaging',
    ar: 'تجميع الباقات الديناميكي',
    es: 'Paquetes Dinámicos',
    it: 'Pacchetti Dinamici',
  },
  description: {
    en: 'Real-time multi-product bundling (Flight + Hotel + Tour + Transfer) with consolidated margin calculation.',
    ar: 'دمج المنتجات المتعددة في الوقت الفعلي (طيران + فندق + جولة + نقل) مع حساب موحد لهامش الربح.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['hotels', 'flights', 'tours', 'transfers'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const SuppliersModuleManifest: ModuleManifest = {
  id: 'suppliers',
  name: 'Supplier & Contracting Management',
  displayName: {
    en: 'Supplier Management',
    ar: 'إدارة الموردين والتعاقدات',
    es: 'Gestión de Proveedores',
    it: 'Gestione Fornitori',
  },
  description: {
    en: 'Contract repository, net rates, allocation limits, credit terms, and partner contacts.',
    ar: 'مستودع العقود، الأسعار الصافية، حدود المخصصات، التسهيلات الائتمانية، وجهات اتصال الشركاء.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const CorporateTravelModuleManifest: ModuleManifest = {
  id: 'corporate_travel',
  name: 'Corporate & Business Travel',
  displayName: {
    en: 'Corporate Travel',
    ar: 'سفر الشركات والأعمال',
    es: 'Viajes Corporativos',
    it: 'Viaggi Aziendali',
  },
  description: {
    en: 'Company travel policies, multi-tier booking approvals, cost-center tracking, and corporate invoicing.',
    ar: 'سياسات السفر المؤسسي، موافقات الحجز متعددة المراحل، مراكز التكلفة، والفواتير المجمعة.',
  },
  version: '0.1.0',
  category: 'travel_operations',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['hotels', 'flights', 'car_rental'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

// ============================================================================
// 4. BUSINESS MANAGEMENT
// ============================================================================

export const TravelCrmModuleManifest: ModuleManifest = {
  id: 'travel_crm',
  name: 'Travel CRM & Customer 360',
  displayName: {
    en: 'Travel CRM',
    ar: 'إدارة علاقات عملاء السفر (CRM)',
    es: 'CRM de Viajes',
    it: 'CRM Viaggi',
  },
  description: {
    en: 'Customer profiles, travel preferences, passports, booking history, enquiry tracking, and support chats.',
    ar: 'ملفات العملاء الشاملة، تفضيلات السفر، الجوازات، سجل الحجوزات، متابعة الاستفسارات ومحادثات الدعم.',
  },
  version: '1.0.0',
  category: 'business_management',
  lifecycle: 'implemented',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [
    { key: 'customers.view', action: 'view', label: { en: 'View Customers', ar: 'عرض العملاء' } },
    { key: 'customers.edit', action: 'edit', label: { en: 'Manage Customers', ar: 'إدارة العملاء' } },
    { key: 'support.view', action: 'view', label: { en: 'View Support Inbox', ar: 'عرض صندوق الدعم' } },
  ],
  features: [
    { key: 'crm.profiles', name: { en: 'Customer 360 Profiles', ar: 'ملفات العملاء الشاملة' } },
    { key: 'crm.staff_preview', name: { en: 'Staff Customer Impersonation Preview', ar: 'معاينة العميل لفريق العمل' } },
  ],
  navigation: [
    { key: 'nav.customers', section: 'main', label: { en: 'Customers', ar: 'العملاء' }, href: '/admin/customers' },
    { key: 'nav.inbox', section: 'main', label: { en: 'Support Inbox', ar: 'صندوق الدعم' }, href: '/admin/inbox' },
  ],
  routes: {
    adminPrefix: '/admin/customers',
    apiPrefix: '/api/admin/customers',
  },
};

export const FinanceInvoicingModuleManifest: ModuleManifest = {
  id: 'finance_invoicing',
  name: 'Finance, Invoicing & Payments',
  displayName: {
    en: 'Finance & Invoicing',
    ar: 'المالية والفواتير والمدفوعات',
    es: 'Finanzas y Facturación',
    it: 'Finanza e Fatturazione',
  },
  description: {
    en: 'Sequential invoices, vouchers, payment collection, partial refunds, and financial audit ledger.',
    ar: 'الفواتير المتسلسلة، السندات، تحصيل المدفوعات، استرداد الأموال الجزئي، وسجل التدقيق المالي.',
  },
  version: '1.0.0',
  category: 'business_management',
  lifecycle: 'implemented',
  isCore: true, // Crucial financial backbone
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [
    { key: 'payments.view', action: 'view', label: { en: 'View Payments', ar: 'عرض المدفوعات' } },
    { key: 'payments.edit', action: 'edit', label: { en: 'Record Payments & Refunds', ar: 'تسجيل المدفوعات والمستردات' } },
  ],
  features: [
    { key: 'finance.ledger', name: { en: 'Integer Cents Financial Ledger', ar: 'سجل مالي دقيق بالسنت' } },
    { key: 'finance.sequences', name: { en: 'Monotonic Sequential Invoicing', ar: 'تسلسل فواتير صارم بدون فجوات' } },
  ],
  navigation: [
    { key: 'nav.payments', section: 'operations', label: { en: 'Payments', ar: 'المدفوعات' }, href: '/admin/payments' },
  ],
  routes: {
    adminPrefix: '/admin/payments',
    apiPrefix: '/api/admin/payments',
  },
};

export const TravelExpensesModuleManifest: ModuleManifest = {
  id: 'travel_expenses',
  name: 'Travel Operations Expense Tracking',
  displayName: {
    en: 'Travel Expenses',
    ar: 'مصروفات التشغيل الميداني',
    es: 'Gastos de Viaje',
    it: 'Spese di Viaggio',
  },
  description: {
    en: 'Tour leader cash advances, driver allowances, toll fees, entrance ticket receipts, and margin reconciliation.',
    ar: 'عهد قادة الرحلات النقدية، بدلات السائقين، رسوم الطرق، إيصالات تذاكر الدخول، وتسوية الأرباح.',
  },
  version: '0.1.0',
  category: 'business_management',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core', 'finance_invoicing'],
  optionalDependencies: ['tours', 'dmc_operations'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const B2bPortalModuleManifest: ModuleManifest = {
  id: 'b2b_portal',
  name: 'B2B Travel Agent & Affiliate Portal',
  displayName: {
    en: 'B2B Agent Portal',
    ar: 'بوابة وكلاء السفر والشركاء (B2B)',
    es: 'Portal de Agencias B2B',
    it: 'Portale Agenzie B2B',
  },
  description: {
    en: 'Wholesale agent logins, net pricing markup rules, credit limits, sub-agent commissions, and white-label vouchers.',
    ar: 'تسجيل دخول وكلاء الجملة، هوامش الأسعار الصافية، التسهيلات، عمولات الوكلاء الفرعيين، والسندات المخصصة.',
  },
  version: '0.1.0',
  category: 'distribution_growth',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours', 'hotels'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const SupplierExtranetModuleManifest: ModuleManifest = {
  id: 'supplier_extranet',
  name: 'Supplier Extranet & Inventory Access',
  displayName: {
    en: 'Supplier Extranet',
    ar: 'إكسترانت الموردين',
    es: 'Extranet de Proveedores',
    it: 'Extranet Fornitori',
  },
  description: {
    en: 'Dedicated portal for hoteliers, boat captains, and local operators to update rates and stop-sales.',
    ar: 'بوابة مخصصة للفنادق، قباطنة المراكب، والشركاء المحليين لتحديث الأسعار ووقف البيع المباشر.',
  },
  version: '0.1.0',
  category: 'distribution_growth',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core', 'suppliers'],
  optionalDependencies: ['hotels', 'cruises'],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

export const SeoManagerModuleManifest: ModuleManifest = {
  id: 'seo_manager',
  name: 'SEO Manager & Content Discovery',
  displayName: {
    en: 'SEO Manager',
    ar: 'مدير تحسين محركات البحث',
    es: 'Gestor de SEO',
    it: 'Gestore SEO',
  },
  description: {
    en: 'Central SEO management, cross-module content discovery, metadata audits, schema management, and search visibility.',
    ar: 'إدارة مركزية للـ SEO، استكشاف محتوى البرامج والفنادق، تدقيق الميتا، وإدارة مخططات البيانات الوصفية والظهور.',
    es: 'Gestión central de SEO, descubrimiento de contenido entre módulos, auditorías de metadatos y visibilidad en búsquedas.',
    it: 'Gestione centrale SEO, scoperta di contenuti cross-modulo, audit dei metadati e visibilità nei motori di ricerca.',
  },
  version: '1.0.0',
  category: 'business_management',
  lifecycle: 'available_for_subscription',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['tours', 'hotels'],
  permissions: [
    {
      key: 'seo.view',
      action: 'view',
      label: { en: 'View SEO metadata & audits', ar: 'عرض بيانات وتدقيق محركات البحث' },
    },
    {
      key: 'seo.manage',
      action: 'manage',
      label: { en: 'Manage and publish SEO overrides', ar: 'إدارة ونشر تخصيصات محركات البحث' },
    },
  ],
  features: [
    {
      key: 'seo.cross_module_discovery',
      name: { en: 'Cross-Module Content Discovery', ar: 'استكشاف المحتوى عبر الوحدات' },
    },
    {
      key: 'seo.health_audits',
      name: { en: 'Technical SEO & Diagnostics', ar: 'التدقيق الفني وتشخيصات SEO' },
    },
    {
      key: 'seo.schema_management',
      name: { en: 'Structured Data & Schema Management', ar: 'إدارة البيانات المنظمة ومخططات Schema' },
    },
    {
      key: 'seo.social_previews',
      name: { en: 'Social Card & OpenGraph Previews', ar: 'معاينة بطاقات التواصل وOpenGraph' },
    },
  ],
  navigation: [
    {
      key: 'nav.website_cms_seo',
      section: 'distribution',
      label: { en: 'SEO Manager', ar: 'مدير SEO' },
      href: '/admin/website-cms/seo',
      icon: 'Search',
      requiredPermission: 'seo.view',
      order: 45,
    },
  ],
  routes: {
    adminPrefix: '/admin/website-cms/seo',
    apiPrefix: '/api/admin/website-cms/seo',
  },
};

// ============================================================================
// 5. REGISTRATION REGISTRY HELPER
// ============================================================================

export const ALL_INITIAL_MANIFESTS: readonly ModuleManifest[] = [
  // 1. Core
  CorePlatformManifest,

  // 2. Products
  ToursModuleManifest,
  CarRentalModuleManifest,
  HotelsModuleManifest,
  FlightsModuleManifest,
  VisaModuleManifest,
  HajjUmrahModuleManifest,
  TransfersModuleManifest,
  CruisesModuleManifest,
  ExperiencesModuleManifest,
  AttractionsModuleManifest,
  RailBusModuleManifest,
  InsuranceModuleManifest,

  // 3. Operations
  GroupBookingsModuleManifest,
  DmcOperationsModuleManifest,
  TourGuidesModuleManifest,
  QuotationsModuleManifest,
  DynamicPackagingModuleManifest,
  SuppliersModuleManifest,
  CorporateTravelModuleManifest,

  // 4. Business Management & Growth
  TravelCrmModuleManifest,
  FinanceInvoicingModuleManifest,
  TravelExpensesModuleManifest,
  B2bPortalModuleManifest,
  SupplierExtranetModuleManifest,
  SeoManagerModuleManifest,
];

/**
 * Registers all platform manifests into the global registry.
 */
export function registerInitialPlatformModules(): void {
  for (const manifest of ALL_INITIAL_MANIFESTS) {
    if (!platformModuleRegistry.get(manifest.id)) {
      platformModuleRegistry.register(manifest);
    }
  }
}

// Auto-register on import
registerInitialPlatformModules();
