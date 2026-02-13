# MedVault

MedVault is a local-first medical record organizer. Upload PDFs (labs, prescriptions, imaging, bills), extract structured data, and view trends in a modern dashboard. All data is stored in your browser’s localStorage.

## Features
- PDF upload + extraction
- Structured medical data in a clean dashboard
- Customizable trend charts
- Profile management (allergies, conditions, provider, next visit)
- Doctor visit summary export
- Document detail view

## Tech Stack
- Next.js App Router
- Tailwind CSS
- LocalStorage for persistence

## Setup

### 1) Install
```bash
npm install
```

### 2) Environment
Copy `.env.example` to `.env.local` and fill in your keys.

```bash
cp .env.example .env.local
```

### 3) Run
```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables
```
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5-nano
```

## Notes
- Data is stored in the browser; clearing localStorage will reset everything.
- For production, replace localStorage with a database.

## License
MIT
