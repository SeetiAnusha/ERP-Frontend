# ERP System - Frontend

Modern, responsive frontend for the ERP system built with React, TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

- **Master Data Management**
  - Products catalog with inventory tracking
  - Supplier and customer management
  - Fixed assets (PPE) management
  - Investment portfolio management
  - Prepaid expenses tracking

- **Transaction Processing**
  - Purchase recording with line items
  - Sales recording with automatic COGS calculation
  - Payment processing and tracking
  - Adjustments (Debit Notes, Credit Notes, Adjustments)
  - Cash register with running balance

- **Advanced Features**
  - Credit card payment flow
  - Associated invoices for cost allocation
  - Real-time inventory updates
  - Sequential registration numbers

- **Comprehensive Reports**
  - PPE tracking with depreciation schedules
  - Investment portfolio with ROI analysis
  - Inventory movement with COGS and margins
  - Accounts payable/receivable tracking
  - Cash flow analysis
  - Business analytics dashboard

- **Modern UI/UX**
  - Responsive design (mobile, tablet, desktop)
  - Smooth animations with Framer Motion
  - Professional color schemes
  - Intuitive navigation
  - Form validation

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/erp-frontend.git
cd erp-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the application

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.ts             # API client configuration
│   ├── components/
│   │   └── Layout.tsx           # Main layout component
│   ├── pages/                   # Page components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Products.tsx         # Product management
│   │   ├── Purchases.tsx        # Purchase recording
│   │   ├── Sales.tsx            # Sales recording
│   │   ├── Payments.tsx         # Payment processing
│   │   ├── Adjustments.tsx      # Adjustments
│   │   ├── CashRegister.tsx     # Cash register
│   │   ├── Inventory.tsx        # Inventory movement
│   │   ├── FixedAssets.tsx      # Fixed assets
│   │   ├── Investments.tsx      # Investments
│   │   ├── PrepaidExpenses.tsx  # Prepaid expenses
│   │   ├── Reports.tsx          # Business reports
│   │   ├── PPEReport.tsx        # PPE tracking report
│   │   └── InvestmentReport.tsx # Investment report
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── dist/                        # Build output (gitignored)
├── node_modules/                # Dependencies (gitignored)
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🎨 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library

## 📱 Pages & Features

### Dashboard
- Business overview with key metrics
- Revenue, expenses, profit tracking
- Quick access to all modules
- Recent transactions

### Master Data
- **Products** - Manage product catalog
- **Suppliers** - Supplier information
- **Clients** - Customer management
- **Fixed Assets** - PPE tracking
- **Investments** - Investment portfolio
- **Prepaid Expenses** - Expense tracking

### Transactions
- **Purchases (RC####)** - Record purchases with line items
- **Sales (RV####)** - Record sales with automatic calculations
- **Payments (PG####)** - Process payments and collections
- **Adjustments** - Debit notes (ND####), Credit notes (NC####), Adjustments (AJ####)
- **Cash Register (CJ####)** - Track cash movements

### Reports
- **Business Reports** - Revenue, expenses, profit, cash flow
- **PPE Tracking** - Asset register with depreciation
- **Investment Tracking** - Portfolio performance and ROI
- **Inventory Movement** - Stock tracking with COGS and margins

## 🔌 API Integration

The frontend connects to the backend API using Axios:

```typescript
// src/api/axios.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
```

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS for styling:

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        // ... custom colors
      },
    },
  },
  plugins: [],
};
```

### Custom Styles

Global styles are in `src/index.css`:
- Custom scrollbar
- Smooth transitions
- Responsive utilities

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |

**Note:** Vite requires environment variables to be prefixed with `VITE_`

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build for production
npm run build

# Output will be in dist/ folder
# Serve with any static file server
```

## 🚀 Deployment

### Using Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Using Vercel/Netlify

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL`

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🎯 Key Features Explained

### Sequential Registration Numbers
- Purchases: RC0001, RC0002...
- Sales: RV0001, RV0002...
- Payments: PG0001, PG0002...
- Debit Notes: ND0001, ND0002...
- Credit Notes: NC0001, NC0002...
- Adjustments: AJ0001, AJ0002...
- Cash Register: CJ0001, CJ0002...

### Credit Card Payment Flow
1. Sale created with credit card → Marked as "Unpaid" (Accounts Receivable)
2. When cash received → Payment collected
3. System automatically creates cash register entry
4. Cash balance updated

### Inventory Tracking
- Real-time stock updates
- COGS calculation
- Gross margin tracking
- Movement history
- Low stock alerts

### Depreciation Tracking
- Automatic depreciation calculation
- Straight-line method
- Monthly depreciation
- Book value tracking
- Depreciation schedules

### Investment Tracking
- Portfolio overview
- ROI calculations
- Gain/Loss tracking
- Maturity alerts
- Performance metrics

## 🎨 UI Components

### Forms
- Validation
- Error handling
- Auto-save drafts
- Multi-step forms

### Tables
- Sorting
- Filtering
- Pagination
- Export functionality

### Modals
- Confirmation dialogs
- Detail views
- Form modals

### Charts (Future)
- Revenue trends
- Expense breakdown
- Inventory levels
- Cash flow

## 🔒 Security

- Environment variables for API URLs
- HTTPS in production
- Input validation
- XSS prevention
- CSRF protection (when implementing auth)

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React team for the amazing library
- Tailwind CSS for the utility-first approach
- Framer Motion for smooth animations
- Vite for the blazing fast build tool

## 📞 Support

For support, email support@yourcompany.com or open an issue in the repository.

## 🔄 Version History

- **1.0.0** (2024-01-18)
  - Initial release
  - Master data management UI
  - Transaction recording UI
  - Report generation UI
  - Credit card payment flow
  - PPE tracking with depreciation
  - Investment portfolio tracking
  - Responsive design
  - Modern animations

## 🗺️ Roadmap

- [ ] User authentication UI
- [ ] Role-based UI elements
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Charts and graphs
- [ ] Excel export
- [ ] PDF generation
- [ ] Print layouts
- [ ] Offline mode
- [ ] Progressive Web App (PWA)
- [ ] Mobile app (React Native)

## 🐛 Known Issues

None at the moment. Please report any issues you find!

## 💡 Tips

- Use `npm run dev` for development with hot reload
- Build with `npm run build` before deploying
- Check browser console for any errors
- Ensure backend API is running
- Update `VITE_API_URL` for production

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
