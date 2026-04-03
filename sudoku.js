// =====================================================
// CANVAS
// =====================================================
const canvas = document.getElementById("sudokuCanvas");
const ctx = canvas.getContext("2d");
const COULEUR_CANDIDAT_DEFAUT = "grey";
function focusGrille() {
    canvas.focus();
}
const VERSION_APP = "v1.0.4 ";
//v0.1.2: remis les bouttons Cands ON/OFF et Couleur Selection dans HTML
//v0.2.0: ajout de fonction aide avec fenêtre popup
//v0.2.2: Effacer couleur, efface aussi couleur des candidats des cellules selectionnées
//v0.2.4: Modifier taille des chiffres (de 30px à 45px)
//v0.3.0: Modification generateur de Sudoku pour passer à 1000 essais en Moyen, 100 pour les autres vs. 400 pour tous
//v0.4.0: Modification Solveur pour mieux estimer le nombre de guess
//v0.5.0: Modifier taille des chiifres pour etre proportionel à taille grille sinon trop grand sur iphone
//v0.6.0: Ajout dans stats de jeu: temps du 1er guess et nb de guess
//v1.0.2: Ajout de fonction comparaison avec historique
//v1.0.3: Historique modifié pour pour inclure date fin des parties
//v1.0.4: Historique: ajout d'une analyse de toutes las parties avec le Solveur pour mieux comparer les niveaux
let tailleCell;

// =====================================================
// VARIABLES
// =====================================================
let caseSel = null;
let selectedCells = new Set();
let drag = false;
let tapTimer = null;

let mode = "preparation";
let pileUndo = [];

let couleurCandidat = "grey";
let couleurCandidatErreur = "red";
let couleurCellule = "#ffcccc";

let longPress = false;
let pressTimer = null;

let tempsEcoule = 0;
let timerInterval = null;
let timerDepart = null;
let timerEnPause = false;

let statsSolveur = null;
let statsJeu = null;
let guessActif = false;

let partieGagnee = false;
let autoSaveAvantQuit = true;

let nomSauvegarde = "20260323-";
const VERSION_SAUVEGARDE = 1;

let grilleCouleur = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [])
);
let couleurSelection = "rgba(255,200,200,0.5)";
let grilleFixe = Array.from({ length: 9 }, () => Array(9).fill(false));
let modeCandidat = false;
let grille = Array.from({ length: 9 }, () => Array(9).fill(0));
let grilleErreur = Array.from({ length: 9 }, () => Array(9).fill(false));
let grilleCand = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [])
);

// Variables pour Pointer Events
let pointerStartCell = null;
let dragSelection = false;
let lastTapTime = 0;
let lastTapCell = null;

// =====================================================
// INITIALISATION
// =====================================================
function ajusterCanvas() {
    const marge = 40;
    let largeurMax = window.innerWidth * 0.62;
    let hauteurMax = window.innerHeight * 0.58;

    let taille = Math.min(largeurMax, hauteurMax) - marge;
    taille = Math.max(320, Math.min(taille, 620));

    canvas.width = taille;
    canvas.height = taille;

    tailleCell = taille / 9;
}

ajusterCanvas();

window.addEventListener("resize", () => {
    ajusterCanvas();
    dessinerTout();
});

function afficherVersionApp() {
    const zone = document.getElementById("versionApp");
    if (zone) {
        zone.textContent = VERSION_APP;
    }
}

function ouvrirAide() {
    document.getElementById("fenetreAide").style.display = "flex";
}

function fermerAide() {
    document.getElementById("fenetreAide").style.display = "none";
}

window.addEventListener("click", function (e) {
    const modalAide = document.getElementById("fenetreAide");
    if (e.target === modalAide) {
        fermerAide();
    }

    const modalHistorique = document.getElementById("fenetreHistorique");
    if (e.target === modalHistorique) {
        fermerHistoriqueModal();
    }
});

// =====================================================
// DESSIN
// =====================================================
function dessinerTout() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dessinerCouleurs();
    dessinerSurlignage();
    dessinerSelectionMultiple();
    dessinerGrille();
    dessinerCandidats();
    dessinerChiffres();
    dessinerSelection();
    dessinerPause();
    dessinerVictoire();
}

function dessinerGrille() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 9; i++) {
        let p = i * tailleCell;

        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
    }

    ctx.lineWidth = 3;

    for (let i = 0; i <= 9; i += 3) {
        let p = i * tailleCell;

        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
    }
}

function dessinerSurlignage() {
    if (!caseSel) return;
    let l = caseSel.l;
    let c = caseSel.c;

    ctx.fillStyle = "rgba(200,200,200,0.4)";

    ctx.fillRect(0, l * tailleCell, canvas.width, tailleCell);
    ctx.fillRect(c * tailleCell, 0, tailleCell, canvas.height);

    let blocL = Math.floor(l / 3) * 3;
    let blocC = Math.floor(c / 3) * 3;

    ctx.fillStyle = "rgba(180,180,180,0.4)";
    ctx.fillRect(
        blocC * tailleCell,
        blocL * tailleCell,
        tailleCell * 3,
        tailleCell * 3
    );
}

function dessinerChiffres() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            let n = grille[l][c];

            if (n !== 0) {
                let x = c * tailleCell + tailleCell / 2;
                let y = l * tailleCell + tailleCell / 2;

                if (!estValidePlacement(l, c, n)) {
                    ctx.fillStyle = "red";
                    const taillePolice = Math.floor(tailleCell * 0.7);
                    ctx.font = `${taillePolice}px Arial`;
                } else {
                    if (mode === "preparation") {
                        ctx.fillStyle = "blue";
                        const taillePolice = Math.floor(tailleCell * 0.7);
                        ctx.font = `${taillePolice}px Arial`;
                    } else if (mode === "jeu") {
                        if (grilleFixe[l][c]) {
                            ctx.fillStyle = "black";
                            const taillePolice = Math.floor(tailleCell * 0.7);
                            ctx.font = `${taillePolice}px Arial`;
                        } else {
                            ctx.fillStyle = "grey";
                            const taillePolice = Math.floor(tailleCell * 0.72);
                            ctx.font = `${taillePolice}px 'Patrick Hand'`;
                        }
                    }
                }

                ctx.fillText(n, x, y);
            }
        }
    }
}

