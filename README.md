# int28-cm

Relational graph: for individual and collective latent connections exploration. People can create nodes and connections in a shared interconnect network of nodes.

## Stack

- **Frontend**: React 19, TypeScript, Vite
- **2D editor**: React Flow (`@xyflow/react`)
- **3D view**: React Force Graph 3D + Three.js
- **Backend**: Cloudflare Pages Functions (serverless)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Auth**: Cookie-based anonymous identity (UUID, no emails, no passwords)
- **State**: Zustand

---

## Features

### First-time mode
When a user opens a graph for the first time, they enter **first-time mode**: they can only see their own nodes, plus ghost outlines of other users' nodes (shapes without text). This avoid people's external influence on the individual person. Clicking **Show →** in the toolbar reveals all nodes.

### Nodes
- Each user has a randomly assigned colour applied to all their nodes
- Users can only edit or delete their own nodes
- Users can connect their own nodes to anyone else's nodes
- The root node (layer -1) is independent but always visible and connectable

### Layers
Nodes are organised into layers (0, 1, 2…). Layer -1 is reserved for the root node. Higher layers are for meta-analysis or critique of the individual's own nodes or other people's nodes. Lower layers are for conceptual development or response. Layers can be toggled on/off in the sidebar.

---

## Local development

### 1. Install dependencies
```bash
npm install
```

### 2. Create the local D1 database
```bash
npx wrangler d1 execute int28-cm --local --file=schema.sql
```

### 3. Set environment variables
Start the server with

then create a user and copy the key.

Create `.env.local`:
```
VITE_ADMIN_USER_ID=your-key-here
```
in order to make that user admin.

### 4. Start the dev server
```bash
# Terminal 1 — Wrangler (handles API + D1)
npx wrangler pages dev --proxy 5173

# Terminal 2 — Vite
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deployment (Cloudflare Pages)

### 1. Create the production D1 database
```bash
wrangler d1 create int28-cm
```
Copy the returned `database_id`.

### 2. Update `wrangler.toml`
Update this line with your `database_id`:
```
database_id = "your-database-id-here"
```

### 3. Run the schema on production
```bash
wrangler d1 execute int28-cm --file=schema.sql
```

### 4. Push to GitHub

### 5. Connect to Cloudflare Pages
In the Cloudflare dashboard, create a new Pages project connected to your GitHub repo:
- Build command: `npm run build`
- Build output directory: `dist`

### 6. Set environment variables
In Cloudflare Pages → Settings → Environment variables, add:
- `VITE_ADMIN_USER_ID` — your admin UUID (needed at build time for Vite)

In Cloudflare Pages → Settings → Functions → D1 database bindings, add:
- Binding name: `DB`, select your `int28-cm` database

### 7. Set the admin secret
```bash
wrangler pages secret put ADMIN_USER_ID
```
Paste the same UUID used for `VITE_ADMIN_USER_ID`. This is read server-side by the Functions.

## Admin panel

The admin panel is hidden by default. To open it:
1. Set `VITE_ADMIN_USER_ID` to your user UUID in both `.env.local` and Cloudflare Pages env vars
2. A golden dot appears next to the **int28-cm** text, in the left top corner
3. **Triple-click** the text to open the admin panel

From the admin panel you can:
- Manage graphs (create, remove)
- Manage user list (users' name and key, delete)