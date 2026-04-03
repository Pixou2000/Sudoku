// =====================================================
// HISTORIQUE DES PARTIES
// =====================================================

const CLE_HISTORIQUE_PARTIES = "sudoku_historique_parties_v1";

let historiqueParties = [];
let niveauPartie = null;
let typeNiveauPartie = null;
let partieHistoriqueEnregistree = false;

// -----------------------------------------------------
// Chargement / sauvegarde historique
// -----------------------------------------------------
function chargerHistoriqueParties() {
    try {
        const brut = localStorage.getItem(CLE_HISTORIQUE_PARTIES);
        historiqueParties = brut ? JSON.parse(brut) : [];

        if (!Array.isArray(historiqueParties)) {
            historiqueParties = [];
        }
    } catch (err) {
        console.error("Erreur chargement historique :", err);
        historiqueParties = [];
    }
}

function sauverHistoriqueParties() {
    try {
        localStorage.setItem(
            CLE_HISTORIQUE_PARTIES,
            JSON.stringify(historiqueParties)
        );
    } catch (err) {
        console.error("Erreur sauvegarde historique :", err);
    }
}

function afficherHistoriqueParties() {
    if (!historiqueParties || historiqueParties.length === 0) {
        alert("Historique vide");
        return;
    }

    let texte = "Historique des parties\n\n";

    historiqueParties.forEach((p, i) => {
        texte +=
            (i + 1) + ". " +
            (p.niveau || "?") + " - " +
            formaterTemps(p.temps);

        if (p.nbGuess !== null && p.nbGuess !== undefined) {
            texte += " - " + p.nbGuess + " guess";
        }

        if (p.nom) {
            texte += "\n   " + p.nom;
        }

        texte += "\n\n";
    });

    alert(texte);
}

function reconstruireGrilleDepartDepuisGrilleFixe(grille, grilleFixe) {
    if (!Array.isArray(grille) || !Array.isArray(grilleFixe)) {
        return null;
    }

    const grilleDepart = Array.from({ length: 9 }, () => Array(9).fill(0));

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (grilleFixe[l] && grilleFixe[l][c] === true) {
                grilleDepart[l][c] = grille[l]?.[c] ?? 0;
            }
        }
    }

    return grilleDepart;
}

function analyserGrilleDepartPourHistorique(grille, grilleFixe) {
    const grilleDepart = reconstruireGrilleDepartDepuisGrilleFixe(grille, grilleFixe);

    if (!grilleDepart) {
        return {
            niveauSolveur: null,
            guessSolveur: null,
            logicLoopsSolveur: null,
            branchesSolveur: null,
            sourceAnalyseSolveur: null
        };
    }

    const resultat = resoudreSudokuJS(grilleDepart);

    return {
        niveauSolveur: resultat?.stats?.niveau ?? null,
        guessSolveur: resultat?.stats?.guess ?? null,
        logicLoopsSolveur: resultat?.stats?.logic_loops ?? null,
        branchesSolveur: resultat?.stats?.branches_tested ?? null,
        sourceAnalyseSolveur: "grilleFixe"
    };
}

// -----------------------------------------------------
// Niveau de la partie en cours
// -----------------------------------------------------
function reinitialiserInfosHistoriquePartie() {
    niveauPartie = null;
    typeNiveauPartie = null;
    partieHistoriqueEnregistree = false;
}

function definirNiveauPartie(typeNiveau, niveau) {
    typeNiveauPartie = typeNiveau ?? null;
    niveauPartie = niveau ?? null;
    partieHistoriqueEnregistree = false;
}

function effacerHistoriqueParties() {
    if (!confirm("Effacer tout l'historique des parties ?")) {
        return;
    }

    historiqueParties = [];
    sauverHistoriqueParties();

    alert("Historique effacé");
}

// -----------------------------------------------------
// Détection niveau depuis le nom
// -----------------------------------------------------
function extraireInfosNiveauDepuisNom(nom) {
    if (!nom || typeof nom !== "string") {
        return { typeNiveau: null, niveau: null };
    }

    const texte = nom.trim();

    const matchN = texte.match(/n\s*(1[0-5]|[5-9])(?!\d)/i);
    if (matchN) {
        return {
            typeNiveau: "sport_cerebral",
            niveau: "N" + matchN[1]
        };
    }

    const bas = texte.toLowerCase();

    if (bas.includes("facile")) {
        return { typeNiveau: "classique", niveau: "Facile" };
    }

    if (bas.includes("moyen")) {
        return { typeNiveau: "classique", niveau: "Moyen" };
    }

    if (bas.includes("difficile")) {
        return { typeNiveau: "classique", niveau: "Difficile" };
    }

    if (bas.includes("diabolique")) {
        return { typeNiveau: "classique", niveau: "Diabolique" };
    }

    if (bas.includes("expert")) {
        return { typeNiveau: "classique", niveau: "Expert" };
    }

    return { typeNiveau: null, niveau: null };
}

// -----------------------------------------------------
// Utilitaires statistiques
// -----------------------------------------------------
function moyenneListeNombres(valeurs, arrondi = null) {
    if (!valeurs || valeurs.length === 0) return null;

    const somme = valeurs.reduce((a, b) => a + b, 0);
    const moyenne = somme / valeurs.length;

    if (arrondi === null) return moyenne;

    const facteur = Math.pow(10, arrondi);
    return Math.round(moyenne * facteur) / facteur;
}

