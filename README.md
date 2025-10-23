# MoviesVerse - Bengali Movie Streaming Platform

A modern, responsive movie streaming platform built with Next.js, featuring a curated collection of Bengali and Bangladeshi films.

## Features

- **Search Functionality**: Quickly find movies by title
- **Genre Filtering**: Browse movies by genre categories
- **Trending Carousel**: Auto-rotating carousel showcasing trending movies
- **Movie Details Modal**: View comprehensive movie information including cast, director, and synopsis
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Pagination**: Browse through 50+ movies with easy navigation
- **Telegram Integration**: Direct integration with Telegram for movie requests and updates

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page with state management
│   └── globals.css         # Global styles and design tokens
├── components/
│   ├── header.tsx          # Search header component
│   ├── trending-carousel.tsx # Auto-rotating trending movies
│   ├── genre-categories.tsx # Genre filter buttons
│   ├── movie-grid.tsx      # Movie grid with pagination
│   ├── movie-modal.tsx     # Movie details modal
│   ├── footer.tsx          # Footer with social links
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── movie-data.ts       # Movie database and genres
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
\`\`\`

## Features Explained

### Search
- Real-time search filtering across all movies
- Case-insensitive title matching
- Displays helpful message when no results found

### Genre Filtering
- 8 genre categories: Action, Drama, Comedy, Thriller, Romance, Sci-Fi, Horror, Adventure
- Combined with search for advanced filtering
- "All" button to reset genre filter

### Trending Carousel
- Auto-rotates every 3 seconds
- Manual navigation with previous/next buttons
- Displays 3 movies at a time

### Movie Details
- Comprehensive information including:
  - Title, year, and rating
  - Director and cast
  - Duration and genres
  - Full description
- "Watch Now" button links to Telegram group

### Pagination
- 30 movies per page
- Easy navigation between pages
- Shows current page and total pages

## Telegram Integration

The app integrates with Telegram for:
- Movie requests and suggestions
- Direct messaging for movie availability
- Community discussions

**Telegram Group**: [@moviesversebdreq](https://t.me/moviesversebdreq)
**Facebook Group**: [MoviesVerse BD](https://www.facebook.com/groups/733950559669339/)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Click "Deploy"

The app will be automatically deployed and available at a Vercel URL.

### Environment Variables

No environment variables are required for basic functionality. The app uses static movie data.

## Customization

### Adding More Movies

Edit `/lib/movie-data.ts` to add more movies:

\`\`\`typescript
{
  id: 51,
  title: "Your Movie Title",
  poster: "/path-to-poster.jpg",
  year: 2024,
  rating: 8.5,
  description: "Movie description",
  genres: ["Genre1", "Genre2"],
  duration: 120,
  director: "Director Name",
  cast: ["Actor 1", "Actor 2", "Actor 3"],
}
\`\`\`

### Changing Colors

Edit `/app/globals.css` to modify the design tokens:

\`\`\`css
:root {
  --primary: oklch(0.52 0.22 142.5);  /* Primary color */
  --accent: oklch(0.52 0.22 142.5);   /* Accent color */
  /* ... other tokens ... */
}
\`\`\`

## Performance

- Optimized images with Next.js Image component
- Responsive design for all screen sizes
- Smooth animations and transitions
- Efficient state management with React hooks

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available under the MIT License.

## Support

For issues, feature requests, or questions:
- Telegram: [@moviesversebdreq](https://t.me/moviesversebdreq)
- Facebook: [MoviesVerse BD](https://www.facebook.com/groups/733950559669339/)

---

Built with ❤️ for Bengali movie lovers
