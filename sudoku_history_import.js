// =====================================================
// IMPORT D'HISTORIQUE DEPUIS DES SAUVEGARDES JSON
// =====================================================

function construireEntreeHistoriqueDepuisSauvegarde(data, nomFichier = "", dateFichier = null) {
    if (!data || typeof data !== "object") return null;

    const nom = (typeof data.nom === "string" && data.nom.trim() !== "")
        ? data.nom.trim()
        : nomFichier.replace(/\.json$/i, "").trim();

    const infoNiveau = extraireInfosNiveauDepuisNom(nom);

    const temps = (typeof data.tempsEcoule === "number") ? data.tempsEcoule : null;

    const stats = (data.statsJeu && typeof data.statsJeu === "object") ? data.statsJeu : null;

    const nbGuess = (stats && typeof stats.nb_guess === "number")
        ? stats.nb_guess
        : null;

    const premierGuess = (stats && typeof stats.premier_guess === "number")
        ? stats.premier_guess
        : null;

    const chiffresPlaces = (stats && typeof stats.chiffres_places === "number")
        ? stats.chiffres_places
        : 0;

    const undo = (stats && typeof stats.undo === "number")
        ? stats.undo
        : 0;

    const effacements = (stats && typeof stats.effacements === "number")
        ? stats.effacements
        : 0;

    // On exige au minimum un nom et un temps exploitable
    if (!nom || temps === null) {
        return null;
    }

    return {
        id: "import_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        date: dateFichier ?? new Date().toISOString(),
        nom: nom,
        typeNiveau: infoNiveau.typeNiveau,
        niveau: infoNiveau.niveau,
        temps: temps,
        nbGuess: nbGuess,
        premierGuess: premierGuess,
        chiffresPlaces: chiffresPlaces,
        undo: undo,
        effacements: effacements
    };
}

function existeDejaDansHistorique(entree) {
    return historiqueParties.some(p =>
        p.nom === entree.nom &&
        p.temps === entree.temps &&
        p.niveau === entree.niveau &&
        p.typeNiveau === entree.typeNiveau
    );
}

function importerHistoriqueDepuisFichiers(event) {
    const fichiers = Array.from(event.target.files || []);
    if (fichiers.length === 0) return;

    let restants = fichiers.length;
    let ajoutes = 0;
    let ignores = 0;
    let doublons = 0;
    let erreurs = 0;

    fichiers.forEach(file => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                const dateFichier = file.lastModified
                    ? new Date(file.lastModified).toISOString()
                    : new Date().toISOString();

                const entree = construireEntreeHistoriqueDepuisSauvegarde(
                    data,
                    file.name,
                    dateFichier
                );

                if (!entree) {
                    ignores += 1;
                } else if (existeDejaDansHistorique(entree)) {
                    doublons += 1;
                } else {
                    historiqueParties.push(entree);
                    ajoutes += 1;
                }
            } catch (err) {
                console.error("Erreur import fichier :", file.name, err);
                erreurs += 1;
            } finally {
                restants -= 1;

                if (restants === 0) {
                    sauverHistoriqueParties();

                    alert(
                        "Import historique terminé\n\n" +
                        "Ajoutées : " + ajoutes + "\n" +
                        "Doublons ignorés : " + doublons + "\n" +
                        "Fichiers ignorés : " + ignores + "\n" +
                        "Erreurs : " + erreurs + "\n" +
                        "Total historique : " + historiqueParties.length
                    );

                    event.target.value = "";
                }
            }
        };

        reader.readAsText(file);
    });
}

function ouvrirImportHistorique() {
    const input = document.getElementById("importHistorique");
    if (input) {
        input.click();
    }
}