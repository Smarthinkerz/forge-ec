# Connecting a real store

The Stores page connects live to your e-commerce platform and pulls your real
catalog. Pick your platform, paste the credentials below, and click **Connect**.
Use **Use sample data** any time to run the demo flow instead.

Credentials are encrypted at rest with AES-256-GCM. Set
`CREDENTIALS_ENCRYPTION_KEY` (e.g. `openssl rand -base64 32`) in your environment
to enable saving them for one-click re-sync. Without it, connecting still works,
but you'll re-enter credentials each time.

## Shopify
- **Store domain** — `your-store.myshopify.com`
- **Admin API access token** — `shpat_...`
- Get it: Shopify admin -> Settings -> Apps and sales channels -> Develop apps ->
  create an app -> Admin API access scopes -> enable `read_products` -> Install ->
  reveal the Admin API access token.
- API used: Admin GraphQL `https://{shop}/admin/api/2024-10/graphql.json`.

## WooCommerce
- **Site URL** — `https://yourstore.com`
- **Consumer key** — `ck_...`  /  **Consumer secret** — `cs_...`
- Get it: WooCommerce -> Settings -> Advanced -> REST API -> Add key ->
  permissions: Read. Requires HTTPS.
- API used: REST v3 `GET /wp-json/wc/v3/products`.

## BigCommerce
- **Store hash** — the `abc123` in `store-abc123.mybigcommerce.com`
- **API access token**
- Get it: Settings -> API -> Store-level API accounts -> create -> scope
  Products = read-only. Copy the Access Token.
- API used: `GET /stores/{hash}/v3/catalog/products`.

## Magento 2
- **Base URL** — `https://yourstore.com`
- **Integration access token** — Bearer token
- Get it: Admin -> System -> Integrations -> Add -> activate -> copy the Access
  Token.
- API used: `GET /rest/V1/products`.

## Notes
- Only **read** scope is needed — ForgeEC pulls your catalog; it never writes to
  your store.
- The registry (`lib/stores/registry.ts`) automatically uses the live adapter
  once required credentials are present, and falls back to the sandbox otherwise.
- Re-sync re-pulls the catalog using the saved (encrypted) credentials.
- One-time DB step: run `supabase/migrations/0001_store_credentials.sql` so the
  `stores` table has the `credentials_enc` and `last_synced_at` columns.
