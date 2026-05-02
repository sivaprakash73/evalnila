export const dashboardSummary = [
  { label: 'Gross Revenue', value: 'Rs. 1,28,420', delta: '+12.4%', tone: 'sun' },
  { label: 'Orders Today', value: '316', delta: '+8.1%', tone: 'sea' },
  { label: 'Active Products', value: '1,284', delta: '+31', tone: 'mint' },
  { label: 'Returning Customers', value: '68%', delta: '+4.7%', tone: 'berry' }
];

export const orderStatus = [
  { label: 'Pending Payment', value: 22, tone: 'warning' },
  { label: 'Packed', value: 48, tone: 'info' },
  { label: 'Shipped', value: 74, tone: 'primary' },
  { label: 'Delivered', value: 91, tone: 'success' }
];

export const monthlySales = [
  { label: 'Jan', value: 18 },
  { label: 'Feb', value: 22 },
  { label: 'Mar', value: 24 },
  { label: 'Apr', value: 31 },
  { label: 'May', value: 28 },
  { label: 'Jun', value: 36 },
  { label: 'Jul', value: 40 },
  { label: 'Aug', value: 44 }
];

export const recentOrders = [
  { orderNumber: 'ORD-24081', customer: 'Aarav Patel', amount: 4830, status: 'Packed' },
  { orderNumber: 'ORD-24080', customer: 'Mia Carter', amount: 3990, status: 'Shipped' },
  { orderNumber: 'ORD-24079', customer: 'Liam Brooks', amount: 1575, status: 'Delivered' },
  { orderNumber: 'ORD-24078', customer: 'Sophia Reed', amount: 2625, status: 'Pending' },
  { orderNumber: 'ORD-24077', customer: 'Noah Hill', amount: 640, status: 'Delivered' }
];

export const topProducts = [
  { name: 'Custom Kurti Set', sku: 'EV-KU-001', revenue: 24120 },
  { name: 'Tailored Co-ord Set', sku: 'EV-CO-003', revenue: 19560 },
  { name: 'Western Wear Dress', sku: 'EV-WW-005', revenue: 17430 },
  { name: 'Saree Styling Blouse', sku: 'EV-SA-006', revenue: 16200 }
];

export const ordersPageRows = [
  {
    id: 1,
    orderNumber: 'ORD-24081',
    customer: 'Aarav Patel',
    email: 'aarav@example.com',
    phone: '+91 98765 43210',
    address: '42 Linking Road, Bandra West',
    city: 'Mumbai',
    country: 'IN',
    location: 'Mumbai, IN',
    orderDate: '2026-04-24',
    paymentStatus: 'Paid',
    status: 'Packed',
    subtotal: 4600,
    taxAmount: 230,
    shippingFee: 0,
    amount: 4830
  },
  {
    id: 2,
    orderNumber: 'ORD-24080',
    customer: 'Mia Carter',
    email: 'mia@example.com',
    phone: '+1 416 555 0182',
    address: '18 Queen Street West',
    city: 'Toronto',
    country: 'CA',
    location: 'Toronto, CA',
    orderDate: '2026-04-24',
    paymentStatus: 'Paid',
    status: 'Shipped',
    subtotal: 3800,
    taxAmount: 190,
    shippingFee: 0,
    amount: 3990
  },
  {
    id: 3,
    orderNumber: 'ORD-24079',
    customer: 'Liam Brooks',
    email: 'liam@example.com',
    phone: '+44 20 7946 0184',
    address: '9 Baker Street',
    city: 'London',
    country: 'UK',
    location: 'London, UK',
    orderDate: '2026-04-23',
    paymentStatus: 'Paid',
    status: 'Delivered',
    subtotal: 1500,
    taxAmount: 75,
    shippingFee: 0,
    amount: 1575
  },
  {
    id: 4,
    orderNumber: 'ORD-24078',
    customer: 'Sophia Reed',
    email: 'sophia@example.com',
    phone: '+1 512 555 0168',
    address: '721 Congress Avenue',
    city: 'Austin',
    country: 'US',
    location: 'Austin, US',
    orderDate: '2026-04-23',
    paymentStatus: 'Pending',
    status: 'Pending',
    subtotal: 2500,
    taxAmount: 125,
    shippingFee: 0,
    amount: 2625
  }
];

