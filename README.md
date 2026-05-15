# LingoHub

A full-stack social forum for language enthusiasts. Users can share posts, comment, upvote, save content, filter by tags, and post anonymously, all backed by a Supabase PostgreSQL database with real authentication.

---

## Live Demo

[lingohub.vercel.app](https://lingo-hub.vercel.app) 

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth — email/password, Google OAuth |

---

## Features

### Core
- **Home feed** — paginated post cards with title, author, date, upvote count, and tags
- **Post detail** — modal with full content, image, tags, and threaded comments
- **Create post** — title, content, optional image URL, tags, anonymous toggle
- **Edit / delete posts** — owners can edit or delete from the My Posts page
- **Comments** — add comments on any post, with optional anonymous posting
- **Upvotes** — toggle upvote with optimistic UI and server reconciliation
- **Save posts** — heart-icon save to a personal Saved Posts dashboard

### Discovery
- **Tag filtering** — add/remove multiple tag filters on the home feed
- **Sort** — by most recent or most popular (upvotes)
- **Search** — full-text search across title, content, author name, and tags

### Auth & Identity
- Email/password sign-up and login
- Google OAuth sign-in
- Auto-generated unique username on account creation
- Display name shown in navbar (fetched from user profile)
- Protected routes redirect guests to `/auth` with a contextual reason message
- Anonymous posting and commenting

### Data Migration
- Migrated from Firebase Firestore to Supabase PostgreSQL
- Lazy password migration via Supabase Edge Function — legacy Firebase users are migrated on their first Supabase login without needing to reset their password

---

## Project Structure

```
src/
├── components/
│   ├── AuthPage.js        # Auth page layout (Login + SignUp side by side)
│   ├── CommentSection.js  # Comment list + add comment form
│   ├── Dashboard.js       # Saved posts page (/saved)
│   ├── HomeFeed.js        # Main feed with filtering and sorting
│   ├── Login.js           # Login form
│   ├── MyPosts.js         # User's own posts (/my-posts) — edit + delete
│   ├── Navbar.js          # Top navigation with search and create post
│   ├── PostCard.js        # Post card component (save + upvote actions)
│   ├── PostDetail.js      # Full post modal with comments
│   ├── PostForm.js        # Create / edit post modal form
│   ├── ProtectedRoute.js  # Route guard — redirects to /auth if not logged in
│   └── SignUp.js          # Sign-up form
├── contexts/
│   └── AuthContext.js     # Global auth state via Supabase Auth
├── services/
│   ├── analyticsService.js  # Vercel Analytics event wrappers
│   ├── dataService.js       # All read operations (posts, comments, tags, saves, upvotes)
│   ├── postService.js       # All write operations (create, update, delete, comment, upvote, save)
│   └── userService.js       # User profile operations (in progress)
├── styles/                  # Per-component CSS files
├── supabase.js              # Supabase client initialization
└── App.js                   # Root component with routing
```

---

## Database Schema

```sql
users          (id, email, username, display_name, preferred_language)
posts          (id, user_id, title, content, image_url, is_anonymous, author_name, upvotes_count, created_at, updated_at)
post_tags      (post_id, tag)
comments       (id, post_id, user_id, content, is_anonymous, author_name, created_at)
saved_posts    (post_id, user_id, saved_at)
upvotes        (post_id, user_id)
```

---

## Roadmap

- [ ] User profile page — edit username, display name, password, preferred language
- [ ] Connection requests — follow / connect with other users
- [ ] Email notifications — upvotes, comments, saves, connection requests (Supabase triggers)
- [ ] Direct messaging — chat between connected users via Supabase Realtime
- [ ] AI translation — auto-translate posts not in the user's preferred language
- [ ] Create post from any page (currently only available from the home feed)
- [ ] Comment edit / delete
- [ ] Infinite scroll / pagination (currently capped at 50 posts)

---

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY

# Start development server
npm start
```

---

## License

Copyright 2026 Ramatoulaye Bah — Apache License 2.0