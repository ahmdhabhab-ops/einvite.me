# AI Bridal Studio

Brides try existing dresses on themselves with fal.ai's virtual try-on
([`fal-ai/image-apps-v2/virtual-try-on`](https://fal.ai/models/fal-ai/image-apps-v2/virtual-try-on)).

- Bride's page: `/bridal-studio`, for signed-in, active eInvite.me accounts.
- Admin: the **Bridal Studio** tab in `/admin`, for dress shops, catalogs and usage/cost.
- Code:
  - `bridal/fal.js`: fal calls. This is the only file that reads `FAL_KEY`.
  - `bridal/studio.js`: routes, limits, usage, previews, catalog, links.
  - `bridal/safe-fetch.js`: guarded fetching of shop pages and images.
  - `src/BridalStudio.jsx`: the page and the admin panel.
- Tests: `tests/bridal-studio.test.js` (`npm test`), run against a fake fal.

It is **off** until `BRIDAL_STUDIO_ENABLED=1` is set.

## Two separate features

- **Try on an existing dress**: built here. The model dresses the bride's photo in the dress from a photo. It doesn't design anything.
- **Design a new dress**: shown as "coming later" on its own tab. It needs a different, design-oriented model and isn't wired to the try-on model.

## How a try-on works

1. The browser shrinks the bride's photo to at most 1600 px as JPEG. That also drops metadata like GPS.
2. She picks the dress in one of three ways:
   - a dress from a shop's catalog;
   - an uploaded photo;
   - a link from a supported shop, which she confirms after seeing the photo.
3. The server checks both images are really JPEG/PNG/WebP. It reserves one attempt against her limits and queues the job on fal with `person_image_url`, `clothing_image_url` (both sent as data URIs) and `preserve_pose: true`.
4. The browser polls the job. The server waits for fal, then downloads the result from fal's CDN without the key, and saves it to the **private** `bridal-studio` storage bucket. The bucket is created on start if it's missing.
5. The result screen shows:
   - the preview, with "AI visual preview, not a measurement or a guarantee of fit";
   - **Download**, **Try again**, **Try another dress** and **Delete**;
   - for a shop dress, the shop name and **See the dress on the shop's website**.

## Privacy and retention

- **Original photos:** the bride's photo and the dress photo go only to fal.ai, for that one preview. This server doesn't store them. The page says so, and she must tick a consent box first.
- **Previews:**
  - stored in a private bucket, under the owner's id;
  - served only through `/api/bridal/results/<id>/image` to the account that made them (others get 404, signed-out visitors 401), with `cache-control: private, no-store`;
  - deleted after `BRIDAL_RETENTION_DAYS` (default 30) by a sweep every 6 hours, or at once with **Delete** / **Delete all**.
- **fal.ai's own handling** of request data is governed by fal's terms and privacy policy. Check fal's current retention for inputs and outputs, and mention it in eInvite's privacy policy before launch.

## Key and logs

- `FAL_KEY` is read only in `bridal/fal.js`. It is sent only in the `Authorization` header and only to `*.fal.run` / `*.fal.ai` hosts.
- It is never sent to the CDN download, never returned to the browser, and never logged. Errors are reduced to a status and a short message with any key text replaced by `[hidden]`.
- Nothing else in the app uses fal.
- `FAL_QUEUE_BASE_URL` exists only for tests and is ignored when `NODE_ENV=production`, which the Docker image sets.

## Limits, usage and cost

- **Limits:** per person `BRIDAL_DAILY_LIMIT` (default 5) and `BRIDAL_MONTHLY_LIMIT` (default 30). Everyone together: `BRIDAL_GLOBAL_DAILY_LIMIT` (default 200), which caps the daily spend at about 200 × $0.04 = $8. The admin isn't limited per person.
- **Concurrency:** one running preview per person and at most 4 at once. A failed try that fal didn't bill is given back.
- **Usage record:** `einvite:bridal-usage`, admin-only. It is separate from every other AI feature and holds per month (attempts, previews made, failed, cost) and per person, plus the last 300 attempts with time, seconds, fal's inference time and fal's `request_id`.
- **Cost:** counted at `BRIDAL_PRICE_USD` per preview (default 0.04, fal's listed price per image). The real charge must be confirmed against fal's billing; the request ids in the admin table make that a one-to-one check.

## Dress shops (admin)

**Shop fields**
- name, website, logo (upload or https link), shown/hidden;
- **Brides may paste links from this shop's site**: turn this on only when the shop allowed using its product photos;
- extra domains, e.g. its image CDN.

**Dress fields:** photo (upload or https link), name, product page link, optional price and currency, shown/hidden. Each dress also records `source` (`manual` for now) and `externalId`.

**Future import:** the shop record has an `importSource` slot (`csv` | `feed` | `api` + url). Nothing reads it yet. A future importer only has to map rows to `normalizeDress()` with `source` and `externalId` set, so re-imports can update rather than duplicate.

## Dress links

- **Supported sites:** a link is accepted only from an active shop whose admin enabled links. That covers its website's domain and any listed extra domains. Any other link gets "This site isn't supported for links yet. You can upload a photo of the dress instead.", with the list of supported shops and an **Upload a photo instead** button.
- **Catalog links:** a link to a dress already in that shop's catalog uses the catalog photo directly.
- **Other product pages:** the server reads the page's `og:image` (or a JSON-LD `Product` image) and title, and shows the photo for her to confirm. The confirmed choice travels as a signed, 30-minute token, so the browser can't swap in another address.
- **Fetching safeguards (`safe-fetch.js`):**
  - https only, port 443, no user/password, no IP-literal or local host names;
  - every resolved address is checked and the connection goes to that checked address, so DNS can't switch to a private address in between;
  - private, loopback, link-local (cloud metadata) and multicast ranges are refused;
  - at most 3 redirects, each checked again;
  - size and time limits;
  - images must really be JPEG/PNG/WebP by their bytes.

## Settings (names only; set them on the app in Dokploy)

| Name | Default | |
|---|---|---|
| `BRIDAL_STUDIO_ENABLED` | off | `1` turns it on |
| `FAL_KEY` | (set) | fal.ai key, already on the server |
| `BRIDAL_DAILY_LIMIT` | 5 | previews per person per day |
| `BRIDAL_MONTHLY_LIMIT` | 30 | previews per person per month |
| `BRIDAL_GLOBAL_DAILY_LIMIT` | 200 | previews per day for everyone |
| `BRIDAL_PRICE_USD` | 0.04 | cost counted per preview |
| `BRIDAL_RETENTION_DAYS` | 30 | days a preview is kept |

It also needs the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD`.

## Measuring real quality and cost (needs the real FAL_KEY)

This was tested end to end against a fake fal, because fal.ai isn't reachable from the development sandbox. To measure the real thing on a test deploy:

1. Turn it on (`BRIDAL_STUDIO_ENABLED=1`), sign in as a test client, and add one shop with 3 to 5 dresses.
2. Run about 10 previews with consenting test photos:
   - different body types, poses and lighting;
   - catalog dresses and uploaded dress photos;
   - one bad photo (cropped or sitting) on purpose.
3. For each, note:
   - whether her face, skin tone and body shape stayed recognisable;
   - whether the dress details stayed (neckline, lace, train, colour);
   - visible errors (hands, edges, background).
4. In **Admin → Bridal Studio**, read the seconds and request id of each attempt. In fal's dashboard, read the charge for the same request ids. Compare with the counted $0.04.