export const productsPageRows = [
  {
    id: 1,
    categoryId: 1,
    name: 'Custom Kurti Set',
    slug: 'custom-kurti-set',
    sku: 'EV-KU-001',
    description: 'Customized kurti stitching with neckline, sleeve, and length options.',
    category: 'Kurtis',
    stock: 24,
    mrp: 1599,
    specialPrice: 1200,
    price: 1200,
    taxPercentage: 5,
    sizes: ['M', 'L', 'XL'],
    availabilityType: 'ready_stock',
    readyStockDispatchDays: 2,
    makeOrderDispatchDays: 7,
    status: 'Active'
  },
  {
    id: 2,
    categoryId: 2,
    name: 'Elegant Maxi Dress',
    slug: 'elegant-maxi-dress',
    sku: 'EV-MA-002',
    description: 'Flowing maxi design for everyday and occasion wear.',
    category: 'Maxis',
    stock: 18,
    mrp: 2299,
    specialPrice: 1800,
    price: 1800,
    taxPercentage: 5,
    sizes: ['M', 'L', 'XL'],
    availabilityType: 'ready_stock',
    readyStockDispatchDays: 2,
    makeOrderDispatchDays: 8,
    status: 'Active'
  },
  {
    id: 3,
    categoryId: 3,
    name: 'Tailored Co-ord Set',
    slug: 'tailored-co-ord-set',
    sku: 'EV-CO-003',
    description: 'Matching top and bottom set with custom fit options.',
    category: 'Co-ord',
    stock: 0,
    mrp: 2799,
    specialPrice: 2200,
    price: 2200,
    taxPercentage: 5,
    sizes: ['M', 'L', 'XL'],
    availabilityType: 'make_order',
    readyStockDispatchDays: 2,
    makeOrderDispatchDays: 10,
    status: 'Low Stock'
  },
  {
    id: 4,
    categoryId: 4,
    name: 'Crop-Skirt Occasion Set',
    slug: 'crop-skirt-occasion-set',
    sku: 'EV-CS-004',
    description: 'Crop top and skirt set designed for celebrations and events.',
    category: 'Crop-Skirt',
    stock: 0,
    mrp: 3199,
    specialPrice: 2500,
    price: 2500,
    taxPercentage: 5,
    sizes: ['M', 'L', 'XL'],
    availabilityType: 'make_order',
    readyStockDispatchDays: 2,
    makeOrderDispatchDays: 12,
    status: 'Active'
  },
  {
    id: 5,
    categoryId: 5,
    name: 'Western Wear Dress',
    slug: 'western-wear-dress',
    sku: 'EV-WW-005',
    description: 'Modern western wear silhouette with custom styling details.',
    category: 'Western wear',
    stock: 16,
    mrp: 2599,
    specialPrice: 2000,
    price: 2000,
    taxPercentage: 5,
    sizes: ['M', 'L', 'XL'],
    availabilityType: 'ready_stock',
    readyStockDispatchDays: 2,
    makeOrderDispatchDays: 8,
    status: 'Active'
  },
  {
    id: 6,
    categoryId: 6,
    name: 'Saree Styling Blouse',
    slug: 'saree-styling-blouse',
    sku: 'EV-SA-006',
    description: 'Custom stitched blouse and saree styling support.',
    category: 'Sarees',
    stock: 0,
    mrp: 1999,
    specialPrice: 1500,
    price: 1500,
    taxPercentage: 5,
    sizes: ['M', 'L', 'XL'],
    availabilityType: 'make_order',
    readyStockDispatchDays: 2,
    makeOrderDispatchDays: 7,
    status: 'Active'
  }
];

export const customersPageRows = [
  {
    id: 1,
    name: 'Aarav Patel',
    email: 'aarav@example.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, IN',
    orders: 12,
    lifetimeValue: 4520
  },
  {
    id: 2,
    name: 'Sophia Reed',
    email: 'sophia@example.com',
    phone: '+1 512 555 0168',
    location: 'Austin, US',
    orders: 7,
    lifetimeValue: 2630
  },
  {
    id: 3,
    name: 'Noah Hill',
    email: 'noah@example.com',
    phone: '+44 20 7946 0184',
    location: 'London, UK',
    orders: 9,
    lifetimeValue: 3110
  },
  {
    id: 4,
    name: 'Mia Carter',
    email: 'mia@example.com',
    phone: '+1 416 555 0182',
    location: 'Toronto, CA',
    orders: 5,
    lifetimeValue: 1940
  }
];