function dessinerCandidats() {
    ctx.font = "14px 'Patrick Hand'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (grille[l][c] === 0) {
                for (let cand of grilleCand[l][c]) {
                    let n = cand.n;

                    let posX = (n - 1) % 3;
                    let posY = Math.floor((n - 1) / 3);

                    let x = c * tailleCell + posX * (tailleCell / 3) + tailleCell / 6;
                    let y = l * tailleCell + posY * (tailleCell / 3) + tailleCell / 6;

                    if (estValidePlacement(l, c, n)) {
                        ctx.fillStyle = cand.c;
                    } else {
                        ctx.fillStyle = couleurCandidatErreur;
                    }

                    ctx.fillText(n, x, y);
                }
            }
        }
    }
}

function dessinerSelection() {
    if (!caseSel) return;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        caseSel.c * tailleCell,
        caseSel.l * tailleCell,
        tailleCell,
        tailleCell
    );
}

function dessinerSelectionMultiple() {
    if (selectedCells.size <= 1) return;

    ctx.fillStyle = couleurSelection;

    selectedCells.forEach(key => {
        let [l, c] = key.split("_").map(Number);

        ctx.fillRect(
            c * tailleCell,
            l * tailleCell,
            tailleCell,
            tailleCell
        );
    });
}

function dessinerCouleurs() {
    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            const couleurs = grilleCouleur[l][c];

            if (!couleurs || couleurs.length === 0) continue;

            const x = c * tailleCell;
            const y = l * tailleCell;
            const w = tailleCell;
            const h = tailleCell;

            // 1 couleur : fond plein
            if (couleurs.length === 1) {
                ctx.fillStyle = couleurTransparente(couleurs[0]);
                ctx.fillRect(x, y, w, h);
            }

            // 2 couleurs : diagonale simple
            else if (couleurs.length === 2) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                ctx.fillStyle = couleurTransparente(couleurs[0]);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(x + w, y);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                ctx.fillStyle = couleurTransparente(couleurs[1]);
                ctx.fill();
            }

            // 3 couleurs : 3 bandes diagonales régulières
            // 3 couleurs : 3 bandes diagonales régulières sans chevauchement
            else {
                ctx.save();

                // clip à la cellule
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();

                // centre de la cellule
                const cx = x + w / 2;
                const cy = y + h / 2;

                // diagonale utile après rotation
                const diag = Math.sqrt(w * w + h * h);

                // largeur d'une bande
                const bande = diag / 3;

                // rotation pour obtenir des bandes à 45°
                ctx.translate(cx, cy);
                ctx.rotate(-Math.PI / 4);

                // bande 1
                ctx.fillStyle = couleurTransparente(couleurs[0]);
                ctx.fillRect(-diag / 2, -diag / 2, diag, bande);

                // bande 2
                ctx.fillStyle = couleurTransparente(couleurs[1]);
                ctx.fillRect(-diag / 2, -diag / 2 + bande, diag, bande);

                // bande 3
                ctx.fillStyle = couleurTransparente(couleurs[2]);
                ctx.fillRect(-diag / 2, -diag / 2 + 2 * bande, diag, bande);

                ctx.restore();
            }
        }
    }
}

function colorerSelection() {
    const cellules = getCellsSelectionnees();

    cellules.forEach(({ l, c }) => {
        if (grilleFixe[l][c]) return;
        ajouterCouleurCellule(l, c, couleurCellule);
    });

    dessinerTout();
}

function dessinerPause() {
    if (!timerEnPause) return;

    ctx.fillStyle = "rgba(200,200,200,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function dessinerVictoire() {
    if (!partieGagnee) return;

    ctx.fillStyle = "rgba(120, 220, 120, 0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 120, 0, 0.95)";
    ctx.font = "bold 56px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Gagné !", canvas.width / 2, canvas.height / 2);
}

// =====================================================
// SAVE / LOAD
// =====================================================
function sauverPartie() {
    const timerEtaitActif = (mode === "jeu" && !timerEnPause && timerInterval !== null);

    if (mode === "jeu") {
        arreterTimer();
    }

let nomParDefaut = nomSauvegarde;

// si c’est la première sauvegarde (nom encore "sudoku")
if (nomSauvegarde === "sudoku") {
    nomParDefaut = dateFormatSauvegarde();
}

    let nom = prompt("Nom de la sauvegarde :", nomParDefaut);

        if (!nom) {
            if (timerEtaitActif) demarrerTimer();
            return;
        }

        nomSauvegarde = nom;
        afficherNomPartie();

    const data = construireDonneesSauvegarde();

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nomSauvegarde + ".json";
    a.click();

    URL.revokeObjectURL(url);

    if (timerEtaitActif) {
        demarrerTimer();
    }
}

