# Gift Registry

A modern gift registry platform that helps you create and share wishlists for any occasion.

## Features

- 🎁 Create multiple gift registries for different occasions
- 👥 Share registries with friends and family
- 💝 Add items from major retailers or custom items
- 💰 Track contributions and purchases
- 🔒 Privacy controls for your registries
- 📱 Mobile-friendly design
- ✨ Real-time updates
- 🤝 Group gifting support

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **UI Components**: shadcn/ui
- **State Management**: React Query
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gift-registry.git
   cd gift-registry
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update the environment variables in `.env.local` with your Supabase project details.

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

The easiest way to deploy your Gift Registry is to use [Vercel](https://vercel.com):

1. Push your code to a GitHub repository
2. Import your project to Vercel
3. Add your environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/gift-registry)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you need help or have questions:
- Open an issue
- Join our Discord community
- Email support@giftregistry.com

## Roadmap

- [ ] Mobile app
- [ ] Advanced analytics
- [ ] More retailer integrations
- [ ] Gift recommendations
- [ ] Thank you card management
- [ ] Price tracking
- [ ] Stock notifications 