export const categoryRows = [
  { id: 1, name: 'Kurtis' },
  { id: 2, name: 'Maxis' },
  { id: 3, name: 'Co-ord' },
  { id: 4, name: 'Crop-Skirt' },
  { id: 5, name: 'Western wear' },
  { id: 6, name: 'Sarees' }
];

export const productReviewRows = {
  'custom-kurti-set': {
    rating: 4.8,
    reviewCount: 128,
    highlights: ['Custom neckline', 'Size-focused fit', 'Clean finish'],
    reviews: [
      {
        id: 1,
        author: 'Nisha R.',
        title: 'Perfect fit and finish',
        rating: 5,
        body: 'The kurti fit was exactly as requested and the finishing felt very neat.',
        tag: 'Verified Buyer'
      },
      {
        id: 2,
        author: 'Priya K.',
        title: 'Great everyday kurti',
        rating: 4,
        body: 'Simple, comfortable, and easy to style for daily wear.',
        tag: 'Repeat Customer'
      }
    ]
  },
  'elegant-maxi-dress': {
    rating: 4.6,
    reviewCount: 94,
    highlights: ['Flowy silhouette', 'Occasion ready', 'Custom length'],
    reviews: [
      {
        id: 3,
        author: 'Meera S.',
        title: 'Elegant and comfortable',
        rating: 5,
        body: 'The maxi looked graceful and the custom length worked well with heels.',
        tag: 'Verified Buyer'
      },
      {
        id: 4,
        author: 'Asha M.',
        title: 'Nice drape',
        rating: 4,
        body: 'The cut was flattering and the stitching was clean.',
        tag: 'Verified Buyer'
      }
    ]
  },
  'tailored-co-ord-set': {
    rating: 4.7,
    reviewCount: 72,
    highlights: ['Matching set', 'Tailored shape', 'Easy styling'],
    reviews: [
      {
        id: 5,
        author: 'Kavya P.',
        title: 'Loved the co-ord',
        rating: 5,
        body: 'The top and bottom matched beautifully and the fit was easy to wear all day.',
        tag: 'Verified Buyer'
      },
      {
        id: 6,
        author: 'Divya T.',
        title: 'Polished look',
        rating: 4,
        body: 'A neat set for casual outings without needing much styling.',
        tag: 'Style Pick'
      }
    ]
  },
  'crop-skirt-occasion-set': {
    rating: 4.5,
    reviewCount: 86,
    highlights: ['Event ready', 'Custom fit', 'Modern silhouette'],
    reviews: [
      {
        id: 7,
        author: 'Harini V.',
        title: 'Beautiful occasion set',
        rating: 4,
        body: 'The crop and skirt combination looked festive without feeling heavy.',
        tag: 'Verified Buyer'
      },
      {
        id: 8,
        author: 'Janani R.',
        title: 'Custom details helped',
        rating: 5,
        body: 'The requested fit adjustments made the outfit much more comfortable.',
        tag: 'Occasion Pick'
      }
    ]
  },
  'western-wear-dress': {
    rating: 4.6,
    reviewCount: 64,
    highlights: ['Modern cut', 'Custom styling', 'Clean finish'],
    reviews: [
      {
        id: 9,
        author: 'Roshini K.',
        title: 'Easy western look',
        rating: 5,
        body: 'The dress was simple, stylish, and stitched to the right fit.',
        tag: 'Verified Buyer'
      }
    ]
  },
  'saree-styling-blouse': {
    rating: 4.7,
    reviewCount: 58,
    highlights: ['Blouse fit', 'Saree styling', 'Custom details'],
    reviews: [
      {
        id: 10,
        author: 'Lakshmi S.',
        title: 'Neat blouse stitching',
        rating: 5,
        body: 'The blouse fit well and the finishing worked nicely with my saree.',
        tag: 'Verified Buyer'
      }
    ]
  }
};