function chargerPartie(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            grille = data.grille ?? Array.from({ length: 9 }, () => Array(9).fill(0));
            grilleCand = data.grilleCand ?? Array.from({ length: 9 }, () =>
                Array.from({ length: 9 }, () => [])
            );
            grilleFixe = data.grilleFixe ?? Array.from({ length: 9 }, () => Array(9).fill(false));
            grilleCouleur = data.grilleCouleur ?? Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => [])
            );

            mode = data.mode ?? "preparation";
            modeCandidat = data.modeCandidat ?? false;

            tempsEcoule = data.tempsEcoule ?? 0;
            couleurCandidat = data.couleurCandidat ?? "grey";
            couleurSelection = data.couleurSelection ?? "rgba(255,200,200,0.5)";
            couleurCellule = data.couleurCellule ?? "#ffcccc";

            statsSolveur = data.statsSolveur ?? null;
            statsJeu = {
                ...creerStatsJeuParDefaut(),
                ...(data.statsJeu ?? {})
            };
            guessActif = false;
            partieGagnee = data.partieGagnee ?? false;

            if (data.nom) {
                nomSauvegarde = data.nom;
            } else {
                nomSauvegarde = "sudoku";
            }
            afficherNomPartie();
            const infoNiveauCharge = extraireInfosNiveauDepuisNom(nomSauvegarde);
            definirNiveauPartie(infoNiveauCharge.typeNiveau, infoNiveauCharge.niveau);

            selectedCells.clear();
            caseSel = null;
            pileUndo = [];
            drag = false;
            pointerStartCell = null;
            dragSelection = false;
            longPress = false;
            clearTimeout(pressTimer);

            timerEnPause = false;
            document.getElementById("btnTimer").textContent = "Pause";

            if (mode === "jeu") {
                document.getElementById("btnValider").style.display = "none";
                document.getElementById("infoMode").style.display = "inline";
            } else {
                document.getElementById("btnValider").style.display = "inline";
                document.getElementById("infoMode").style.display = "none";
            }

            const btn = document.getElementById("btnCandidat");
            if (btn) {
                btn.textContent = modeCandidat ? "Candidats : ON" : "Candidats : OFF";
            }

            arreterTimer();
            afficherTimer();

            if (mode === "jeu") {
                demarrerTimer();
            }

            verifierGrille();
            mettreAJourClavier();
            afficherStatsSolveur();
            afficherStatsJeu();
            dessinerTout();
        } catch (err) {
            alert("Fichier de sauvegarde invalide");
            console.error(err);
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}

function afficherNomPartie() {
    document.getElementById("nomPartie").textContent = "Partie : " + nomSauvegarde;
}

function construireDonneesSauvegarde() {
    return {
        version: VERSION_SAUVEGARDE,
        nom: nomSauvegarde,
        grille: grille,
        grilleCand: grilleCand,
        grilleFixe: grilleFixe,
        grilleCouleur: grilleCouleur,
        mode: mode,
        modeCandidat: modeCandidat,
        tempsEcoule: tempsEcoule,
        couleurCandidat: couleurCandidat,
        couleurSelection: couleurSelection,
        couleurCellule: couleurCellule,
        statsSolveur: statsSolveur,
        statsJeu: statsJeu,
        partieGagnee: partieGagnee
    };
}

function sauvegardeLocaleSilencieuse() {
    try {
        if (mode === "jeu") {
            arreterTimer();
        }

        const data = construireDonneesSauvegarde();
        localStorage.setItem("sudoku_autosave", JSON.stringify(data));
    } catch (err) {
        console.error("Erreur autosave :", err);
    }
}

function chargerAutosaveLocale() {
    try {
        const brut = localStorage.getItem("sudoku_autosave");
        if (!brut) return;

        const data = JSON.parse(brut);

        grille = data.grille ?? Array.from({ length: 9 }, () => Array(9).fill(0));
        grilleCand = data.grilleCand ?? Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => [])
        );
        grilleFixe = data.grilleFixe ?? Array.from({ length: 9 }, () => Array(9).fill(false));
        grilleCouleur = data.grilleCouleur ?? Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => [])
        );
        mode = data.mode ?? "preparation";
        modeCandidat = data.modeCandidat ?? false;

        tempsEcoule = data.tempsEcoule ?? 0;
        couleurCandidat = data.couleurCandidat ?? "grey";
        couleurSelection = data.couleurSelection ?? "rgba(255,200,200,0.5)";
        couleurCellule = data.couleurCellule ?? "#ffcccc";

        statsSolveur = data.statsSolveur ?? null;
        statsJeu = {
            ...creerStatsJeuParDefaut(),
            ...(data.statsJeu ?? {})
        };
        guessActif = false;

        partieGagnee = data.partieGagnee ?? false;

        nomSauvegarde = data.nom ?? "sudoku";
        afficherNomPartie();
        const infoNiveauCharge = extraireInfosNiveauDepuisNom(nomSauvegarde);
        definirNiveauPartie(infoNiveauCharge.typeNiveau, infoNiveauCharge.niveau);

        selectedCells.clear();
        caseSel = null;
        pileUndo = [];
        drag = false;
        pointerStartCell = null;
        dragSelection = false;
        longPress = false;
        clearTimeout(pressTimer);

        timerEnPause = false;
        document.getElementById("btnTimer").textContent = "Pause";

        if (mode === "jeu") {
            document.getElementById("btnValider").style.display = "none";
            document.getElementById("infoMode").style.display = "inline";
        } else {
            document.getElementById("btnValider").style.display = "inline";
            document.getElementById("infoMode").style.display = "none";
        }

        const btn = document.getElementById("btnCandidat");
        if (btn) {
            btn.textContent = modeCandidat ? "Candidats : ON" : "Candidats : OFF";
        }

        arreterTimer();
        afficherTimer();

        verifierGrille();
        mettreAJourClavier();
        afficherStatsSolveur();
        afficherStatsJeu();
        dessinerTout();

        if (mode === "jeu" && !partieGagnee) {
            demarrerTimer();
        }
    } catch (err) {
        console.error("Erreur chargement autosave :", err);
    }
}

function quitterPartie() {
    sauvegardeLocaleSilencieuse();

    alert("Partie enregistrée avant fermeture.");

    try {
        window.close();
    } catch (err) {
        console.error(err);
    }
}

