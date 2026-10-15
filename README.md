<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d97cfe0b-dd1a-40c5-8d36-92c4d4985563

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Features & Customization

- **Project Identity & Foot Tag Customization**:
  - Configure the **Project / System Name** (`#projectName`, defaults to `MelonPro`) and custom **Foot Tag / Tagline** (`#footTag`) inside the **Settings & Preferences** view.
  - Updates propagate live across the application:
    - Sidebar brand header & bottom greenhouse banner
    - Mobile topbar brand header
    - Browser document tab title (`<title>`)
    - Login screen header and footer
    - App content footer tag
  - Includes 1-click popular presets, live dual preview, bilingual Khmer/English support, local storage caching, and server persistence.

- **Plot Shape & Boundary Editor**:
  - Interactive Leaflet GIS boundary editor with satellite and topographic map providers.
  - Draw custom boundaries, apply preset geometries, rotate, translate, and inspect live area/perimeter metrics.
  - **Delete Plot Feature**: Directly placed after the **Clear All** button, allowing safe removal of a greenhouse plot and its crop cycles with inline confirmation.