function calculerRang(valeur, listeTrieeCroissante) {
    if (typeof valeur !== "number") return null;
    if (!Array.isArray(listeTrieeCroissante) || listeTrieeCroissante.length === 0) return null;

    const index = listeTrieeCroissante.findIndex(v => v === valeur);
    return index >= 0 ? index + 1 : null;
}

// -----------------------------------------------------
// Parties d'un même niveau
// -----------------------------------------------------
function getPartiesMemeNiveau(typeNiveau, niveau) {
    return historiqueParties.filter(p =>
        p.typeNiveau === typeNiveau && p.niveau === niveau
    );
}

function calculerComparaisonNiveau(typeNiveau, niveau, temps, nbGuess) {
    const parties = getPartiesMemeNiveau(typeNiveau, niveau);

    const tempsListe = parties
        .map(p => p.temps)
        .filter(t => typeof t === "number")
        .sort((a, b) => a - b);

    const guessListe = parties
        .map(p => p.nbGuess)
        .filter(g => typeof g === "number")
        .sort((a, b) => a - b);

    return {
        nbPartiesTemps: tempsListe.length,
        nbPartiesGuess: guessListe.length,

        meilleurTemps: tempsListe.length ? tempsListe[0] : null,
        moyenneTemps: tempsListe.length ? Math.round(moyenneListeNombres(tempsListe)) : null,
        rangTemps: tempsListe.length ? calculerRang(temps, tempsListe) : null,

        meilleurGuess: guessListe.length ? guessListe[0] : null,
        moyenneGuess: guessListe.length ? moyenneListeNombres(guessListe, 1) : null,
        rangGuess: guessListe.length ? calculerRang(nbGuess, guessListe) : null
    };
}

// -----------------------------------------------------
// Enregistrement d'une partie terminée
// -----------------------------------------------------
function enregistrerPartieTermineeHistorique() {
    if (partieHistoriqueEnregistree) return;
    if (!statsJeu) return;

    let typeNiveau = typeNiveauPartie;
    let niveau = niveauPartie;

    if (!typeNiveau || !niveau) {
        const info = extraireInfosNiveauDepuisNom(nomSauvegarde);
        typeNiveau = info.typeNiveau;
        niveau = info.niveau;
    }
    const analyseSolveur = analyserGrilleDepartPourHistorique(grille, grilleFixe);
    
    const entree = {
        id: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        date: new Date().toISOString(),
        nom: nomSauvegarde ?? "sudoku",
        typeNiveau: typeNiveau,
        niveau: niveau,
        temps: typeof tempsEcoule === "number" ? tempsEcoule : null,
        nbGuess: (statsJeu && typeof statsJeu.nb_guess === "number")
            ? statsJeu.nb_guess
            : null,
        premierGuess: (statsJeu && typeof statsJeu.premier_guess === "number")
            ? statsJeu.premier_guess
            : null,
        chiffresPlaces: statsJeu?.chiffres_places ?? 0,
        undo: statsJeu?.undo ?? 0,
        effacements: statsJeu?.effacements ?? 0,

        niveauSolveur: analyseSolveur.niveauSolveur,
        guessSolveur: analyseSolveur.guessSolveur,
        logicLoopsSolveur: analyseSolveur.logicLoopsSolveur,
        branchesSolveur: analyseSolveur.branchesSolveur,
        sourceAnalyseSolveur: analyseSolveur.sourceAnalyseSolveur,        
    };

    historiqueParties.push(entree);
    sauverHistoriqueParties();
    partieHistoriqueEnregistree = true;
}

// -----------------------------------------------------
// Affichage comparaison fin de partie
// -----------------------------------------------------
function afficherComparaisonFinPartie() {
    let typeNiveau = typeNiveauPartie;
    let niveau = niveauPartie;

    if (!typeNiveau || !niveau) {
        const info = extraireInfosNiveauDepuisNom(nomSauvegarde);
        typeNiveau = info.typeNiveau;
        niveau = info.niveau;
    }

    if (!typeNiveau || !niveau) {
        return;
    }

    const nbGuessCourant = (statsJeu && typeof statsJeu.nb_guess === "number")
        ? statsJeu.nb_guess
        : null;

    const comp = calculerComparaisonNiveau(
        typeNiveau,
        niveau,
        tempsEcoule,
        nbGuessCourant
    );

    let texte =
        "Partie terminée\n\n" +
        "Niveau : " + niveau + "\n" +
        "Temps : " + formaterTemps(tempsEcoule) + "\n" +
        "Guesses : " + (nbGuessCourant ?? "-") + "\n\n";

    if (comp.nbPartiesTemps > 0) {
        texte +=
            "Temps (" + comp.nbPartiesTemps + " partie(s))\n" +
            "Meilleur : " + (comp.meilleurTemps !== null ? formaterTemps(comp.meilleurTemps) : "-") + "\n" +
            "Moyenne : " + (comp.moyenneTemps !== null ? formaterTemps(comp.moyenneTemps) : "-") + "\n" +
            "Rang : " + (comp.rangTemps ?? "-") + "/" + comp.nbPartiesTemps + "\n\n";
    }

    if (comp.nbPartiesGuess > 0) {
        texte +=
            "Guesses (" + comp.nbPartiesGuess + " partie(s) avec donnée)\n" +
            "Meilleur : " + (comp.meilleurGuess ?? "-") + "\n" +
            "Moyenne : " + (comp.moyenneGuess ?? "-") + "\n" +
            "Rang : " + (comp.rangGuess ?? "-") + "/" + comp.nbPartiesGuess;
    } else {
        texte += "Guesses : pas assez de données";
    }

   alert(texte);
}