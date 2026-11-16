import type en from './en';

export default {
    common: {
        saveChanges: 'Enregistrer',
        cancel: 'Annuler',
        close: 'Fermer',
        loading: 'Chargement..',
        saving: 'Enregistrement..',
        edit: 'Modifier',
        delete: 'Supprimer',
        username: "Nom d'utilisateur",
        password: 'Mot de passe',
        language: 'Langue',
        backHome: "Retour à l'accueil",
        login: 'Connexion',
        or: 'Ou',
        showPassword: '[VOIR]',
        hidePassword: '[MASQUER]',
        seconds: "{{value}}'s"
    },
    apps: {
        todos: 'Tâches',
        account: 'Compte',
        settings: 'Paramètres',
        admin: 'Admin'
    },
    connection: {
        unavailable: 'Serveur indisponible',
        fatal: 'Connexion interrompue (code {{code}}). Vérifiez la configuration ou rechargez l’application.',
        reload: 'Recharger',
        description:
            'La connexion en temps réel au serveur est interrompue. Votre session sera vérifiée automatiquement dès son retour.',
        connecting: 'Connexion au serveur et vérification de la session…',
        retryIn_one: 'Nouvelle tentative dans {{count}} seconde…',
        retryIn_other: 'Nouvelle tentative dans {{count}} secondes…'
    },
    auth: {
        loginProtocol: 'Protocole de connexion',
        registerProtocol: 'Protocole d’inscription',
        online: 'Système en ligne',
        usernamePlaceholder: 'nom d’utilisateur',
        initializeSession: 'Ouvrir la session',
        createIdentity: 'Créer une identité',
        noIdentity: 'Pas encore de compte ?',
        alreadyRegistered: 'Déjà inscrit ?',
        registerLink: '[INSCRIPTION]',
        loginLink: '[CONNEXION]',
        systemVersion: '// Système v.26'
    },
    settings: {
        categories: 'Catégories des paramètres',
        accountCategory: 'Compte',
        accountDescription: 'Identifiant et nom affiché',
        appearanceDescription: 'Thème et animations',
        languageDescription: 'Langue de l’application',
        devicesDescription: 'Sessions actives et déconnexion à distance',
        title: 'Paramètres',
        appearance: 'Apparence',
        themes_one: '{{count}} thème',
        themes_other: '{{count}} thèmes',
        animations: 'Animations',
        miniApps: 'Mini-Apps',
        transitionDuration: 'Durée des transitions',
        speed: {
            fast: 'Rapide',
            normal: 'Normal',
            slow: 'Lente'
        },
        transitionsHelp: 'Choisissez la vitesse des animations d’ouverture et de fermeture des mini-applications',
        unsaved: 'Modifications non enregistrées',
        synced: 'Préférences synchronisées avec votre compte',
        save: 'Enregistrer les préférences',
        restoreDefaults: 'Rétablir les valeurs par défaut',
        saved: 'Préférences enregistrées.',
        languageHelp: 'La langue est appliquée à l’enregistrement des préférences.',
        themePreview:
            'Cliquez sur un thème pour le prévisualiser immédiatement. Enregistrez pour le conserver ; sinon, quitter cette catégorie rétablit le thème enregistré.',
        theme: {
            green: 'Vert',
            blue: 'Bleu',
            purple: 'Violet',
            amber: 'Ambre',
            white: 'Blanc',
            black: 'Noir'
        }
    },
    home: {
        applications: 'Applications',
        dateTime: 'Date et heure',
        dragHelp:
            'Maintenez une application appuyée, déplacez-la puis relâchez pour enregistrer sa position. Au clavier : Alt + flèches pour déplacer, Échap pour annuler le glissement.',
        moveApp: 'Déplacement de {{name}}. Relâchez pour enregistrer, Échap pour annuler.',
        orderSaved: 'Ordre des applications enregistré.'
    },
    homeSettings: {
        title: 'Écran d’accueil',
        categoryDescription: "Fond d'écran, widgets et ordre des applications",
        wallpaper: 'Fond d’écran',
        uploadImage: 'Importer une image',
        uploadHelp:
            'JPEG, PNG, WebP ou GIF, 10 Mo maximum. Stockage en JPEG haute qualité (GIF non animé). Sélectionnez une photo puis enregistrez : elle sera importée avec vos préférences. Les images sont accessibles à toute personne disposant du lien.',
        blur: 'Flou du fond',
        widgets: 'Widgets',
        showClock: 'Afficher la date et l’heure',
        showWeather: 'Afficher la météo',
        orderHelp:
            'Sur l’accueil, maintenez une application appuyée pour la soulever. Déplacez-la devant ou derrière une autre puis relâchez : l’ordre est enregistré automatiquement.',
        wallpapers: {
            none: 'Rien',
            image: 'Image'
        },
        dynamicTheme: 'Adapter les couleurs de l’interface à l’image',
        dynamicHelp:
            'Les couleurs de votre photo sont extraites dans votre navigateur, dès l’aperçu. En cas d’échec, la couleur manuelle est conservée.',
        dynamicStatus: {
            idle: 'Choisissez une image pour activer les couleurs dynamiques.',
            loading: 'Analyse des couleurs de l’image..',
            ready: 'Couleurs de l’image appliquées. Enregistrez pour conserver ce choix.',
            unavailable: 'Impossible d’extraire les couleurs de cette image. Votre couleur manuelle est conservée.'
        }
    },
    weather: {
        title: 'Météo',
        configure: 'Choisir une ville dans les paramètres',
        city: 'Ville pour la météo',
        cityPlaceholder: 'Paris, France..',
        search: 'Rechercher une ville',
        selectedCity: 'Ville sélectionnée : {{name}}',
        cityResults: 'Villes trouvées',
        noResults: 'Aucune ville trouvée',
        searchFailed: 'Recherche indisponible, réessayez dans un instant :)',
        unavailable: 'La météo ne peut pas être actualisée pour le moment.',
        retry: 'Réessayer',
        conditions: {
            clear: 'Ciel dégagé',
            partlyCloudy: 'Quelques nuages',
            cloudy: 'Couvert',
            fog: 'Brouillard',
            drizzle: 'Bruine',
            rain: 'Pluie',
            snow: 'Neige',
            storm: 'Orage',
            unknown: 'Conditions inconnues'
        }
    },
    devices: {
        online: 'En ligne',
        offline: 'Hors ligne',
        title: 'Appareils',
        description:
            'Vos sessions et leur présence sont actualisées en temps réel. Chaque entrée représente une connexion, pas forcément un appareil physique différent. Le nom de l’appareil est déduit des informations du client.',
        current: 'Cette session',
        unknown: 'Appareil inconnu',
        details: 'Informations du client',
        ipAddress: 'IP de connexion : {{ip}}',
        ipUnknown: 'indisponible (reconnectez cet appareil)',
        localConnection: 'Connexion locale : aucune localisation géographique disponible.',
        revoke: 'Révoquer',
        revokeAll: 'Révoquer toutes les sessions',
        refresh: 'Actualiser',
        confirmOne: 'Révoquer la session de {{device}} ? Cette connexion ne pourra plus accéder à votre compte.',
        confirmAll: 'Révoquer toutes les sessions, y compris celle-ci ? Vous serez déconnecté de tous vos appareils.',
        confirmRevoke: 'Confirmer la révocation',
        revoked: 'Session révoquée.',
        empty: 'Aucune session active.'
    },
    todo: {
        title: 'Liste des tâches',
        titleLabel: 'Titre de la tâche',
        titlePlaceholder: 'Saisir une tâche…',
        createTask: 'Créer une tâche',
        tasks: 'Tâches',
        entries_one: '{{count}} entrée',
        entries_other: '{{count}} entrées',
        noTasks: 'Aucune tâche',
        firstObjective: 'Créez votre premier objectif'
    },
    account: {
        displayName: 'Nom affiché',
        displayNameHelp: 'Facultatif. Laissez vide pour retirer votre nom affiché.',
        saved: 'Informations du compte enregistrées.',
        information: 'Informations du compte',
        changePassword: 'Changer le mot de passe',
        newPassword: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le nouveau mot de passe',
        keepPassword: 'Laisser vide pour conserver le mot de passe actuel',
        dangerZone: 'Zone de danger',
        logout: 'Déconnexion',
        confirmLogoutQuestion: 'Voulez-vous vraiment vous déconnecter ?',
        confirmLogout: 'Confirmer la déconnexion',
        deleteAccount: 'Supprimer le compte',
        confirmDeletionQuestion:
            'Supprimer définitivement votre compte et toutes ses tâches ? Cette action est irréversible.',
        confirmDeletion: 'Confirmer la suppression'
    },
    admin: {
        title: 'Administration des utilisateurs',
        adminOnly: 'Accès administrateur',
        users: 'Utilisateurs',
        statusLabel: 'État du compte',
        status: {
            all: 'Tous les comptes',
            active: 'Actif',
            disabled: 'Désactivé'
        },
        disableAccount: 'Désactiver le compte',
        disableHelp: 'Un compte désactivé ne peut plus se connecter. Toutes ses sessions sont révoquées.',
        selfDisableWarning: 'Désactiver votre propre compte bloquera immédiatement votre accès.',
        searchLabel: 'Rechercher un utilisateur',
        searchPlaceholder: 'Nom d’utilisateur, nom affiché ou ID exact…',
        search: 'Rechercher',
        refresh: 'Actualiser',
        noUsers: 'Aucun utilisateur trouvé',
        results_one: '{{count}} utilisateur',
        results_other: '{{count}} utilisateurs',
        editUser: 'Modifier {{username}}',
        displayName: 'Nom affiché',
        flagsTitle: 'Permissions / flags',
        flags: {
            ADMIN: 'Administrateur'
        },
        flagValue: 'Flags : {{value}}',
        member: 'Utilisateur',
        selfDemoteWarning: 'Retirer votre flag administrateur vous fera immédiatement perdre l’accès à cette page.',
        confirmDelete: 'Supprimer {{username}} ?',
        deleteWarning:
            'Le compte, ses tâches et ses sessions seront immédiatement et définitivement supprimés. Cette action est irréversible. Supprimer votre propre compte vous déconnectera.',
        updated: 'Utilisateur modifié.',
        deleted: 'Utilisateur définitivement supprimé.',
        pagination: 'Pagination des utilisateurs',
        previous: 'Précédent',
        next: 'Suivant',
        page: 'Page {{page}} sur {{total}}'
    },
    dialogs: {
        disabledTitle: 'Compte désactivé',
        disabledMessage: 'Votre compte a été désactivé. Contactez un administrateur pour retrouver l’accès.',
        notFoundTitle: '404 — Page introuvable',
        notFoundMessage: 'Cette page n’existe pas ou a été déplacée.',
        sessionExpiredTitle: 'Session expirée',
        sessionExpiredMessage: 'Votre session a expiré. Veuillez vous reconnecter.',
        reconnect: 'Se reconnecter'
    },
    errors: {
        INVALID_PREFERENCES: 'Préférences invalides.',
        INVALID_WALLPAPER: 'Image invalide ou trop complexe. Formats acceptés : JPEG, PNG, WebP et GIF.',
        WALLPAPER_TOO_LARGE: 'L’image dépasse la limite de 10 Mo.',
        USER_DISABLED: 'Ce compte est désactivé.',
        SESSION_NOT_FOUND: 'Cette session n’existe plus. Actualisez la liste.',
        INVALID_QUERY: 'Paramètres de recherche ou de pagination invalides.',
        INVALID_FLAGS: 'Flags de permission inconnus ou invalides.',
        SERVER_ERROR: 'Une erreur est survenue. Veuillez réessayer.',
        NETWORK_ERROR: 'Impossible de joindre le serveur.',
        ERR_NETWORK: 'Impossible de joindre le serveur.',
        INVALID_CREDENTIALS: 'Nom d’utilisateur ou mot de passe incorrect.',
        USERNAME_ALREADY_EXISTS: 'Ce nom d’utilisateur est déjà pris.',
        INVALID_USERNAME: 'Nom d’utilisateur invalide.',
        SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
        INVALID_TOKEN: 'Veuillez vous reconnecter.',
        TOKEN_MISSING: 'Veuillez vous connecter.',
        UNAUTHORIZED: 'Veuillez vous connecter.',
        FORBIDDEN: 'Vous ne pouvez pas effectuer cette action.',
        USER_NOT_FOUND: 'Utilisateur introuvable.',
        TODO_NOT_FOUND: 'Tâche introuvable.',
        NOT_FOUND: 'Ressource introuvable.',
        TOO_SMALL: 'Cette valeur est trop courte ou trop petite.',
        TOO_BIG: 'Cette valeur est trop longue ou trop grande.',
        INVALID_VALUE: 'Valeur invalide.',
        INVALID_FORMAT: 'Format invalide.',
        ONE_FIELD_REQUIRED: 'Modifiez au moins un champ.',
        CUSTOM: 'Vérifiez les valeurs saisies.',
        TOO_MANY_REQUESTS: 'Trop de requêtes. Veuillez réessayer plus tard.',
        ORIGIN_REQUIRED: 'Cette requête doit provenir d’une application autorisée.',
        ORIGIN_NOT_ALLOWED: 'Cette application n’est pas autorisée.',
        INVALID_AUTH_MODE: 'Mode d’authentification invalide.',
        NATIVE_CLIENT_REQUIRED: 'Ce mode d’authentification est réservé aux applications natives.'
    }
} satisfies typeof en;
