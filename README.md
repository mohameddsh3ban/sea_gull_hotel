# Restaurant Reservation System

A production-ready, full-stack restaurant reservation platform built for Seagull Beach Resort in Hurghada, Egypt. The system supports multi-restaurant management, real-time capacity tracking, automated email notifications, guest reviews, and role-based access control.

## 🌟 Features

### Guest Features

- **Multi-Restaurant Booking:** Reserve tables at Indian, Chinese, Italian, or Oriental restaurants
- **Real-Time Availability:** Live capacity checking with visual indicators
- **Main Course Selection:** Restaurant-specific menu choices per guest
- **Upselling:** Add sushi orders for Chinese restaurant with room billing
- **Email Confirmations:** Automated booking confirmations with cancellation links
- **Self-Service Cancellation:** One-click reservation cancellation via secure token
- **Review System:** Rate dining experiences (1-10) with optional comments
- **Multi-Language Support:** 7 languages (EN, DE, RU, FR, CS, SR, PL)

### Admin Features

- **Dashboard:** Comprehensive reservation management with filtering and pagination
- **Capacity Management:** Set daily limits per restaurant for 6-day rolling window
- **Capacity Overview:** Visual calendar with color-coded availability
- **Guest List Upload:** Bulk import guest data via Excel
- **Review Analytics:** View ratings, comments, and trend analysis
- **Export Reports:** PDF generation with full reservation details

### Staff Dashboards

- **Reception:** Manage payment status for upsell items
- **Kitchen:** View upcoming reservations with dietary details
- **Accounting:** Track payment records and financial summaries

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- React 18 with Vite
- React Router v6 for navigation
- Tailwind CSS for styling
- i18next for internationalization
- Firebase Auth for authentication
- Sentry for error tracking
- React Hot Toast for notifications
- Framer Motion for animations

**Backend:**

- FastAPI (Python)
- Firebase Admin SDK
- Google Cloud Firestore (database)
- Mailgun (email service)
- Prometheus (monitoring - optional)

**Testing:**

- pytest + httpx (backend)
- Frontend testing: TBD (Vitest recommended)

### Project Structure

```
├── frontend/
│   ├── public/
│   │   ├── images/          # Restaurant images, logos
│   │   ├── gallery/         # Homepage slideshow
│   │   └── menus/           # PDF menus and thumbnails
│   ├── src/
│   │   ├── api/             # API client (if needed)
│   │   ├── components/      # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── AdminHeader.jsx
│   │   │   ├── DashboardHeader.jsx
│   │   │   ├── ReservationsTable.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/           # Route pages
│   │   │   ├── GuestHome.jsx
│   │   │   ├── ReservationForm.jsx
│   │   │   ├── Confirmation.jsx
│   │   │   ├── admin/       # Admin pages
│   │   │   └── ...
│   │   ├── locales/         # Translation files (en.json, de.json, etc.)
│   │   ├── firebase.js      # Firebase configuration
│   │   ├── i18n.js          # i18next setup
│   │   └── App.jsx          # Main app component
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py      # Auth dependencies
│   │   │   └── v1/
│   │   │       ├── api_router.py
│   │   │       └── endpoints/
│   │   │           ├── reservations.py
│   │   │           ├── capacities.py
│   │   │           ├── reviews.py
│   │   │           ├── admin.py
│   │   │           └── auth.py
│   │   ├── models/          # Pydantic schemas
│   │   │   ├── reservation.py
│   │   │   ├── capacity.py
│   │   │   ├── review.py
│   │   │   └── user.py
│   │   ├── services/        # Business logic
│   │   │   ├── email.py
│   │   │   ├── firestore.py
│   │   │   └── auth.py
│   │   ├── core/            # Configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── exceptions.py
│   │   ├── utils/           # Helpers
│   │   │   └── datetime.py
│   │   └── main.py          # FastAPI app
│   ├── tests/               # Backend tests
│   │   ├── conftest.py
│   │   ├── test_reservations.py
│   │   └── ...
│   ├── requirements.txt
│   ├── service-account.json # Firebase credentials (DO NOT COMMIT)
│   └── set_role.py          # Script to set user roles
│
├── .env                     # Environment variables (DO NOT COMMIT)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **Python** 3.9 or higher
- **Firebase Project** with Firestore and Authentication enabled
- **Mailgun Account** for email notifications
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd restaurant-reservation-system
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** (start in production mode)
3. Enable **Authentication** → Email/Password provider
4. Generate a **Service Account Key**:
   - Project Settings → Service Accounts → Generate New Private Key
   - Save as `backend/service-account.json` ⚠️ **Keep this secure!**
5. Get your **Firebase Web Config**:
   - Project Settings → General → Your apps → Web app

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install pandas openpyxl

# Create .env file
cp .env.example .env  # Or create manually
```

