# Configuration de la synchronisation Google Drive

## 📋 Prérequis
- Un compte Google
- 10 minutes pour la configuration initiale

## 🔧 Étapes de configuration

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur **"Sélectionner un projet"** puis **"Nouveau projet"**
3. Nommez votre projet (ex: "Bloc-Notes-Sync")
4. Cliquez sur **"Créer"**

### 2. Activer l'API Google Drive

1. Dans le menu de gauche, allez dans **"API et services"** → **"Bibliothèque"**
2. Recherchez **"Google Drive API"**
3. Cliquez sur **"Google Drive API"**
4. Cliquez sur **"Activer"**

### 3. Créer les identifiants (Client ID)

1. Allez dans **"API et services"** → **"Identifiants"**
2. Cliquez sur **"Créer des identifiants"** → **"ID client OAuth 2.0"**
3. Si demandé, configurez l'écran de consentement :
   - Type : **Externe**
   - Nom de l'application : **Bloc-Notes**
   - E-mail : votre email
   - Cliquez sur **"Enregistrer et continuer"** (laissez le reste par défaut)
   - **Portées** : Cliquez sur "Enregistrer et continuer" sans ajouter de portées
   - **Utilisateurs tests** : Ajoutez votre email
   - Cliquez sur **"Enregistrer et continuer"**

4. Retournez dans **"Identifiants"**
5. Cliquez sur **"Créer des identifiants"** → **"ID client OAuth 2.0"**
6. Type d'application : **Application Web**
7. Nom : **Bloc-Notes Web Client**
8. **URI de redirection autorisés** :
   - Ajoutez : `http://localhost` (si vous testez en local)
   - Ajoutez : `http://127.0.0.1`
   - Si vous hébergez sur un serveur, ajoutez l'URL complète de votre site
9. Cliquez sur **"Créer"**
10. **IMPORTANT** : Copiez le **Client ID** qui s'affiche

### 4. Créer une clé API

1. Dans **"Identifiants"**, cliquez sur **"Créer des identifiants"** → **"Clé API"**
2. **IMPORTANT** : Copiez la **clé API** qui s'affiche
3. (Recommandé) Cliquez sur **"Restreindre la clé"**
   - Restrictions relatives aux API : sélectionnez **"Google Drive API"**
   - Cliquez sur **"Enregistrer"**

### 5. Configurer l'application

1. Ouvrez le fichier `google-drive-sync.js`
2. Remplacez les valeurs suivantes avec vos identifiants :

```javascript
const GOOGLE_CONFIG = {
    CLIENT_ID: 'VOTRE_CLIENT_ID.apps.googleusercontent.com',  // Remplacer ici
    API_KEY: 'VOTRE_API_KEY',  // Remplacer ici
    // ...
};
```

### 6. Tester la synchronisation

1. Ouvrez votre application
2. Cliquez sur le bouton **"🔑 Se connecter"** dans le menu
3. Autorisez l'application à accéder à votre Google Drive
4. Une fois connecté, le bouton **"☁️ Synchroniser"** devient actif
5. Cliquez dessus pour sauvegarder vos notes sur Google Drive

## 📱 Utilisation

### Se connecter
- Cliquez sur **"🔑 Se connecter"**
- Autorisez l'application (une seule fois)

### Synchroniser
- Cliquez sur **"☁️ Synchroniser"** pour sauvegarder vos notes
- Vos notes sont sauvegardées dans un fichier `bloc-notes-backup.json` sur votre Drive

### Restaurer
- Cliquez sur **"📥 Restaurer"** pour récupérer vos notes depuis Google Drive
- ⚠️ Attention : cela remplacera vos notes locales actuelles

### Synchronisation automatique
- Une fois connecté, vos notes sont automatiquement synchronisées toutes les 5 minutes
- Un message s'affiche à chaque synchronisation

## 🔒 Sécurité

- Vos notes sont stockées dans **votre** Google Drive personnel
- Seule cette application peut accéder au fichier créé
- Vous pouvez révoquer l'accès à tout moment dans les [paramètres de votre compte Google](https://myaccount.google.com/permissions)

## ❓ Résolution de problèmes

### "Erreur d'initialisation"
- Vérifiez que vous avez bien copié le CLIENT_ID et l'API_KEY
- Vérifiez que l'API Google Drive est activée

### "Demande non autorisée"
- Ajoutez votre email dans les "Utilisateurs tests" de l'écran de consentement
- Vérifiez les URI de redirection

### Le bouton de connexion ne fonctionne pas
- Vérifiez la console du navigateur (F12) pour voir les erreurs
- Assurez-vous d'utiliser HTTP ou HTTPS (pas file://)

## 📝 Notes importantes

1. **Protection des données** : Google Drive offre une excellente protection contre la perte de données
2. **Quota** : Chaque fichier JSON pèse quelques Ko, largement dans les limites gratuites de Google Drive (15 Go)
3. **Hors ligne** : L'application fonctionne toujours hors ligne, la synchronisation se fait quand vous êtes connecté
4. **Export manuel** : Continuez à faire des exports manuels réguliers pour plus de sécurité

## 🎉 C'est prêt !

Une fois configuré, vous n'avez plus à vous soucier de perdre vos notes en effaçant l'historique du navigateur. Elles sont automatiquement sauvegardées sur Google Drive !