function dateFormatSauvegarde() {
    const d = new Date();

    const annee = d.getFullYear();
    const mois = String(d.getMonth() + 1).padStart(2, "0");
    const jour = String(d.getDate()).padStart(2, "0");

    return `${annee}${mois}${jour}-`;
}

// =====================================================
// MINUTERIE
// =====================================================
function formaterTemps(totalSecondes) {
    let minutes = Math.floor(totalSecondes / 60);
    let secondes = totalSecondes % 60;

    let mm = String(minutes).padStart(2, "0");
    let ss = String(secondes).padStart(2, "0");

    return mm + ":" + ss;
}

function afficherTimer() {
    document.getElementById("timer").textContent = formaterTemps(tempsEcoule);
    afficherStatsJeu();
}

function demarrerTimer() {
    if (timerInterval !== null) return;

    timerDepart = Date.now() - tempsEcoule * 1000;

    timerInterval = setInterval(() => {
        tempsEcoule = Math.floor((Date.now() - timerDepart) / 1000);
        afficherTimer();
    }, 250);
}

function arreterTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (timerDepart !== null) {
        tempsEcoule = Math.floor((Date.now() - timerDepart) / 1000);
        timerDepart = null;
    }

    afficherTimer();
}

function reinitialiserTimer() {
    arreterTimer();
    tempsEcoule = 0;
    afficherTimer();
}

function toggleTimer() {
    if (mode !== "jeu") return;

    const btn = document.getElementById("btnTimer");

    if (timerEnPause) {
        demarrerTimer();
        timerEnPause = false;
        btn.textContent = "Pause";
    } else {
        arreterTimer();
        timerEnPause = true;
        btn.textContent = "Reprendre";
    }

    dessinerTout();
}

// =====================================================
// LOGIQUE SUDOKU
// =====================================================
function nouvelleGrille() {
    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            grille[l][c] = 0;
            grilleCand[l][c] = [];
            grilleFixe[l][c] = false;
            grilleErreur[l][c] = false;
            grilleCouleur[l][c] = [];
        }
    }

    mode = "preparation";
    modeCandidat = false;
    caseSel = null;
    selectedCells.clear();
    pileUndo = [];

    drag = false;
    pointerStartCell = null;
    dragSelection = false;
    longPress = false;
    partieGagnee = false;
    clearTimeout(pressTimer);
    clearTimeout(tapTimer);
    tapTimer = null;
    lastTapTime = 0;
    lastTapCell = null;

    timerEnPause = false;

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnValider").style.display = "inline";
    document.getElementById("infoMode").style.display = "none";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";

    ajusterCanvas();
    dessinerTout();
    reinitialiserTimer();
    reinitialiserStatsJeu();
    reinitialiserInfosHistoriquePartie();

    statsSolveur = null;
    afficherStatsSolveur();

    mettreAJourClavier();

    nomSauvegarde = "sudoku";
    afficherNomPartie();

    focusGrille();
}

function effacerCands() {

    let cellules = getCellsSelectionnees();

    cellules.forEach(({ l, c }) => {

        if (grilleFixe[l][c]) return;

        if (grilleCand[l][c].length > 0) {
            grilleCand[l][c] = [];

            if (statsJeu) {
                statsJeu.effacements += 1;
            }
        }

    });

    verifierGrille();
    dessinerTout();
    afficherStatsJeu();
}

function effacer() {

    let cellules = getCellsSelectionnees();

    cellules.forEach(({ l, c }) => {

        if (grilleFixe[l][c]) return;

        const avaitQuelqueChose =
            (grille[l][c] !== 0) ||
            (grilleCand[l][c].length > 0);

        grille[l][c] = 0;
        grilleCand[l][c] = [];

        if (avaitQuelqueChose && statsJeu) {
            statsJeu.effacements += 1;
        }

    });

    verifierGrille();
    dessinerTout();
    afficherStatsJeu();
}

function effacerBouton() {
    sauverEtat();
    effacer();
}

function effacerBoutonCands() {
    sauverEtat();
    effacerCands();
}

function grilleCompleteEtValide() {
    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            const n = grille[l][c];
            if (n === 0) return false;
            if (!estValidePlacement(l, c, n)) return false;
        }
    }
    return true;
}

function verifierVictoire() {
    if (mode !== "jeu") return;
    if (partieGagnee) return;

    if (grilleCompleteEtValide()) {
        partieGagnee = true;
        arreterTimer();
        enregistrerPartieTermineeHistorique();
        dessinerTout();
        afficherComparaisonFinPartie();
    }
}

// =====================================================
// CANDIDATS
// =====================================================
function creerCandidatsCellule(l, c) {
    if (grille[l][c] !== 0) return 0;

    const anciens = new Set(grilleCand[l][c].map(x => x.n));
    const nouveaux = [];

    for (let n = 1; n <= 9; n++) {
        if (estValide(l, c, n)) {
            nouveaux.push({ n: n, c: couleurCandidat });
        }
    }

    grilleCand[l][c] = nouveaux;

    let ajoutes = 0;
    for (const cand of nouveaux) {
        if (!anciens.has(cand.n)) {
            ajoutes += 1;
        }
    }

    return ajoutes;
}

function supprimerCandidatAutour(l, c, n) {
    for (let i = 0; i < 9; i++) {
        grilleCand[l][i] = grilleCand[l][i].filter(x => x.n !== n);
    }

    for (let i = 0; i < 9; i++) {
        grilleCand[i][c] = grilleCand[i][c].filter(x => x.n !== n);
    }

    let blocL = Math.floor(l / 3) * 3;
    let blocC = Math.floor(c / 3) * 3;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let ll = blocL + i;
            let cc = blocC + j;
            grilleCand[ll][cc] = grilleCand[ll][cc].filter(x => x.n !== n);
        }
    }
}

