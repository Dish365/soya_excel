# Soya Excel Management System

A comprehensive feed supply chain management system built with Django REST Framework and Next.js. This system helps manage farmers, drivers, inventory, orders, and delivery routes for a feed distribution company.

## 🚀 Features

### Dashboard
- Real-time feed monitoring from IoT sensors
- Supply inventory status tracking
- Recent orders overview
- Key performance metrics

### Farmer Management
- Farmer profile management
- Feed storage monitoring with real-time data
- Low stock alerts
- Contact management

### Order Management
- Create and track feed delivery orders
- Order status tracking (pending, confirmed, in_transit, delivered)
- Integration with farmer profiles

### Driver Management
- Driver profiles and availability tracking
- Delivery assignment and tracking
- Performance monitoring

### Route Planning
- Intelligent route optimization
- Delivery stop management
- Route status tracking (draft, planned, active, completed)

### Inventory Management
- Real-time inventory tracking
- Low stock alerts
- Restock order management
- Stock level visualization

## 🛠️ Technology Stack

### Backend
- **Django 5.2.2** - Web framework
- **Django REST Framework** - API development
- **SQLite** - Database (development)
- **JWT Authentication** - Secure authentication

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Hook Form** - Form management
- **Axios** - HTTP client

## 📦 Project Structure

```
soya_excel/
├── backend/                 # Django backend
│   ├── clients/            # Farmer and order management
│   ├── driver/             # Driver management
│   ├── manager/            # Manager dashboard and inventory
│   ├── route/              # Route planning and optimization
│   └── soya_excel_backend/ # Project settings
├── frontend/               # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # Reusable components
│   └── lib/                # Utilities and API calls
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create mock data (optional):
```bash
python manage.py create_mock_data
```

6. Create a superuser:
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔐 Authentication

The system uses JWT authentication. Default test credentials:

**Manager Account:**
- Username: `testmanager`
- Password: `Pass_1234`

**Driver Accounts:**
- Username: `driver1`, `driver2`, etc.
- Password: `Pass_1234`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/user/` - Get current user

### Manager APIs
- `GET /api/manager/managers/dashboard/` - Dashboard data
- `GET /api/manager/supply-inventory/` - Inventory items
- `GET /api/manager/distribution-plans/` - Distribution plans

### Client APIs
- `GET /api/clients/farmers/` - List farmers
- `GET /api/clients/orders/` - List orders
- `GET /api/clients/feed-storage/` - Feed storage data

### Driver APIs
- `GET /api/drivers/drivers/` - List drivers
- `GET /api/drivers/deliveries/` - List deliveries

### Route APIs
- `GET /api/routes/routes/` - List routes
- `POST /api/routes/routes/{id}/optimize/` - Optimize route

## 🎯 Key Features Implementation

### Real-time Feed Monitoring
- IoT sensor simulation for feed storage levels
- WebSocket connections for real-time updates
- Low stock alert system

### Route Optimization
- Mock Google Maps API integration
- Intelligent stop sequencing
- Distance and duration calculations

### Inventory Management
- Automatic stock level calculations
- Restock order workflow
- Visual stock indicators

## 🔧 Development

### Adding New Features
1. Backend: Create new Django apps and models
2. Frontend: Add new pages in the `app/` directory
3. Update API calls in `lib/api.ts`

### Database Schema
The system includes comprehensive models for:
- User management (Django auth + custom profiles)
- Farmer and feed storage tracking
- Order and delivery management
- Route planning and optimization
- Inventory and supply chain management

## 📈 Future Enhancements

- [ ] Real IoT sensor integration
- [ ] Google Maps API integration for actual route optimization
- [ ] Mobile app for drivers
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant support
- [ ] Real-time notifications
- [ ] Document management system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, please create an issue in the GitHub repository. 