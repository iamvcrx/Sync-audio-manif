# Soundworks Audio Manif

Application Soundworks avec deux rôles :

- `player` : chaque appareil possède un volume et un mute local indépendants ;
- `controller` : sélectionne un fichier, contrôle play/pause, mute tous les players et règle le volume master.

Le déclenchement n'envoie pas un ordre « joue maintenant ». Le controller écrit un temps futur dans l'horloge synchronisée par `@soundworks/plugin-sync`; chaque player convertit ce temps dans son horloge audio locale et programme un `AudioBufferSourceNode`.

## Installation et lancement

```sh
npm install
npm run dev
```

Le serveur indique ensuite une URL locale et une URL réseau. Ouvrez l'URL dans un navigateur, puis ajoutez `/player` ou `/controller` selon la configuration de routage affichée par Soundworks.

## Déploiement

GitHub Pages ne peut héberger que des fichiers statiques. Cette application utilise
également un serveur Node.js et des WebSockets pour synchroniser les players : le
serveur doit donc être déployé sur Render (ou un autre hébergeur Node).

1. Créez un **Web Service** Render connecté à ce dépôt. Le fichier `render.yaml`
   fournit les commandes de build et de démarrage (`npm ci && npm run build`,
   puis `npm start`).
2. Après le premier déploiement, notez l'URL Render, par exemple
   `https://sync-audio-manif.onrender.com`.
3. Remplacez `YOUR-RENDER-SERVICE` par cette URL dans
   `public-site/index.html`, puis poussez la modification.
4. Dans GitHub, ouvrez **Settings > Pages**, choisissez **GitHub Actions** comme
   source. Le workflow `.github/workflows/deploy-pages.yml` publiera la page
   d'accès.

Les liens `/controller` et `/player` doivent rester sur l'URL Render : ils
contiennent la configuration Soundworks générée par le serveur et utilisent sa
connexion WebSocket.

Le fichier WAV d'exemple est déjà présent à cet emplacement :

```text
public/assets/gospel-95BPM-Gm.wav
```

Le controller détecte automatiquement les fichiers `.wav`, `.mp3`, `.ogg`, `.m4a` et `.aac` placés dans `public/assets`.

Le plugin `platform-init` initialise l'AudioContext après le geste utilisateur requis par iOS et les navigateurs modernes. Le plugin `checkin` attribue un index unique à chaque player, tandis que le plugin `sync` synchronise l'horloge audio avec le serveur.

## Architecture

- `src/server.js` : serveur Soundworks, état global, plugins `sync` et `checkin`.
- `src/state-descriptions/global.js` : état partagé du transport audio et du master.
- `src/clients/player.js` : chargement du WAV, graphe audio et contrôles individuels.
- `src/clients/controller.js` : commandes globales.