function creerTousCandidats() {
    if (mode !== "jeu") return;
    if (partieGagnee) return;

    sauverEtat();

    if (statsJeu && statsJeu.premier_usage_tous_cands === null) {
        statsJeu.premier_usage_tous_cands = tempsEcoule;
    }

    let totalAjoutes = 0;

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (grilleFixe[l][c]) continue;
            if (grille[l][c] !== 0) continue;

            totalAjoutes += creerCandidatsCellule(l, c);
        }
    }

    if (statsJeu) {
        statsJeu.candidats_ajoutes_tous_cands += totalAjoutes;
    }

    dessinerTout();
    afficherStatsJeu();
}

// =====================================================
// VALIDATION
// =====================================================
function estValide(l, c, n) {
    for (let i = 0; i < 9; i++) {
        if (grille[l][i] === n) return false;
    }

    for (let i = 0; i < 9; i++) {
        if (grille[i][c] === n) return false;
    }

    let blocL = Math.floor(l / 3) * 3;
    let blocC = Math.floor(c / 3) * 3;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grille[blocL + i][blocC + j] === n) return false;
        }
    }

    return true;
}

function estValidePlacement(l, c, n) {
    for (let i = 0; i < 9; i++) {
        if (i !== c && grille[l][i] === n) return false;
    }

    for (let i = 0; i < 9; i++) {
        if (i !== l && grille[i][c] === n) return false;
    }

    let blocL = Math.floor(l / 3) * 3;
    let blocC = Math.floor(c / 3) * 3;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let ll = blocL + i;
            let cc = blocC + j;

            if ((ll !== l || cc !== c) && grille[ll][cc] === n) {
                return false;
            }
        }
    }

    return true;
}

function validerGrilleDepart() {
    if (mode === "jeu") {
        return false;
    }

    let ok = true;

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            let n = grille[l][c];

            if (n !== 0 && !estValidePlacement(l, c, n)) {
                ok = false;
            }
        }
    }

    if (!ok) {
        alert("La grille de départ contient des erreurs.");
        dessinerTout();
        return false;
    }

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            grilleFixe[l][c] = (grille[l][c] !== 0);
        }
    }

    mode = "jeu";
    modeCandidat = false;
    partieGagnee = false;
    reinitialiserTimer();
    demarrerTimer();
    timerEnPause = false;
    selectedCells.clear();

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";
    document.getElementById("btnValider").style.display = "none";
    document.getElementById("infoMode").style.display = "inline";

    statsSolveur = null;
    afficherStatsSolveur();

    dessinerTout();

    focusGrille();
    return true;
}

function verifierGrille() {
    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            grilleErreur[l][c] = false;

            let n = grille[l][c];

            if (n !== 0) {
                if (!estValidePlacement(l, c, n)) {
                    grilleErreur[l][c] = true;
                }
            }
        }
    }
}

function mettreAJourClavier() {
    const clavier = document.getElementById("clavier");
    const btn = document.getElementById("btnCandidatClavier");

    if (!clavier || !btn) return;

    if (modeCandidat) {
        clavier.classList.remove("mode-chiffre");
        clavier.classList.add("mode-candidat");

        btn.classList.remove("inactif");
        btn.classList.add("actif");
    } else {
        clavier.classList.remove("mode-candidat");
        clavier.classList.add("mode-chiffre");

        btn.classList.remove("actif");
        btn.classList.add("inactif");
    }
}

// =====================================================
// ACTIONS UTILISATEUR
// =====================================================
function touche(n) {
    if (partieGagnee) return;
    if (mode === "preparation") {
        const cellules = getCellsSelectionnees();

        cellules.forEach(({ l, c }) => {
            grille[l][c] = n;
            grilleCand[l][c] = [];
        });

        verifierGrille();
        dessinerTout();
        return;
    }

    if (mode === "jeu") {
        if (modeCandidat) {
            const cellules = getCellsSelectionnees();
            let candidatColorieNonDefaut = false;

            cellules.forEach(({ l, c }) => {
                if (grilleFixe[l][c]) return;
                if (grille[l][c] !== 0) return;

                let liste = grilleCand[l][c];

                if (liste.some(x => x.n === n)) {
                    grilleCand[l][c] = liste.filter(x => x.n !== n);

                    if (statsJeu) {
                        statsJeu.candidats_supprimes_manuel += 1;
                    }
                } else {
                    liste.push({ n: n, c: couleurCandidat });
                    liste.sort((a, b) => a.n - b.n);

                    if (statsJeu) {
                        statsJeu.candidats_ajoutes_manuel += 1;
                    }

                    if (couleurCandidat !== COULEUR_CANDIDAT_DEFAUT) {
                        candidatColorieNonDefaut = true;
                    }
                }
            });

            if (candidatColorieNonDefaut) {
                enregistrerGuessSiBesoin();
            }
        } else {
            if (!caseSel) return;
            if (grilleFixe[caseSel.l][caseSel.c]) return;

            grille[caseSel.l][caseSel.c] = n;
            grilleCand[caseSel.l][caseSel.c] = [];

            if (statsJeu) statsJeu.chiffres_places += 1;

            supprimerCandidatAutour(caseSel.l, caseSel.c, n);
        }

        verifierGrille();
        dessinerTout();
        afficherStatsJeu();
        verifierVictoire();
    }
}

function toucheBouton(n) {
    sauverEtat();
    touche(n);
}

function toggleModeCandidat() {
    modeCandidat = !modeCandidat;
    selectedCells.clear();

    mettreAJourClavier();
    dessinerTout();
}

function getCellsSelectionnees() {
    if (selectedCells.size > 1) {
        let cellules = [];
        selectedCells.forEach(key => {
            let [l, c] = key.split("_").map(Number);
            cellules.push({ l, c });
        });
        return cellules;
    }

    return caseSel ? [caseSel] : [];
}

