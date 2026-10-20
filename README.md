# NDC COSPLAY

Boutique de cosplay sur mesure. Stack : TanStack Start, React, TypeScript, Tailwind CSS v4, Neon PostgreSQL, Vercel Blob et Vercel.

## Prérequis

- Node.js compatible avec la version indiquée par Vercel pour le projet.
- Un projet PostgreSQL chez Neon.
- Un store Vercel Blob avec accès en écriture.
- Un compte Vercel pour le déploiement.

## Configuration locale

1. Installer les dépendances : `npm install`.
2. Copier `.env.example` vers `.env` et renseigner les cinq variables ci-dessous.
3. Exécuter `schema.sql` dans l'éditeur SQL de Neon.
4. Lancer le site : `npm run dev`.

Ne commitez jamais le fichier `.env` ni les valeurs des secrets.

## Variables d'environnement

- `ADMIN_EMAIL` : adresse utilisée pour se connecter à l'administration.
- `ADMIN_PASSWORD` : mot de passe administrateur d'au moins 12 caractères.
- `SESSION_SECRET` : secret aléatoire d'au moins 32 caractères pour signer les sessions.
- `DATABASE_URL` : chaîne de connexion PostgreSQL Neon. Utilisez la chaîne adaptée au runtime/serverless fournie par Neon.
- `BLOB_READ_WRITE_TOKEN` : jeton du store Vercel Blob, utilisé uniquement côté serveur pour autoriser les téléversements et suppressions.

Les trois variables d'administration, `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN` doivent être définies dans les environnements Vercel Preview et Production selon les besoins. Après tout changement, redéployez le projet.

## Base de données

Le fichier `schema.sql` crée les tables `settings`, `products`, `home_images`, `orders` et `rate_limits`, la séquence des numéros de commande et la fonction SQL `create_order`. Le schéma est idempotent et ne charge aucune donnée de démonstration. La ligne initiale de paramètres est vide, à compléter depuis l'administration.

Les commandes sont créées par la fonction SQL afin de recalculer leur prix côté serveur. Les tentatives de commande, de connexion admin et de suivi sont limitées par des compteurs persistés dans Neon.

## Photos

Les images sont compressées dans le navigateur en WebP, avec un côté long maximal de 1600 px, puis envoyées directement à Vercel Blob. Les photos ne sont pas stockées dans le système de fichiers éphémère de Vercel. Seules leurs URL sont conservées dans Neon.

Formats d'origine acceptés : JPEG, PNG et WebP, jusqu'à 5 Mo avant compression.

## Déploiement Vercel

1. Poussez le dépôt sur GitHub et importez-le dans Vercel.
2. Configurez les cinq variables d'environnement.
3. Vérifiez que le projet Neon est accessible depuis le runtime Vercel.
4. Lancez le déploiement puis vérifiez les logs de build et de fonctions.
5. Testez la connexion admin, la création et le suivi d'une commande, l'ajout/suppression d'une photo et la persistance d'une photo après redéploiement.

## Commandes utiles

- `npm run dev` : développement local.
- `npm run build` : build de production.
- `npm run test` : tests automatisés.
- `npm run lint` : lint ESLint.