**Backend `.env` file:**

```env
# Firebase
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=reservations@mg.yourdomain.com

# Security
ADMIN_SECRET=your-secure-admin-secret
CRON_SECRET=your-secure-cron-secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-production-domain.com

# Frontend
FRONTEND_BASE_URL=http://localhost:5173

# Timezone
LOCAL_TIMEZONE=Africa/Cairo
```

**Create Admin User:**

```bash
# First, create a user in Firebase Console → Authentication
# Then run this script with the user's UID:

python set_role.py
# Edit the UID in set_role.py before running
```

**Start Backend:**

```bash
# Activate virtual environment (if not already active)
.\venv\Scripts\activate

# Start Server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env  # Or create manually
```

**Frontend `.env` file:**

```env
# Firebase Web Config (from Firebase Console)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Sentry (optional - for error tracking)
VITE_SENTRY_DSN=your-sentry-dsn
```

**Start Frontend:**

```bash
npm run start
```

Frontend will be available at `http://localhost:5173`

## 📊 Firestore Data Structure

### Collections

**`capacities`** - Restaurant capacity per date

```javascript
{
  restaurant: "Italian",
  date: "2025-01-15",
  capacity: 40,
  reserved_guests: 12
}
```

**`reservations`** - Guest bookings

```javascript
{
  name: "John Doe",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  room: "305",
  date: "2025-01-15",
  time: "19:00",
  guests: 2,
  restaurant: "Italian",
  main_courses: ["quatro_formagi", "chicken_pizza"],
  upsell_items: {"Hot Dynamites": 2},
  upsell_total_price: 8.00,
  comments: "No onions please",
  status: "confirmed",
  paid: false,
  email_status: "sent",
  cancel_token: "abc123...",
  review: {
    requestSent: false,
    received: false,
    token: "xyz789..."
  },
  created_at: Timestamp
}
```

**`restaurant_reviews`** - Guest feedback

```javascript
{
  reservationId: "res_123",
  restaurantId: "Italian",
  rating: 9,
  comment: "Amazing pasta!",
  createdAt: Timestamp,
  guestName: "John Doe",
  guestEmail: "john@example.com",
  room: "305",
  dinnerDate: "2025-01-15"
}
```

## 🔐 Authentication & Authorization

### User Roles

The system uses Firebase Custom Claims for role-based access:

- **`guest`** (default) - Can make reservations
- **`reception`** - View reservations, manage payments
- **`kitchen`** - View reservations, see dietary details
- **`accounting`** - View reservations, track payments
- **`admin`** - Full access to all features

### Setting User Roles

Use the `set_role.py` script:

```python
# backend/set_role.py
UID = "user-firebase-uid-here"
# Run: python set_role.py
```

Or use the API endpoint (admin only):

```bash
POST /api/v1/admin/set-user-role
Authorization: Bearer {admin-token}
{
  "uid": "user-uid",
  "role": "reception"
}
```

### Protected Routes

Frontend routes are protected using `ProtectedRoute` component:

```javascript
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

Backend endpoints use dependency injection:

```python
@router.get("/reservations")
async def list_reservations(
    user: dict = Depends(require_role("admin", "reception"))
):
    # Endpoint logic
