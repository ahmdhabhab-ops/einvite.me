# Edit text in image

In the Builder, the couple draws a box around English text in a photo (a custom image, or the page background photo). Then:

1. The text is read and they correct it.
2. The letters are removed from the photo. Only pixels inside the box change.
3. The text comes back as a normal custom text block over the cleaned photo, so they can change its words, font, size, color, alignment and position, and translate it.

The cleaned photo and the text are saved separately. "Restore original image/photo" brings the original back, and the Undo bar right after applying reverses the whole edit.

## Where to find it

When the feature is on:

- **Move & style on the phone → "Edit text in image"**: upload a new photo and edit its text.
- **A custom image's "Edit text" button**: in its toolbar or side panel.
- **"Edit text in this photo"**: under a page's background photo.

## Settings

Set these on the app in Dokploy. Only the names are listed here; never paste the values into chats.

| Name | What it does |
|---|---|
| `IMAGE_TEXT_EDIT_ENABLED` | `1` turns it on for everyone, `admin` for the admin only. Unset means off, and no button shows anywhere. |
| `OPENAI_API_KEY` | Already set. Reads the text with the vision model. |
| `IMAGE_TEXT_AI_ERASE` | `1` turns on the paid "AI erase" option. It's off by default. |
| `STABILITY_API_KEY` | Stability AI key for AI erase. It's only used on the server. |

## Cost

| Step | Cost |
|---|---|
| Reading the text (OpenAI, small crop) | Under $0.001 per read |
| Quick fill | Free, runs in the browser |
| AI erase (Stability AI "Erase") | About $0.05 per image (5 credits) |

## Limits per client

| Step | Limit |
|---|---|
| Reading the text | 60 per hour |
| AI erase | 20 per hour and 40 per day |

The admin isn't limited. A monthly count with an estimated cost is kept in `kv_store` under `einvite:image-text-usage`, and the admin can see it at `GET /api/image-text/config`.

v1 reads English only. The original font can't always be identified, so the closest editor font is suggested and can be changed.
