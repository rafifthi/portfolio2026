# Portfolio CMS Setup

Required environment variables:

```txt
DATABASE_URL="postgresql://..."
ADMIN_PASSWORD="change-this"
ADMIN_SESSION_SECRET="use-a-long-random-string"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_GALLERY_FOLDER="portfolio-cms/gallery"
CLOUDINARY_PORTFOLIO_BANNER_FOLDER="portfolio-cms/portfolio-banners"
CLOUDINARY_PORTFOLIO_ICON_FOLDER="portfolio-cms/portfolio-icons"
```

`ADMIN_SESSION_SECRET` can be omitted locally, but production should set it to a
different long random value from `ADMIN_PASSWORD`.

The app creates the `cms_entries` table automatically on first CMS request. If
you prefer to create it manually in Neon, run `docs/cms-schema.sql`.

Cloudinary uploads use fixed folders by upload target:

- `gallery` -> `CLOUDINARY_GALLERY_FOLDER`
- `portfolio-banner` -> `CLOUDINARY_PORTFOLIO_BANNER_FOLDER`
- `portfolio-icon` -> `CLOUDINARY_PORTFOLIO_ICON_FOLDER`