```

## 📧 Email System

### Automated Emails

1. **Reservation Confirmation** - Sent immediately upon booking

   - Includes reservation details, cancellation link
   - Triggered by: `POST /api/v1/reservations`

2. **Review Request** - Sent 1 day after dining
   - Includes review link with unique token
   - Triggered by: Cron job at `/api/tasks/send-review-requests`

### Email Configuration

Emails are sent via Mailgun. Configure in backend `.env`:

```env
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=reservations@mg.yourdomain.com
```

### Email Templates

Templates are defined in `backend/app/services/email.py`:

- `build_email_html()` - Reservation confirmation
- `send_review_request_email()` - Review request

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_reservations.py -v
```

**Test Coverage:**

- ✅ Reservation creation (success & validation)
- ✅ Overbooking prevention (race conditions)
- ✅ Concurrent request handling
- ✅ Cancellation logic
- ✅ Pagination and filtering

### Frontend Tests

_To be implemented - Recommended: Vitest + React Testing Library_

```bash
# Future setup
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

## 🚢 Deployment

### Backend Deployment (Render, Heroku, Railway)

1. **Set Environment Variables** on your hosting platform
2. **Upload Service Account JSON** as a secret file or base64 env var
3. **Install Dependencies:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Render Example (`render.yaml`):**

```yaml
services:
  - type: web
    name: restaurant-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: FIREBASE_STORAGE_BUCKET
        sync: false
      - key: MAILGUN_API_KEY
        sync: false
      # ... other env vars
```

### Frontend Deployment (Firebase Hosting, Vercel, Netlify)

**Firebase Hosting:**

```bash
cd frontend

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

**Vercel/Netlify:**

- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: Add all `VITE_*` variables in hosting dashboard

## 📝 API Documentation

FastAPI automatically generates interactive API docs:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Key Endpoints

**Public:**

- `POST /api/v1/reservations` - Create reservation
- `GET /cancel/{token}` - View cancellation page
- `POST /cancel/{token}` - Cancel reservation
- `POST /api/reviews/submit` - Submit review

**Authenticated:**

- `GET /api/v1/reservations` - List reservations (with filters)
- `DELETE /api/v1/reservations/{id}` - Cancel reservation (admin)
- `GET /api/v1/capacities` - Get capacities
- `POST /api/v1/capacities` - Update capacities (admin)
- `PATCH /api/v1/reservations/{id}/paid` - Update payment status (reception)
- `GET /api/reviews/summary` - Get review analytics (admin)

## 🔧 Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Code Style

**Frontend:**

- Use Prettier for formatting
- Follow React best practices
- Use functional components with hooks

**Backend:**

- Follow PEP 8 style guide
- Use Black for formatting: `black app/`
- Use type hints for function signatures

## 🐛 Troubleshooting

### Common Issues

**"Firebase credentials not found"**

- Ensure `service-account.json` is in `backend/` directory
- Check file permissions (should be readable)

**"Invalid token" errors**

- Token may have expired - user needs to re-login
- Check Firebase Auth is enabled in console

**CORS errors**

- Add your frontend URL to `ALLOWED_ORIGINS` in backend `.env`
- Ensure frontend is using correct backend URL

**Emails not sending**

- Verify Mailgun API key and domain
- Check Mailgun logs in dashboard
- Ensure domain is verified in Mailgun

**Capacity not updating**

- Check Firestore rules allow write access
- Verify admin role is set correctly
- Check browser console for errors

## 📄 License

This project is proprietary software developed for Seagull Beach Resort.

## 🤝 Contributing

This is a private project. For internal contributions:

1. Create a feature branch
2. Write tests for new features
3. Update documentation as needed
4. Submit a pull request for review

## 📞 Support

For technical issues or questions:

- **Owner** omar.modrek@hurghadaseagull.com
- **Documentation:** Check `/docs` endpoint for API reference

## 🎯 Roadmap

### Completed ✅

- Multi-restaurant reservation system
- Real-time capacity management
- Role-based access control
- Email notifications
- Review system
- Multi-language support
- Payment tracking
- Backend testing suite

### Future Enhancements 🚧

- Frontend testing with Vitest
- SMS notifications (Twilio integration)
- Mobile app (React Native)
- Advanced analytics dashboard
- Waitlist management
- Table assignment system
- Integration with POS systems

---

**Built with ❤️ for Seagull Beach Resort, Hurghada**
