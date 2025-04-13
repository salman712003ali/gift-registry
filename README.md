# Gift Registry Platform

A modern gift registry platform that allows users to create and manage gift registries for special occasions.

## Features

- Create and manage gift registries
- Add gift items with prices and quantities
- Share registries via QR codes and links
- Group gifting and contributions
- Privacy settings for registries
- Email notifications for contributions
- User settings and preferences

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database, Storage)
- Radix UI
- Sonner (Toasts)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gift-registry.git
   cd gift-registry
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations` directory
   - Enable email auth in Supabase
   - Set up the email service in Supabase

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following tables:

- `users`: User profiles and preferences
- `registries`: Gift registries
- `gift_items`: Items in registries
- `contributions`: Contributions to gift items

## Deployment

The application can be deployed to Vercel:

1. Push your code to GitHub
2. Create a new project in Vercel
3. Connect your GitHub repository
4. Add environment variables
5. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 