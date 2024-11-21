#!/bin/bash

# Paramètres
TYPE=$1 # Type d'incrément : major, minor, patch
IMAGE_NAME=$2

# Récupérer le dernier tag depuis Docker Hub
LAST_TAG=$(curl -s "https://hub.docker.com/v2/repositories/$IMAGE_NAME/tags/?page_size=1" | jq -r '.results[0].name')

if [[ -z "$LAST_TAG" ]]; then
  echo "Aucun tag trouvé. Utilisation de la version initiale : 0.0.1"
  LAST_TAG="0.0.1"
fi

echo "Dernier tag : $LAST_TAG"

# Extraire les parties de la version
IFS='.' read -r MAJOR MINOR PATCH <<< "$LAST_TAG"

# Incrémenter la version en fonction du type
case $TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MAJOR=1
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Type d'incrément invalide : $TYPE. Utilisez major, minor ou patch."
    exit 1
    ;;
esac

# Générer le nouveau tag
NEW_TAG="$MAJOR.$MINOR.$PATCH"
echo "Nouveau tag : $NEW_TAG"

# Sauvegarder le nouveau tag pour utilisation ultérieure
echo $NEW_TAG > NEW_TAG
