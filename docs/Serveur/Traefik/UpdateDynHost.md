
---

# 📜 Documentation : Mise à jour automatique DynHost OVH pour `traefik.srvdreamer.fr`

## 🔧 Objectif

Configurer un système automatisé qui met à jour l'adresse IP publique de votre serveur (avec IP dynamique chez Bell, par exemple) vers un sous-domaine OVH via DynHost. Cela permet d'accéder à ce serveur à l'aide d'un nom de domaine comme `traefik.srvdreamer.fr` même si l'IP change régulièrement.

---

## 🛠️ Prérequis

* Un nom de domaine acheté chez OVH (ici : `srvdreamer.fr`)
* Un sous-domaine DynHost créé dans l'interface OVH : `traefik.srvdreamer.fr`
* Un identifiant DynHost (ex: `dyntraefik`) avec un mot de passe **sans caractères spéciaux**
* Accès root ou sudo sur la machine cible
* Le paquet `curl` installé sur le système

---

## 🛠️ Composants mis en place

### 1. ✅ Configuration DynHost sur OVH

Depuis l'espace client OVH :

* Créer un sous-domaine : `traefik.srvdreamer.fr`
* Ajouter une entrée DNS de type A vers votre IP actuelle (sera mise à jour dynamiquement)
* Créer un identifiant DynHost avec :

  * Identifiant : `dyntraefik`
  * Mot de passe : `AZaz123456` (exemple simple, sans `#`, `&`, `$`, etc.)
  * Sous-domaine associé : `traefik.srvdreamer.fr`

### 2. ✅ Script de mise à jour : `/opt/update-dynhost.sh`

```bash
#!/bin/bash

LOGIN='dyntraefik'
PASSWORD='AZaz123456'
HOSTNAME='traefik.srvdreamer.fr'
CACHE='/tmp/ovh_last_ip.txt'

IP=$(curl -s https://ipinfo.io/ip)

if [[ ! -f "$CACHE" ]] || [[ "$IP" != "$(cat "$CACHE")" ]]; then
    echo "🛁 Nouvelle IP : $IP"
    RESPONSE=$(curl -s -u "$LOGIN:$PASSWORD" \
      "https://www.ovh.com/nic/update?system=dyndns&hostname=$HOSTNAME&myip=$IP")
    echo "🔁 Réponse OVH : $RESPONSE"

    if [[ $RESPONSE =~ ^(good|nochg) ]]; then
        echo "$IP" > "$CACHE"
    else
        echo "❌ Erreur OVH : $RESPONSE"
        exit 1
    fi
else
    echo "✅ IP inchangée ($IP)"
fi
```

**Explication :**

* Utilise l'API DynHost OVH via `curl`
* Authentifie avec identifiant DynHost + mot de passe
* Envoie l'IP actuelle si elle a changé
* Stocke la dernière IP dans un fichier cache `/tmp/ovh_last_ip.txt`

**Commande pour rendre le script exécutable :**

```bash
chmod +x /opt/update-dynhost.sh
```

---

### 3. ✅ Service systemd : `/etc/systemd/system/update-dynhost.service`

```ini
[Unit]
Description=Update OVH DynHost for traefik.srvdreamer.fr
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/update-dynhost.sh
```

---

### 4. ✅ Timer systemd : `/etc/systemd/system/update-dynhost.timer`

```ini
[Unit]
Description=Run DynHost update every 10 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=10min
Persistent=true

[Install]
WantedBy=timers.target
```

---

### 5. ✅ Activation du service et timer

```bash
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable --now update-dynhost.timer
```

---

## 🔎 Tests et surveillance

**Exécuter manuellement le script pour tester :**

```bash
/opt/update-dynhost.sh
```

**Exemple de sortie attendue :**

```
🛁 Nouvelle IP : 69.157.227.220
🔁 Réponse OVH : good 69.157.227.220
```

**Lister les timers actifs :**

```bash
systemctl list-timers | grep update-dynhost
```

**Consulter les logs systemd :**

```bash
journalctl -u update-dynhost.service -n 20 --no-pager
```

---

## 📅 Bonnes pratiques & sécurité

* **Ne pas utiliser de mot de passe avec des caractères spéciaux** (ça casse `curl -u` dans les scripts sans quotes)
* **Ne jamais encoder le mot de passe avec %** (le header HTTP s'en charge)
* **Ne pas supprimer le paramètre `system=dyndns`** : obligatoire pour l'API OVH
* Stocker le mot de passe dans un fichier `.env` et le sourcer est recommandé pour aller plus loin en sécurité

---

## 🚀 En option : à améliorer

* Ajouter une notification (mail, Slack, etc.) en cas d'échec
* Intégrer à un reverse proxy (Traefik/Nginx) en automatisant via DNS
* Créer un fichier log dédié (ex : `/var/log/update-dynhost.log`)
* Utiliser une clé API (si OVH le propose à l'avenir)

