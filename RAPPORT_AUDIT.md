# Rapport d'audit — NDC COSPLAY

## Corrections appliquées

- Suppression des valeurs par défaut des identifiants/secrets d'administration ; contrôle des longueurs minimales et comparaison constante.
- Suppression de la base en mémoire et de la passerelle Lovable ; accès SQL direct via `@neondatabase/serverless` et `DATABASE_URL`.
- Deux retries maximum sur les lectures uniquement lorsqu'une erreur est transitoire ; aucune répétition automatique des écritures.
- Erreurs de base de données traduites par le message français demandé.
- Schéma Neon idempotent, sans données de démonstration ni GRANT/policies Supabase ; paramètres initiaux vides.
- Téléversement navigateur direct vers Vercel Blob après compression WebP (1600 px max), token limité aux images et à 5 Mo.
- Suppression du stockage local des photos ; suppression Blob via le SDK ; SQL de nettoyage des anciennes URL `/uploads/`.
- Limitation anti-abus persistée dans `rate_limits`, clé IP hachée et clé de repli distincte à limite plus basse.
- Limitation du suivi de commande et message neutre `Aucune commande trouvée`.
- Cookie de session `HttpOnly`, `SameSite=Lax` et `Secure` en production.
- Mise à jour de la documentation, des variables d'environnement et de la configuration Vercel.

## Variables d'environnement requises

Configurer ces cinq variables côté serveur, dans `.env` local et dans Vercel (Preview/Production selon l'environnement) :

| Variable | Rôle |
|---|---|
| `ADMIN_EMAIL` | E-mail administrateur |
| `ADMIN_PASSWORD` | Mot de passe administrateur — 12 caractères minimum |
| `SESSION_SECRET` | Secret de signature — 32 caractères minimum |
| `DATABASE_URL` | Chaîne de connexion Neon PostgreSQL |
| `BLOB_READ_WRITE_TOKEN` | Jeton d'écriture du store Vercel Blob |

Générer un secret sans le mettre dans le dépôt :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Ne jamais ajouter `VITE_` devant ces variables privées. Ne pas envoyer leurs valeurs dans le chat et ne pas commiter `.env`.

## Installation, tests et build

À exécuter à la racine du projet :

```bash
npm install
npm run test
npm run lint
npm run build
```

Le test d'intégration Neon est ignoré si `TEST_DATABASE_URL` n'est pas défini. Pour l'activer, définir `TEST_DATABASE_URL` vers une base de test distincte, jamais vers la base de production.

**Limite de vérification :** l'installation des dépendances a expiré deux fois dans l'environnement d'exécution de cette session. Le build Vite, les tests Vitest et le lint n'ont donc pas pu être exécutés ici. Il faut les lancer localement/CI avant de considérer le déploiement validé. Aucun accès à votre vraie base Neon ni à votre store Blob n'était disponible pour tester les opérations réelles.

## Initialisation Neon

1. Ouvrir le SQL Editor de Neon.
2. Copier et exécuter tout le contenu de `schema.sql`.
3. Vérifier que les tables `settings`, `products`, `home_images`, `orders` et `rate_limits` existent.
4. Compléter les coordonnées de la boutique dans l'administration une fois le site configuré.

Vérification rapide :

```sql
select * from public.settings;
select * from public.products;
select * from public.home_images;
select * from public.orders;
select * from public.rate_limits;
```

Les tables ne reçoivent aucun produit de démonstration. La ligne initiale `settings` contient des valeurs de contact vides.

### Nettoyage des anciennes références photo

Si l'ancienne version a enregistré des URL locales `/uploads/`, exécuter le contenu de `cleanup_legacy_uploads.sql` dans Neon. Cette opération retire ces URL des tableaux `products.images` et supprime les lignes `home_images` correspondantes. Les anciennes images de test ont été supprimées du dossier `public/uploads/` dans l'archive corrigée.

## Vérifications manuelles avant mise en production

1. **Secrets absents :** dans un environnement temporaire sans `ADMIN_EMAIL`, `ADMIN_PASSWORD` ou `SESSION_SECRET`, tenter la connexion admin. L'accès doit être refusé avec un message de configuration explicite.
2. **Sécurité du mot de passe :** vérifier qu'un mot de passe de moins de 12 caractères ou un secret de moins de 32 caractères est refusé.
3. **Blocage admin :** effectuer 5 tentatives erronées depuis la même IP ; la connexion doit être bloquée pendant 15 minutes.
4. **Commandes :** envoyer une commande valide, vérifier le numéro `NDC-XXXX`, puis confirmer sa présence avec `select * from public.orders;`.
5. **Persistance :** redéployer après une commande et vérifier qu'elle est toujours présente.
6. **Photos :** charger une image JPEG/PNG/WebP de moins de 5 Mo, vérifier que l'URL est une URL Vercel Blob, supprimer la photo et confirmer sa disparition du store. Re-déployer et confirmer que les photos encore référencées s'affichent.
7. **Fichiers refusés :** tenter un SVG, un autre type MIME ou un fichier de plus de 5 Mo ; le téléversement doit être refusé.
8. **Suivi :** faire 10 tentatives de suivi en 15 minutes depuis la même IP ; les suivantes doivent être limitées. Une commande absente et des informations erronées doivent produire exactement `Aucune commande trouvée`.
9. **Anti-spam commandes :** envoyer plus de 5 commandes depuis la même IP en 10 minutes ; les suivantes doivent être refusées. Le champ piège et le délai minimal restent actifs.
10. **Cookies :** en production, inspecter le cookie `ndc_admin_session` et vérifier `Secure`, `HttpOnly`, `SameSite=Lax`.
11. **Logs :** vérifier qu'une panne Neon affiche le message de service indisponible et ne retourne jamais un faux succès.

## Déploiement Vercel

1. Pousser le dépôt sur GitHub puis l'importer dans Vercel.
2. Créer un store Blob dans Vercel et configurer `BLOB_READ_WRITE_TOKEN`.
3. Ajouter les cinq variables privées dans les réglages du projet.
4. Exécuter `schema.sql` dans Neon avant d'ouvrir le site aux commandes.
5. Lancer un Preview Deployment et effectuer les tests manuels ci-dessus.
6. Après validation, déployer en Production.

Le fichier `vercel.json` déclare le framework `tanstack-start`. La configuration Vite demande le preset Vercel à Nitro ; ce point doit être confirmé par un build effectif, qui n'a pas pu être exécuté dans cette session.