function creerCandidatsSelection() {
    if (mode !== "jeu") return;
    if (partieGagnee) return;

    sauverEtat();

    if (statsJeu && statsJeu.premier_usage_cands_selection === null) {
        statsJeu.premier_usage_cands_selection = tempsEcoule;
    }

    const cellules = getCellsSelectionnees();
    let totalAjoutes = 0;

    cellules.forEach(({ l, c }) => {
        if (grilleFixe[l][c]) return;
        if (grille[l][c] !== 0) return;

        totalAjoutes += creerCandidatsCellule(l, c);
    });

    if (statsJeu) {
        statsJeu.candidats_ajoutes_cands_selection += totalAjoutes;
    }

    dessinerTout();
    afficherStatsJeu();
}

function changerCouleurCandidats() {
    let nouvelleCouleur = prompt("Couleur des candidats :", couleurCandidat);

    if (nouvelleCouleur) {
        couleurCandidat = nouvelleCouleur;
        dessinerTout();
    }
}

function changerCouleurSelection() {
    let nouvelleCouleur = prompt("Couleur des cellules sélectionnées :", couleurSelection);

    if (nouvelleCouleur) {
        couleurSelection = nouvelleCouleur;
        dessinerTout();
    }
}

function ajouterCouleurCellule(l, c, couleur) {
    if (grilleFixe[l][c]) return;

    if (!Array.isArray(grilleCouleur[l][c])) {
        grilleCouleur[l][c] = [];
    }

    const liste = grilleCouleur[l][c];

    if (liste.length > 0 && liste[liste.length - 1] === couleur) return;

    liste.push(couleur);

    if (liste.length > 3) {
        grilleCouleur[l][c] = liste.slice(-3);
    }
}

function effacerCouleurSelection() {
    const cellules = getCellsSelectionnees();
    let aReinitialiseDesCouleursCandidat = false;

    cellules.forEach(({ l, c }) => {
        if (grilleFixe[l][c]) return;

        // efface la couleur de la cellule
        grilleCouleur[l][c] = [];

        // remet les candidats de la cellule à la couleur par défaut
        grilleCand[l][c].forEach(cand => {
            if (cand.c !== COULEUR_CANDIDAT_DEFAUT) {
                cand.c = COULEUR_CANDIDAT_DEFAUT;
                aReinitialiseDesCouleursCandidat = true;
            }
        });
    });

    if (aReinitialiseDesCouleursCandidat) {
        guessActif = false;
    }

    dessinerTout();
    afficherStatsJeu();
}

function couleurTransparente(hex, alpha = 0.35) {

    if (!hex || hex[0] !== "#") return hex;

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}

function afficherStatsSolveur() {
    const zone = document.getElementById("statsSolveur");
    if (!zone) return;

    if (!statsSolveur) {
        zone.textContent = "";
        return;
    }

    zone.textContent =
        "Niveau : " + (statsSolveur.niveau ?? "inconnu") + "\n" +
        "\n" +
        "Singles : " + statsSolveur.single + "\n" +
        "Hidden singles : " + statsSolveur.hidden_single + "\n" +
        "Locked candidates : " + statsSolveur.locked + "\n" +
        "Naked pairs : " + statsSolveur.pair + "\n" +
        "Hidden pairs : " + statsSolveur.hidden_pair + "\n" +
        "Backtrack calls : " + statsSolveur.backtrack_calls + "\n" +
        "Branches testées : " + statsSolveur.branches_tested + "\n" +
        "Guesses : " + statsSolveur.guess + "\n" +
        "Logic loops : " + statsSolveur.logic_loops + "\n" +
        "Total : " + statsSolveur.iterations_total;
}

function resoudreGrille() {
    const resultat = resoudreSudokuJS(grille);

    if (!resultat.success) {
        alert("Pas de solution trouvée");
        return;
    }

    sauverEtat();

    grille = resultat.solution.map(ligne => ligne.slice());
    statsSolveur = resultat.stats;

   for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            grilleCand[l][c] = [];
        }
    }

    verifierGrille();
    dessinerTout();

    afficherStatsSolveur();
}

function analyserStatsGrille() {
    const resultat = resoudreSudokuJS(grille);

    statsSolveur = resultat.stats;
    afficherStatsSolveur();

    if (!resultat.success) {
        alert("Pas de solution trouvée");
    }
}

// =====================================================
// Generateur
// =====================================================

function genererNouvellePartie(cellsToRemove = 45) {
    const resultat = generateSudoku(cellsToRemove);

    if (!resultat) {
        alert("Impossible de générer une grille");
        return;
    }

    const { puzzle, solution } = resultat;

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            grille[l][c] = puzzle[l][c];
            grilleCand[l][c] = [];
            grilleFixe[l][c] = (puzzle[l][c] !== 0);
            grilleErreur[l][c] = false;
            grilleCouleur[l][c] = [];
        }
    }

    mode = "jeu";
    modeCandidat = false;
    caseSel = null;
    selectedCells.clear();
    pileUndo = [];

    drag = false;
    pointerStartCell = null;
    dragSelection = false;
    longPress = false;
    partieGagnee = false;
    clearTimeout(pressTimer);
    clearTimeout(tapTimer);
    tapTimer = null;
    lastTapTime = 0;
    lastTapCell = null;

    timerEnPause = false;

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnValider").style.display = "none";
    document.getElementById("infoMode").style.display = "inline";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";

    reinitialiserTimer();
    demarrerTimer();
    reinitialiserStatsJeu();
    definirNiveauPartie(
        "classique",
        resultat.niveau
            ? resultat.niveau.charAt(0).toUpperCase() + resultat.niveau.slice(1)
            : null
    );

    statsSolveur = null;
    afficherStatsSolveur();

    window.solutionCourante = solution;

    verifierGrille();
    mettreAJourClavier();
    afficherStatsJeu();
    dessinerTout();

    nomSauvegarde = "sudoku";
    afficherNomPartie();
    focusGrille();
}

