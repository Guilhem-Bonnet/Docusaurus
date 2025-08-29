---

# 📚 Docusaurus – Documentation centralisée

Un dépôt qui centralise plusieurs documentations techniques et projets, organisé avec [Docusaurus 2](https://docusaurus.io/).
Ce dépôt fournit une arborescence hiérarchique de docs, des environnements prêts à l’emploi via **Docker Compose**, et plusieurs **plugins personnalisés**.

---

## 🗂️ Hiérarchie du projet

```bash
Docusaurus/
├── docs/                # Documentation organisée par projets
│   ├── project-1/       # Exemple : projet technique A
│   │   ├── intro.md
│   │   └── ...
│   ├── project-2/       # Exemple : projet technique B
│   └── ...
├── src/                 # Code source spécifique à Docusaurus (custom components, pages)
├── static/              # Fichiers statiques (images, logos…)
├── docusaurus.config.js # Configuration principale
├── sidebars.js          # Définition de la navigation et hiérarchie
├── package.json         # Dépendances Node.js
├── docker-compose.yml   # Stack Docker (dev/prod)
└── ...
```

* Chaque documentation **doit être contenue dans un sous-dossier de `docs/`**.
* La hiérarchie est reflétée automatiquement dans la sidebar (configurée dans `sidebars.js`).
* Les ressources statiques (images, fichiers téléchargeables) doivent aller dans `static/`.

---

## 🚀 Lancer le projet

### 🔹 Mode développement (Docker)

Le mode dev permet le hot-reload des docs et composants.

```bash
docker compose --profile dev up
```

👉 L’interface est alors disponible sur :
[`http://localhost:3000`](http://localhost:3000)

Pour arrêter :

```bash
docker compose --profile dev down
```

### 🔹 Mode développement (local Node.js)

Si tu veux travailler sans Docker :

```bash
# Installer les dépendances
npm install
# ou
yarn install

# Lancer en mode dev
npm run start
# ou
yarn start
```

---

### 🔹 Mode production (Docker)

Pour générer et servir le site statique optimisé :

```bash
docker compose --profile prod up --build
```

👉 Accessible sur :
[`http://localhost:8080`](http://localhost:8080)

---

## ⚙️ Spécificités et plugins custom

Le projet utilise plusieurs plugins et thèmes pour enrichir Docusaurus.

### 📦 Plugins installés

* [@docusaurus/plugin-content-docs](https://github.com/facebook/docusaurus/tree/main/packages/docusaurus-plugin-content-docs) → gestion des docs.
* [@docusaurus/plugin-content-blog](https://github.com/facebook/docusaurus/tree/main/packages/docusaurus-plugin-content-blog) → si tu ajoutes un blog.
* [@docusaurus/plugin-sitemap](https://github.com/facebook/docusaurus/tree/main/packages/docusaurus-plugin-sitemap) → génération d’un sitemap.
* [docusaurus-plugin-panzoom](https://github.com/r74tech/docusaurus-plugin-panzoom) → zoom et pan sur les schémas/diagrammes (⚠️ voir notes ci-dessous).
* [Mermaid plugin](https://docusaurus.io/docs/markdown-features/diagrams#using-mermaid) → support des diagrammes Mermaid.

### 🔧 Personnalisation

* **Docker Compose avec profils** : permet de lancer facilement le site en dev (`3000`) ou en prod (`8080`).
* **Hot-reload activé** : en dev, toute modification dans `docs/` recharge automatiquement la page.
* **Panzoom** : utilisé pour zoomer sur les diagrammes (notamment Mermaid).
* **Mermaid** : permet de documenter avec des diagrammes séquence/flowchart directement en Markdown.

---

## ➕ Ajouter une documentation

1. Créer un nouveau dossier dans `docs/` :

   ```bash
   mkdir docs/mon-projet
   echo "# Introduction" > docs/mon-projet/intro.md
   ```
2. Déclarer le dossier dans `sidebars.js` si besoin d’un ordre spécifique.
3. Relancer le projet en dev (`docker compose --profile dev up`).

---

## 🤝 Contribution

* Respecter la hiérarchie `docs/<projet>/`.
* Toujours tester en local (`yarn start` ou Docker dev) avant commit.
* Ajouter les nouveaux plugins via :

  ```bash
  npm install <plugin>
  # ou
  yarn add <plugin>
  ```
* Mettre à jour `docusaurus.config.js` pour l’activer.

---

## 🔗 Liens utiles

* 📖 [Documentation officielle Docusaurus](https://docusaurus.io/)
* 🔌 [Liste des plugins Docusaurus](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs)
* 🔍 [Panzoom plugin](https://github.com/r74tech/docusaurus-plugin-panzoom)
* 🖊️ [Mermaid pour Docusaurus](https://docusaurus.io/docs/markdown-features/diagrams)

---

## 📜 Licence

Projet sous licence MIT.
Développé et maintenu par [Guilhèm Bonnet](https://github.com/Guilhem-Bonnet).

---
