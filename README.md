# Ms Kitchen

A recipe and cooking management application built with Node.js, Express, and PostgreSQL.

## Features

- RESTful API for managing recipes
- PostgreSQL database for data storage
- Pre-seeded with sample recipes
- Ready for Railway deployment

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Deployment**: Railway

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Seed the database:
   ```bash
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Railway deployment instructions.

## License

MIT

