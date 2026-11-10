# Authentification web et mobile

## Web

- `POST /api/auth/login` et `/api/auth/register` renvoient `{ data: { user } }`, jamais le token.
- Le serveur écrit le JWT dans le cookie `session` : `HttpOnly`, `SameSite=Lax`, `Path=/api`, durée de sept jours.
- `Secure` est activé sauf avec `NODE_ENV=DEV`. En production, HTTPS est obligatoire.
- Axios utilise `withCredentials: true`. Aucun token n'est conservé dans JavaScript ou localStorage. L'ancienne entrée `auth-storage` est supprimée automatiquement : les utilisateurs devront se reconnecter après cette migration.
- Le loader vérifie `/api/users/@me` à chaque navigation et transmet la session à `AuthProvider`. L'utilisateur et ses préférences sont partagés via `useAuth()`. Les expirations sont gérées par le layout.
- Les erreurs 401 des autres appels API sont prises en charge par un intercepteur installé et nettoyé dans le layout, avec un état local pour la modale.
- La déconnexion révoque la session côté serveur et supprime le cookie.

## Origines et CSRF

Le frontend utilise `/api` en production (reverse proxy recommandé). Pour une API sur un autre sous-domaine, définir `VITE_API_URL=https://api.example.com/api` au build du frontend.

Configurer le backend avec `WEB_ORIGINS`, une liste d'origines exactes séparées par des virgules, par exemple `https://app.example.com,https://admin.example.com` (sans slash final ni chemin). Cette configuration est utilisée pour CORS et la vérification CSRF. Hors DEV, aucune origine n'est autorisée par défaut. Une valeur explicite remplace les valeurs par défaut ; une valeur vide n'autorise aucune origine. `*` et `null` ne sont pas acceptés comme origines autorisées. Redémarrer le backend après modification.

Les requêtes de modification utilisant un cookie doivent fournir un `Origin` autorisé. Le login et l'inscription web l'exigent également pour empêcher le login CSRF. Les navigateurs envoient cet en-tête automatiquement. Les origines non autorisées sont rejetées avant les contrôleurs.

En DEV, les origines localhost:5173, localhost:3000 et 127.0.0.1:5173 sont autorisées par défaut. Ouvrir de préférence le frontend sur `http://localhost:5173` pour correspondre à l'URL Axios `http://localhost:3000` : mélanger localhost et 127.0.0.1 peut bloquer les cookies SameSite. En production, le frontend et l'API doivent rester sur le même site pour `SameSite=Lax` (par exemple app.example.com et api.example.com).

HttpOnly limite le vol de token, mais ne protège pas contre toutes les conséquences d'une XSS : conserver la prévention des injections et prévoir une CSP.

## Mobile natif

- Utiliser les mêmes endpoints que le web : `POST /api/auth/login` et `/api/auth/register`, avec le header `X-Auth-Mode: bearer`. La réponse est `{ data: { user, token } }`, sans cookie.
- Sans ce header (ou avec `X-Auth-Mode: cookie`), la réponse utilise un cookie HttpOnly et ne contient pas de token. Les anciennes URLs `/api/auth/mobile/*` sont supprimées.
- Stocker le token dans Keychain / stockage sécurisé Android, puis utiliser `Authorization: Bearer …` sur les routes existantes.
- Le mode Bearer refuse les requêtes portant `Origin` ou `Sec-Fetch-Site` afin de ne pas exposer les tokens aux navigateurs, même si un script ajoute `X-Auth-Mode: bearer`. Ce contrôle n'est pas une preuve d'identité du client ; les identifiants utilisateur restent obligatoires.
- `POST /api/auth/logout` révoque aussi les sessions mobiles.

## Stockage des sessions en base

Le JWT brut n'est jamais sauvegardé. Chaque session possède :

- un `id` UUID aléatoire, inclus dans le claim JWT `jti` ;
- un `tokenHash` non sélectionné par défaut, contenant une empreinte Argon2id au format PHC (algorithme, paramètres, sel et empreinte).

Les mots de passe et les tokens utilisent directement `argon2.hash(value)` et `argon2.verify(hash, value)`, avec les paramètres par défaut de la bibliothèque. Aucun sel n'est généré manuellement et aucun helper cryptographique personnalisé n'est utilisé.

Après vérification de la signature JWT, le serveur recherche la session par `id` et `userId`, puis vérifie son empreinte avec Argon2.

### Compatibilité des anciennes données

Aucune nouvelle migration, conversion automatique ou compatibilité bcrypt/SHA-256 n'est prévue. Les comptes avec un ancien mot de passe bcrypt nécessitent un nouveau mot de passe encodé avec Argon2 ; les anciennes sessions ne sont plus acceptées. Aucune donnée n'est supprimée automatiquement.

## Vérifications

Depuis la racine :

```sh
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend build
```