function genererNouvellePartieNiveau(niveau) {
    const resultat = generateSudokuByLevel(niveau);

    if (!resultat) {
        alert("Impossible de générer ce niveau");
        return;
    }

    const { puzzle, solution } = resultat;

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            grille[l][c] = puzzle[l][c];
            grilleCand[l][c] = [];
            grilleFixe[l][c] = (puzzle[l][c] !== 0);
            grilleErreur[l][c] = false;
            grilleCouleur[l][c] = [];
        }
    }

    mode = "jeu";
    modeCandidat = false;
    caseSel = null;
    selectedCells.clear();
    pileUndo = [];

    drag = false;
    pointerStartCell = null;
    dragSelection = false;
    longPress = false;
    partieGagnee = false;
    clearTimeout(pressTimer);
    clearTimeout(tapTimer);
    tapTimer = null;
    lastTapTime = 0;
    lastTapCell = null;

    timerEnPause = false;

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnValider").style.display = "none";
    document.getElementById("infoMode").style.display = "inline";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";

    reinitialiserTimer();
    demarrerTimer();
    reinitialiserStatsJeu();
    definirNiveauPartie(
        "classique",
        niveau ? niveau.charAt(0).toUpperCase() + niveau.slice(1) : null
    );

    statsSolveur = null;
    afficherStatsSolveur();

    window.solutionCourante = solution;

    verifierGrille();
    mettreAJourClavier();
    afficherStatsJeu();
    dessinerTout();

    nomSauvegarde = "sudoku";
    afficherNomPartie();
    focusGrille();
}

function genererDepuisSelectNiveau() {
    const select = document.getElementById("niveauGeneration");
    const niveau = select ? select.value : "moyen";

    genererNouvellePartieNiveau(niveau);
    focusGrille();
}
// =====================================================
// UNDO
// =====================================================
function sauverEtat() {
    let etat = {
        grille: JSON.parse(JSON.stringify(grille)),
        grilleCand: JSON.parse(JSON.stringify(grilleCand)),
        grilleCouleur: JSON.parse(JSON.stringify(grilleCouleur)),
        caseSel: { ...caseSel },
        selectedCells: Array.from(selectedCells),
        modeCandidat: modeCandidat
    };

    pileUndo.push(etat);
}

function undo() {
    if (pileUndo.length === 0) return;
    if (statsJeu) statsJeu.undo += 1;
    let etat = pileUndo.pop();

    grille = etat.grille;
    grilleCand = etat.grilleCand;
    grilleCouleur = etat.grilleCouleur ?? grilleCouleur;
    caseSel = etat.caseSel ?? caseSel;
    selectedCells = new Set(etat.selectedCells ?? []);
    modeCandidat = etat.modeCandidat ?? modeCandidat;

    const btn = document.getElementById("btnCandidat");
    if (btn) {
        btn.textContent = modeCandidat ? "Candidats : ON" : "Candidats : OFF";
    }

    verifierGrille();
    dessinerTout();
    mettreAJourClavier();
    afficherStatsJeu();
}

function colorerSelectionBouton() {
    sauverEtat();
    colorerSelection();
}

function effacerCouleurSelectionBouton() {
    sauverEtat();
    effacerCouleurSelection();
}

// =====================================================
// OUTILS SELECTION
// =====================================================
function celluleDepuisPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let c = Math.floor(x / tailleCell);
    let l = Math.floor(y / tailleCell);

    c = Math.max(0, Math.min(8, c));
    l = Math.max(0, Math.min(8, l));

    return { l, c };
}

function keyCell(l, c) {
    return l + "_" + c;
}

function memeCellule(a, b) {
    return a && b && a.l === b.l && a.c === b.c;
}

function remplirRectangleSelection(cellA, cellB) {
    selectedCells.clear();

    const lMin = Math.min(cellA.l, cellB.l);
    const lMax = Math.max(cellA.l, cellB.l);
    const cMin = Math.min(cellA.c, cellB.c);
    const cMax = Math.max(cellA.c, cellB.c);

    for (let l = lMin; l <= lMax; l++) {
        for (let c = cMin; c <= cMax; c++) {
            selectedCells.add(keyCell(l, c));
        }
    }
}

function selectionnerToutesLesMemesValeurs(cell) {
    const n = grille[cell.l][cell.c];
    if (n === 0) return;

    selectedCells.clear();

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            const memeChiffre = grille[l][c] === n;

            const aLeCandidat = grilleCand[l][c].some(cand => cand.n === n);

            if (memeChiffre || aLeCandidat) {
                selectedCells.add(keyCell(l, c));
            }
        }
    }

    caseSel = cell;
    dessinerTout();
}

// =====================================================
// EVENEMENTS POINTEUR (Mac + iPad)
// =====================================================
canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    focusGrille();

    drag = true;
    dragSelection = false;

    const cell = celluleDepuisPoint(e.clientX, e.clientY);
    pointerStartCell = cell;

    canvas.setPointerCapture(e.pointerId);

    const key = keyCell(cell.l, cell.c);

    if (e.shiftKey) {
        if (selectedCells.has(key)) {
            selectedCells.delete(key);
        } else {
            selectedCells.add(key);
        }
        dessinerTout();
        return;
    }
});

