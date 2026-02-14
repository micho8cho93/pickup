# Pickup Games Frontend

## Runtime environment configuration

`script.js` no longer hardcodes API URLs. The app loads `config.json` at startup and selects the backend/API routes using `currentEnvironment`.

If `config.json` is missing or invalid, the app falls back to embedded production-safe defaults.

## Environment mapping (frontend URL -> backend base URL -> DB)

| Environment | Frontend URL | Backend Base URL | Database |
|---|---|---|---|
| development | `http://localhost:3000` | `http://localhost:8000` | `postgresql://pickup_dev` |
| staging | `https://staging.example.com/pickup` | `https://staging-api.example.com` | `postgresql://pickup_staging` |
| production | `https://<github-username>.github.io/pickup/` | `https://testliga.up.railway.app` | `railway: postgres production` |

> Replace placeholder URLs (`<github-username>`, `staging.example.com`, `staging-api.example.com`) with your exact deployed addresses.

## Django health/version endpoint contract

This frontend expects a lightweight backend endpoint at:

- `GET /futbol/api/health` (or equivalent `/version` endpoint)

Recommended Django response shape:

```json
{
  "environment": "production",
  "commit": "abc1234"
}
```

Example implementation in Django:

```python
# urls.py
from django.urls import path
from .views import health_view

urlpatterns = [
    path("futbol/api/health", health_view, name="health"),
]
```

```python
# views.py
import os
from django.http import JsonResponse


def health_view(request):
    return JsonResponse(
        {
            "environment": os.getenv("DJANGO_ENV", "unknown"),
            "commit": os.getenv("GIT_COMMIT", "unknown"),
        }
    )
```

## Runtime backend-target confirmation

On startup, frontend logs:

- frontend environment + URL
- backend URL
- backend environment + commit hash from `/health`

Use browser devtools console to confirm that GitHub Pages is targeting the expected backend environment before validating signup.

## Signup verification checklist (GitHub Pages -> backend DB)

1. Open your exact GitHub Pages URL for this app.
2. Confirm startup log shows expected backend environment/commit.
3. Submit signup with a unique email (e.g. `qa+timestamp@example.com`).
4. Verify response was successful in Network tab for `POST /futbol/api/game-players`.
5. Confirm same record exists in the DB tied to that backend environment:
   - via Django admin,
   - direct DB query, or
   - `GET /futbol/api/game-players?email=<email>` if supported.
