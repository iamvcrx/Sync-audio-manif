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