canvas.addEventListener("pointermove", (e) => {
    if (!drag || !pointerStartCell) return;

    e.preventDefault();

    const cell = celluleDepuisPoint(e.clientX, e.clientY);

    if (!memeCellule(cell, pointerStartCell)) {
        dragSelection = true;
        remplirRectangleSelection(pointerStartCell, cell);
        caseSel = cell;
        dessinerTout();
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (!pointerStartCell) return;

    e.preventDefault();

    const cell = celluleDepuisPoint(e.clientX, e.clientY);
    const maintenant = Date.now();

    const doubleTap =
        lastTapCell &&
        memeCellule(cell, lastTapCell) &&
        (maintenant - lastTapTime < 350);

    // 1. Double tap : fonctionne dans tous les cas
    if (doubleTap) {
        if (tapTimer) {
            clearTimeout(tapTimer);
            tapTimer = null;
        }

        selectionnerToutesLesMemesValeurs(cell);

        lastTapTime = 0;
        lastTapCell = null;

        drag = false;
        dragSelection = false;
        pointerStartCell = null;
        return;
    }

    // 2. Drag sélection rectangle
    if (dragSelection) {
        if (tapTimer) {
            clearTimeout(tapTimer);
            tapTimer = null;
        }

        remplirRectangleSelection(pointerStartCell, cell);
        caseSel = cell;
        dessinerTout();

        lastTapTime = maintenant;
        lastTapCell = cell;

        drag = false;
        dragSelection = false;
        pointerStartCell = null;
        return;
    }

    // 3. Clic simple
    // - si on reclique sur la cellule active : désélection différée
    // - sinon : sélection immédiate
    if (caseSel && memeCellule(cell, caseSel)) {
        if (tapTimer) clearTimeout(tapTimer);

        tapTimer = setTimeout(() => {
            selectedCells.clear();
            caseSel = null;
            dessinerTout();
            tapTimer = null;
        }, 350);
    } else {
        if (tapTimer) {
            clearTimeout(tapTimer);
            tapTimer = null;
        }

        selectedCells.clear();
        caseSel = cell;
        dessinerTout();
    }

    lastTapTime = maintenant;
    lastTapCell = cell;

    drag = false;
    dragSelection = false;
    pointerStartCell = null;
});

canvas.addEventListener("pointercancel", () => {
    drag = false;
    dragSelection = false;
    pointerStartCell = null;
});

// =====================================================
// EVENEMENTS CLAVIER
// =====================================================
function toucheClavier(e) {
    const key = e.key;

    if (mode === "jeu" && key === "n") {
        toggleModeCandidat();
        return;
    }

    if (key >= "1" && key <= "9") {
        sauverEtat();
        touche(Number(key));
        return;
    }

    if (key === "Backspace" || key === "Delete" || key === "0") {
        sauverEtat();
        effacer();
        return;
    }
}

document.addEventListener("keydown", toucheClavier);

// =====================================================
// STATS DE JEU
// =====================================================

function creerStatsJeuParDefaut() {
    return {
        chiffres_places: 0,

        candidats_ajoutes_manuel: 0,
        candidats_supprimes_manuel: 0,

        candidats_ajoutes_cands_selection: 0,
        candidats_ajoutes_tous_cands: 0,

        premier_usage_cands_selection: null,
        premier_usage_tous_cands: null,

        premier_guess: null,
        nb_guess: 0,

        effacements: 0,
        undo: 0
    };
}

function reinitialiserStatsJeu() {
    statsJeu = creerStatsJeuParDefaut();
    guessActif = false;
    afficherStatsJeu();
}

function afficherStatsJeu() {
    const zone = document.getElementById("statsJeu");
    if (!zone) return;

    if (!statsJeu) {
        zone.textContent = "";
        return;
    }

    const tCandsSelection = statsJeu.premier_usage_cands_selection === null
        ? "-"
        : formaterTemps(statsJeu.premier_usage_cands_selection);

    const tTousCands = statsJeu.premier_usage_tous_cands === null
        ? "-"
        : formaterTemps(statsJeu.premier_usage_tous_cands);

    const tPremierGuess = statsJeu.premier_guess === null
        ? "-"
        : formaterTemps(statsJeu.premier_guess);

    zone.textContent =
        "Stats joueur\n" +
        "Chiffres placés : " + statsJeu.chiffres_places + "\n" +
        "\n" +
        "Candidats manuels + : " + statsJeu.candidats_ajoutes_manuel + "\n" +
        "Candidats manuels - : " + statsJeu.candidats_supprimes_manuel + "\n" +
        "\n" +
        "Ajout via Cands sélection : " + statsJeu.candidats_ajoutes_cands_selection + "\n" +
        "1er usage Cands sélection : " + tCandsSelection + "\n" +
        "\n" +
        "Ajout via Tous cands : " + statsJeu.candidats_ajoutes_tous_cands + "\n" +
        "1er usage Tous cands : " + tTousCands + "\n" +
        "\n" +
        "Nb guesses : " + statsJeu.nb_guess + "\n" +
        "1er guess : " + tPremierGuess + "\n" +
        "\n" +
        "Effacements : " + statsJeu.effacements + "\n" +
        "Undo : " + statsJeu.undo + "\n" +
        "Temps : " + formaterTemps(tempsEcoule);
}

function enregistrerGuessSiBesoin() {
    if (!statsJeu) return;

    if (!guessActif) {
        guessActif = true;
        statsJeu.nb_guess += 1;

        if (statsJeu.premier_guess === null) {
            statsJeu.premier_guess = tempsEcoule;
        }

        afficherStatsJeu();
    }
}

// =====================================================
// DEBUG / INIT
// =====================================================
function afficherMode() {
    console.log("Mode actuel :", mode);
}

/*window.addEventListener("beforeunload", () => {
   if (autoSaveAvantQuit) {
        sauvegardeLocaleSilencieuse();
   }
});*/

statsJeu = creerStatsJeuParDefaut();
statsSolveur = null;

chargerHistoriqueParties();

dessinerTout();
afficherStatsSolveur();
afficherNomPartie();
afficherTimer();
mettreAJourClavier();
afficherStatsJeu();
afficherVersionApp();

const inputImportHistorique = document.getElementById("importHistorique");
if (inputImportHistorique) {
    inputImportHistorique.addEventListener("change", importerHistoriqueDepuisFichiers);
}