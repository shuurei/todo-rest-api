# Autorisation par policies

L'authentification (`authMiddleware`) identifie l'utilisateur. Les policies décident s'il peut effectuer une action sur une ressource. Les flags restent la source des rôles ; `ADMIN` n'est pas un contournement global des policies.

## Règles actuelles

- Lecture d'un profil : tout utilisateur authentifié, comme auparavant.
- Modification d'un profil : son propriétaire ou un utilisateur avec `UserFlags.ADMIN`.
- Suppression d'un profil : uniquement son propriétaire, même pour un admin.
- Todos (lecture, création, modification, suppression) : uniquement leur propriétaire, via `TodoPolicy` et `authorize`, même pour un admin.

`PATCH /api/users/:userId` ne permet toujours pas de modifier les flags : seuls les champs de `updateUserSchema` sont acceptés.

## Utilisation

Les règles métier sont dans `apps/backend/src/policies/user.policy.ts` :

```ts
static update(actor: User, user: User): boolean {
    return actor.id === user.id || hasFlag(actor.flags, UserFlags.ADMIN);
}
```

Le middleware générique applique une règle sur une ressource chargée côté serveur :

```ts
router.use(authMiddleware);
router.param('userId', resolveMe);
router.patch('/:userId', [
    authorize(UserPolicy.update, req => UserService.findById(String(req.params.userId))),
    validateBody(updateUserSchema),
], UserController.update);
```

L'ordre est important : authentification, résolution de `@me` via `router.param`, autorisation, validation, contrôleur. Les contrôleurs de modification/suppression de profil et toutes les actions de `TodoController` supposent que leur route applique la policy correspondante.

`authorize` recharge l'acteur depuis la base pour obtenir ses flags actuels, puis charge la ressource et appelle la policy. Une policy peut retourner un booléen ou une promesse de booléen.

- Acteur absent : `401`.
- Ressource inexistante : `404` via son service.
- Action refusée : `403`.

Pour une nouvelle ressource, créer une policy dédiée et l'appliquer explicitement à chaque route concernée avec `authorize`. Les vérifications de permissions et de flags restent dans les policies, pas dans les contrôleurs ni dans un middleware admin séparé.
