This is a [Next.js](https://nextjs.org) project to easily share your ranked values for a variety of categories, helping people understand each other better.

## Getting Started

Ensure you have a `.env.local` file with local Mongo settings:

```
# Set up your own local mongo db
MONGODB_URI="mongodb+srv://<YOUR_MONGO_USERNAME>:<YOUR_MONGO_PASSWORD>@<YOUR_CLUSTER_NAME>.???.mongodb.net/"
MONGODB_DATABASE="value_ranker"
MONGODB_RANKINGS_COLLECTION="rankings"
```

Run the development server:

```bash
npm run dev
```

## Improvements

- Routes could be params rather than search params for actual resources
- /ranking/edit and /ranking/new should reuse components instead of /edit importing /new's page component entirely (hack)

## Deployed on Vercel
