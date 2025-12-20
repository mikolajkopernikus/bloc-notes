# Application Notes Mobile

## 📝 Description

Application de prise de notes progressive web app (PWA) pour mobile et desktop avec les fonctionnalités suivantes :

- **Éditeur de texte riche** : mise en forme du texte (gras, italique, souligné)
- **Titres et listes** : support des titres H1/H2 et listes à puces/numérotées
- **Organisation** : table des matières pour naviguer rapidement entre vos notes
- **Sauvegarde automatique** : vos notes sont sauvegardées automatiquement après chaque modification
- **Titres auto-générés** : format "YYYY-MM-DD note N" avec numérotation automatique
- **Horodatage** : affichage de la dernière modification de chaque note
- **Export/Import** : sauvegardez et restaurez vos notes en format JSON
- **Hors ligne** : fonctionne sans connexion internet une fois installée
- **Design moderne** : interface en bleu marine, responsive et optimisée mobile

## 🖥️ Tester en local sur PC

### Prérequis
- Python 3.x installé sur votre ordinateur

### Étapes

1. **Ouvrez un terminal** dans le dossier de l'application

2. **Démarrez un serveur HTTP local :**
   ```bash
   python -m http.server 8002
   ```

3. **Ouvrez votre navigateur** et accédez à :
   ```
   http://localhost:8002
   ```

4. **Pour arrêter le serveur**, appuyez sur `Ctrl+C` dans le terminal

## 📱 Installer sur mobile Android

### Méthode 1 : Via Netlify (recommandé)

1. **Déployez l'application :**
   - Allez sur [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Faites glisser le dossier complet de l'application dans la zone de dépôt
   - Attendez la fin du déploiement (quelques secondes)
   - Récupérez l'URL générée (format : `https://random-name-123456.netlify.app`)

2. **Installez sur votre téléphone :**
   - Ouvrez l'URL dans Chrome sur Android
   - Appuyez sur le menu (⋮) en haut à droite
   - Sélectionnez **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**
   - L'application s'installe comme une application native

### Méthode 2 : Test local via WiFi

1. **Sur votre PC**, démarrez le serveur comme indiqué ci-dessus

2. **Trouvez l'adresse IP de votre PC** :
   ```bash
   ipconfig
   ```
   (Notez l'adresse IPv4, ex: 192.168.1.10)

3. **Sur votre mobile** (connecté au même WiFi) :
   - Ouvrez Chrome
   - Allez sur `http://[IP-DE-VOTRE-PC]:8002`
   - Exemple : `http://192.168.1.10:8002`

## 💾 Sauvegarde de vos données

### Stockage local
- Vos notes sont stockées dans le **localStorage** de votre navigateur
- Elles persistent même après fermeture de l'application
- **⚠️ Important** : Vider les données du site ou désinstaller l'app peut supprimer vos notes

### Sauvegarde manuelle
1. **Export** : Cochez les notes à sauvegarder et cliquez sur "📥 Exporter la sélection"
2. **Import** : Cliquez sur "📤 Importer des notes" pour restaurer depuis un fichier JSON

### Bonnes pratiques
- Exportez régulièrement vos notes importantes
- Conservez les fichiers JSON exportés dans un endroit sûr (cloud, email, etc.)
- L'export permet aussi de transférer vos notes entre appareils

## 🎨 Utilisation

### Créer une note
- Cliquez sur le menu (☰) pour ouvrir la sidebar
- Cliquez sur **"+ Nouvelle note"**

### Éditer une note
- Tapez directement dans l'éditeur
- Utilisez la barre d'outils pour mettre en forme le texte
- Le titre peut être modifié en cliquant dessus
- La sauvegarde est automatique

### Naviguer entre les notes
- Ouvrez le menu (☰)
- Cliquez sur une note dans la table des matières

### Supprimer une note
- Ouvrez la note à supprimer
- Cliquez sur le bouton corbeille (🗑️) dans l'en-tête

### Exporter/Importer
- **Export** : Cochez les notes désirées → "📥 Exporter la sélection"
- **Import** : "📤 Importer des notes" → Sélectionnez un fichier JSON

## 🛠️ Technologies utilisées

- HTML5, CSS3, JavaScript (Vanilla)
- Progressive Web App (PWA)
- Service Worker pour le mode hors ligne
- localStorage pour la persistance des données
- API contenteditable pour l'édition de texte riche

## 📄 Structure des fichiers

```
notes/
├── index.html          # Structure de l'application
├── style.css           # Styles et design
├── app.js              # Logique de l'application
├── manifest.json       # Configuration PWA
├── sw.js               # Service Worker
├── icon-192.png        # Icône 192x192
├── icon-512.png        # Icône 512x512
└── README.md           # Ce fichier
```

## 🔒 Sécurité et vie privée

- Toutes les données restent **locales** sur votre appareil
- Aucune donnée n'est envoyée vers un serveur
- Aucun tracking ou analytics
- Fonctionnement 100% hors ligne après installation
