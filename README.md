# Gift Registry

A modern gift registry platform that helps you create and share wishlists for any occasion. Completely free to use!

## Free Deployment Guide

### 1. Deploy Frontend (Vercel - Free Tier)
1. Fork this repository to your GitHub account
2. Go to [Vercel](https://vercel.com)
3. Sign up with GitHub (free)
4. Click "Import Project"
5. Select your forked repository
6. Keep all default settings
7. Add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
8. Click Deploy

Your app will be live at: `https://your-project.vercel.app`

### 2. Set up Database (Supabase - Free Tier)
1. Go to [Supabase](https://supabase.com)
2. Sign up with GitHub (free)
3. Create a new project
4. Get your project URL and anon key from Settings > API
5. Run these SQL commands in the SQL editor:
   ```sql
   -- Run migrations in order from supabase/migrations/
   ```

### 3. Connect Frontend to Database
1. Copy your Supabase URL and anon key
2. Add them to your Vercel environment variables
3. Redeploy if needed

## Features

- 🎁 Create multiple gift registries
- 👥 Share with friends and family
- 💝 Add items from major retailers
- 💰 Track contributions
- 🔒 Privacy controls
- 📱 Mobile-friendly
- ✨ Real-time updates

## Free Tier Limits

### Vercel Free Tier
- Unlimited static sites
- 100GB bandwidth/month
- Automatic HTTPS
- Global CDN
- Continuous deployment

### Supabase Free Tier
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- Real-time subscriptions
- Database backups

## Tech Stack

- Frontend: Next.js 14
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Styling: Tailwind CSS
- UI: shadcn/ui
- Hosting: Vercel

## Local Development

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
```bash
cp .env.example .env.local
# Update .env.local with your Supabase details
```

4. Run development server:
```bash
npm run dev
```

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## Support

Need help? Open an issue on GitHub!

## License

MIT License - free to use for everyone! 