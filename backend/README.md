# TN91 Backend API

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   ```
   cp .env.example .env
   ```

2. Make sure MongoDB is running (local or MongoDB Atlas)

3. Install dependencies and start:
   ```bash
   npm install
   npm run dev     # development (nodemon)
   npm start       # production
   ```

## API Endpoints

### Auth
| Method | Endpoint                    | Access  | Description        |
|--------|-----------------------------|---------|--------------------|
| POST   | /api/auth/register          | Public  | Register new user  |
| POST   | /api/auth/login             | Public  | Login              |
| GET    | /api/auth/me                | Private | Get current user   |
| PUT    | /api/auth/profile           | Private | Update profile     |
| PUT    | /api/auth/change-password   | Private | Change password    |

### Reviews
| Method | Endpoint                    | Access  | Description        |
|--------|-----------------------------|---------|--------------------|
| GET    | /api/reviews/:productId     | Public  | Get reviews        |
| POST   | /api/reviews/:productId     | Private | Add review         |
| DELETE | /api/reviews/:id            | Private | Delete review      |

### Orders
| Method | Endpoint                    | Access  | Description        |
|--------|-----------------------------|---------|--------------------|
| POST   | /api/orders                 | Private | Create order       |
| GET    | /api/orders/my              | Private | My orders          |
| GET    | /api/orders                 | Admin   | All orders         |
| PUT    | /api/orders/:id/status      | Admin   | Update order status|
