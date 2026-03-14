// =====================================================
// CANVAS
// =====================================================
const canvas = document.getElementById("sudokuCanvas");
const ctx = canvas.getContext("2d");

let tailleCell;

// =====================================================
// VARIABLES
// =====================================================
let caseSel = { l: 0, c: 0 };
let selectedCells = new Set();
let drag = false;

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

let partieGagnee = false;
let autoSaveAvantQuit = true;

let nomSauvegarde = "sudoku";
const VERSION_SAUVEGARDE = 1;

let grilleCouleur = Array.from({ length: 9 }, () => Array(9).fill(null));
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
                    ctx.font = "30px Arial";
                } else {
                    if (mode === "preparation") {
                        ctx.fillStyle = "blue";
                        ctx.font = "30px Arial";
                    } else if (mode === "jeu") {
                        if (grilleFixe[l][c]) {
                            ctx.fillStyle = "black";
                            ctx.font = "30px Arial";
                        } else {
                            ctx.fillStyle = "grey";
                            ctx.font = "34px 'Patrick Hand'";
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
            let couleur = grilleCouleur[l][c];

            if (couleur) {
                ctx.fillStyle = couleur;
                ctx.fillRect(
                    c * tailleCell,
                    l * tailleCell,
                    tailleCell,
                    tailleCell
                );
            }
        }
    }
}

function colorerSelection() {
    const cellules = getCellsSelectionnees();

    cellules.forEach(({ l, c }) => {
        grilleCouleur[l][c] = couleurCellule;
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

    let nom = prompt("Nom de la sauvegarde :", nomSauvegarde);

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
            grilleCouleur = data.grilleCouleur ?? Array.from({ length: 9 }, () => Array(9).fill(null));

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
            partieGagnee = data.partieGagnee ?? false;

            if (data.nom) {
                nomSauvegarde = data.nom;
            } else {
                nomSauvegarde = "sudoku";
            }
            afficherNomPartie();

            selectedCells.clear();
            caseSel = { l: 0, c: 0 };
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
        grilleCouleur = data.grilleCouleur ?? Array.from({ length: 9 }, () => Array(9).fill(null));

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

        partieGagnee = data.partieGagnee ?? false;

        nomSauvegarde = data.nom ?? "sudoku";
        afficherNomPartie();

        selectedCells.clear();
        caseSel = { l: 0, c: 0 };
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
            grilleCouleur[l][c] = null;
        }
    }

    mode = "preparation";
    modeCandidat = false;
    caseSel = { l: 0, c: 0 };
    selectedCells.clear();
    pileUndo = [];

    drag = false;
    pointerStartCell = null;
    dragSelection = false;
    longPress = false;
    partieGagnee = false;
    clearTimeout(pressTimer);

    timerEnPause = false;

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnValider").style.display = "inline";
    document.getElementById("infoMode").style.display = "none";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";

    ajusterCanvas();
    dessinerTout();
    reinitialiserTimer();
    reinitialiserStatsJeu();
    statsSolveur = null;
    afficherStatsSolveur();
    mettreAJourClavier();

    nomSauvegarde = "sudoku";
    afficherNomPartie();
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
        dessinerTout();
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
                }
            });
        } else {
            if (grilleFixe[caseSel.l][caseSel.c]) return;

            grille[caseSel.l][caseSel.c] = n;
            grilleCand[caseSel.l][caseSel.c] = [];

            if (statsJeu) statsJeu.chiffres_places += 1;

            supprimerCandidatAutour(caseSel.l, caseSel.c, n);
        }

        verifierGrille();
        dessinerTout();
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
    if (selectedCells.size <= 1) {
        return [caseSel];
    }

    let cellules = [];
    selectedCells.forEach(key => {
        let [l, c] = key.split("_").map(Number);
        cellules.push({ l, c });
    });

    return cellules;
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

function afficherStatsSolveur() {
    const zone = document.getElementById("statsSolveur");
    if (!zone) return;

    if (!statsSolveur) {
        zone.textContent = "";
        return;
    }

    zone.textContent =
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
            if (grille[l][c] === n) {
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

    drag = true;
    dragSelection = false;

    const cell = celluleDepuisPoint(e.clientX, e.clientY);
    pointerStartCell = cell;
    caseSel = cell;

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

    if (doubleTap) {
        selectionnerToutesLesMemesValeurs(cell);
        lastTapTime = 0;
        lastTapCell = null;
    } else {
        if (!dragSelection) {
            selectedCells.clear();
        } else {
            remplirRectangleSelection(pointerStartCell, cell);
        }

        caseSel = cell;
        dessinerTout();

        lastTapTime = maintenant;
        lastTapCell = cell;
    }

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
// SOLVEUR PUR JS
// =====================================================
function copieGrilleJS(gr) {
    return gr.map(ligne => ligne.slice());
}

function grilleCompleteJS(gr) {
    return gr.every(ligne => ligne.every(v => v !== 0));
}

function possibleJS(gr, l, c, n) {
    for (let i = 0; i < 9; i++) {
        if (gr[l][i] === n) return false;
    }

    for (let i = 0; i < 9; i++) {
        if (gr[i][c] === n) return false;
    }

    const l0 = Math.floor(l / 3) * 3;
    const c0 = Math.floor(c / 3) * 3;

    for (let i = l0; i < l0 + 3; i++) {
        for (let j = c0; j < c0 + 3; j++) {
            if (gr[i][j] === n) return false;
        }
    }

    return true;
}

function candidatsCaseJS(gr, l, c) {
    if (gr[l][c] !== 0) return "";

    let out = "";
    for (let n = 1; n <= 9; n++) {
        if (possibleJS(gr, l, c, n)) out += String(n);
    }
    return out;
}

function creerCandidatsJS(gr) {
    const cands = Array.from({ length: 9 }, () => Array(9).fill(""));

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            cands[l][c] = candidatsCaseJS(gr, l, c);
        }
    }

    return cands;
}

function trouverSingleJS(gr, cands) {
    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (gr[l][c] === 0 && cands[l][c].length === 1) {
                return { l, c, n: Number(cands[l][c]) };
            }
        }
    }
    return null;
}

function trouverHiddenSingleLigneJS(gr, cands) {
    for (let l = 0; l < 9; l++) {
        for (let n = 1; n <= 9; n++) {
            const pos = [];

            for (let c = 0; c < 9; c++) {
                if (gr[l][c] === 0 && cands[l][c].includes(String(n))) {
                    pos.push({ l, c });
                }
            }

            if (pos.length === 1) {
                return { l: pos[0].l, c: pos[0].c, n };
            }
        }
    }
    return null;
}

function trouverHiddenSingleColonneJS(gr, cands) {
    for (let c = 0; c < 9; c++) {
        for (let n = 1; n <= 9; n++) {
            const pos = [];

            for (let l = 0; l < 9; l++) {
                if (gr[l][c] === 0 && cands[l][c].includes(String(n))) {
                    pos.push({ l, c });
                }
            }

            if (pos.length === 1) {
                return { l: pos[0].l, c: pos[0].c, n };
            }
        }
    }
    return null;
}

function trouverHiddenSingleBlocJS(gr, cands) {
    for (let blocL = 0; blocL < 9; blocL += 3) {
        for (let blocC = 0; blocC < 9; blocC += 3) {
            for (let n = 1; n <= 9; n++) {
                const pos = [];

                for (let l = blocL; l < blocL + 3; l++) {
                    for (let c = blocC; c < blocC + 3; c++) {
                        if (gr[l][c] === 0 && cands[l][c].includes(String(n))) {
                            pos.push({ l, c });
                        }
                    }
                }

                if (pos.length === 1) {
                    return { l: pos[0].l, c: pos[0].c, n };
                }
            }
        }
    }

    return null;
}

function trouverHiddenSingleJS(gr, cands) {
    return (
        trouverHiddenSingleLigneJS(gr, cands) ||
        trouverHiddenSingleColonneJS(gr, cands) ||
        trouverHiddenSingleBlocJS(gr, cands)
    );
}

function retirerChiffresJS(chaine, chiffres) {
    let out = "";
    for (const ch of chaine) {
        if (!chiffres.includes(ch)) out += ch;
    }
    return out;
}

function garderSeulementJS(chaine, chiffres) {
    let out = "";
    for (const ch of chaine) {
        if (chiffres.includes(ch)) out += ch;
    }
    return out;
}

function appliquerLockedCandidatesBlocJS(gr, cands) {
    for (let blocL = 0; blocL < 9; blocL += 3) {
        for (let blocC = 0; blocC < 9; blocC += 3) {
            for (let n = 1; n <= 9; n++) {
                const s = String(n);
                const positions = [];

                for (let l = blocL; l < blocL + 3; l++) {
                    for (let c = blocC; c < blocC + 3; c++) {
                        if (gr[l][c] === 0 && cands[l][c].includes(s)) {
                            positions.push({ l, c });
                        }
                    }
                }

                if (positions.length < 2) continue;

                const lignes = [...new Set(positions.map(p => p.l))];
                if (lignes.length === 1) {
                    const l = lignes[0];
                    let modif = false;

                    for (let c = 0; c < 9; c++) {
                        if (c >= blocC && c < blocC + 3) continue;
                        if (gr[l][c] !== 0) continue;

                        const avant = cands[l][c];
                        const apres = retirerChiffresJS(avant, s);
                        if (apres !== avant) {
                            cands[l][c] = apres;
                            modif = true;
                        }
                    }

                    if (modif) return true;
                }

                const colonnes = [...new Set(positions.map(p => p.c))];
                if (colonnes.length === 1) {
                    const c = colonnes[0];
                    let modif = false;

                    for (let l = 0; l < 9; l++) {
                        if (l >= blocL && l < blocL + 3) continue;
                        if (gr[l][c] !== 0) continue;

                        const avant = cands[l][c];
                        const apres = retirerChiffresJS(avant, s);
                        if (apres !== avant) {
                            cands[l][c] = apres;
                            modif = true;
                        }
                    }

                    if (modif) return true;
                }
            }
        }
    }

    return false;
}

function appliquerLockedCandidatesLigneColonneJS(gr, cands) {
    // ----- lignes -> bloc -----
    for (let l = 0; l < 9; l++) {
        for (let n = 1; n <= 9; n++) {
            const s = String(n);
            const positions = [];

            for (let c = 0; c < 9; c++) {
                if (gr[l][c] === 0 && cands[l][c].includes(s)) {
                    positions.push({ l, c });
                }
            }

            if (positions.length < 2) continue;

            const blocs = [...new Set(positions.map(p => `${Math.floor(p.l / 3)}_${Math.floor(p.c / 3)}`))];

            if (blocs.length === 1) {
                const [blocL, blocC] = blocs[0].split("_").map(Number);
                let modif = false;

                for (let i = blocL * 3; i < blocL * 3 + 3; i++) {
                    for (let j = blocC * 3; j < blocC * 3 + 3; j++) {
                        if (i === l) continue;
                        if (gr[i][j] !== 0) continue;

                        const avant = cands[i][j];
                        const apres = retirerChiffresJS(avant, s);

                        if (apres !== avant) {
                            cands[i][j] = apres;
                            modif = true;
                        }
                    }
                }

                if (modif) return true;
            }
        }
    }

    // ----- colonnes -> bloc -----
    for (let c = 0; c < 9; c++) {
        for (let n = 1; n <= 9; n++) {
            const s = String(n);
            const positions = [];

            for (let l = 0; l < 9; l++) {
                if (gr[l][c] === 0 && cands[l][c].includes(s)) {
                    positions.push({ l, c });
                }
            }

            if (positions.length < 2) continue;

            const blocs = [...new Set(positions.map(p => `${Math.floor(p.l / 3)}_${Math.floor(p.c / 3)}`))];

            if (blocs.length === 1) {
                const [blocL, blocC] = blocs[0].split("_").map(Number);
                let modif = false;

                for (let i = blocL * 3; i < blocL * 3 + 3; i++) {
                    for (let j = blocC * 3; j < blocC * 3 + 3; j++) {
                        if (j === c) continue;
                        if (gr[i][j] !== 0) continue;

                        const avant = cands[i][j];
                        const apres = retirerChiffresJS(avant, s);

                        if (apres !== avant) {
                            cands[i][j] = apres;
                            modif = true;
                        }
                    }
                }

                if (modif) return true;
            }
        }
    }

    return false;
}

function appliquerNakedPairJS(gr, cands) {
    // lignes
    for (let l = 0; l < 9; l++) {
        const paires = {};

        for (let c = 0; c < 9; c++) {
            if (gr[l][c] === 0 && cands[l][c].length === 2) {
                const pair = cands[l][c];
                if (!paires[pair]) paires[pair] = [];
                paires[pair].push(c);
            }
        }

        for (const pair in paires) {
            if (paires[pair].length === 2) {
                let modif = false;

                for (let c = 0; c < 9; c++) {
                    if (paires[pair].includes(c) || gr[l][c] !== 0) continue;

                    const avant = cands[l][c];
                    const apres = retirerChiffresJS(avant, pair);
                    if (apres !== avant) {
                        cands[l][c] = apres;
                        modif = true;
                    }
                }

                if (modif) return true;
            }
        }
    }

    // colonnes
    for (let c = 0; c < 9; c++) {
        const paires = {};

        for (let l = 0; l < 9; l++) {
            if (gr[l][c] === 0 && cands[l][c].length === 2) {
                const pair = cands[l][c];
                if (!paires[pair]) paires[pair] = [];
                paires[pair].push(l);
            }
        }

        for (const pair in paires) {
            if (paires[pair].length === 2) {
                let modif = false;

                for (let l = 0; l < 9; l++) {
                    if (paires[pair].includes(l) || gr[l][c] !== 0) continue;

                    const avant = cands[l][c];
                    const apres = retirerChiffresJS(avant, pair);
                    if (apres !== avant) {
                        cands[l][c] = apres;
                        modif = true;
                    }
                }

                if (modif) return true;
            }
        }
    }

    return false;
}

function hiddenPairLigneJS(gr, cands) {
    for (let l = 0; l < 9; l++) {
        const positionsParChiffre = {};

        for (let n = 1; n <= 9; n++) {
            const s = String(n);
            const positions = [];

            for (let c = 0; c < 9; c++) {
                if (gr[l][c] === 0 && cands[l][c].includes(s)) {
                    positions.push(c);
                }
            }

            if (positions.length === 2) {
                positionsParChiffre[s] = positions.slice();
            }
        }

        const chiffres = Object.keys(positionsParChiffre);

        for (let i = 0; i < chiffres.length; i++) {
            for (let j = i + 1; j < chiffres.length; j++) {
                const a = chiffres[i];
                const b = chiffres[j];

                const posA = positionsParChiffre[a];
                const posB = positionsParChiffre[b];

                if (posA[0] === posB[0] && posA[1] === posB[1]) {
                    const paire = a + b;
                    const c1 = posA[0];
                    const c2 = posA[1];
                    let modif = false;

                    const avant1 = cands[l][c1];
                    const apres1 = garderSeulementJS(avant1, paire);
                    if (apres1 !== avant1) {
                        cands[l][c1] = apres1;
                        modif = true;
                    }

                    const avant2 = cands[l][c2];
                    const apres2 = garderSeulementJS(avant2, paire);
                    if (apres2 !== avant2) {
                        cands[l][c2] = apres2;
                        modif = true;
                    }

                    if (modif) return true;
                }
            }
        }
    }

    return false;
}

function hiddenPairColonneJS(gr, cands) {
    for (let c = 0; c < 9; c++) {
        const positionsParChiffre = {};

        for (let n = 1; n <= 9; n++) {
            const s = String(n);
            const positions = [];

            for (let l = 0; l < 9; l++) {
                if (gr[l][c] === 0 && cands[l][c].includes(s)) {
                    positions.push(l);
                }
            }

            if (positions.length === 2) {
                positionsParChiffre[s] = positions.slice();
            }
        }

        const chiffres = Object.keys(positionsParChiffre);

        for (let i = 0; i < chiffres.length; i++) {
            for (let j = i + 1; j < chiffres.length; j++) {
                const a = chiffres[i];
                const b = chiffres[j];

                const posA = positionsParChiffre[a];
                const posB = positionsParChiffre[b];

                if (posA[0] === posB[0] && posA[1] === posB[1]) {
                    const paire = a + b;
                    const l1 = posA[0];
                    const l2 = posA[1];
                    let modif = false;

                    const avant1 = cands[l1][c];
                    const apres1 = garderSeulementJS(avant1, paire);
                    if (apres1 !== avant1) {
                        cands[l1][c] = apres1;
                        modif = true;
                    }

                    const avant2 = cands[l2][c];
                    const apres2 = garderSeulementJS(avant2, paire);
                    if (apres2 !== avant2) {
                        cands[l2][c] = apres2;
                        modif = true;
                    }

                    if (modif) return true;
                }
            }
        }
    }

    return false;
}

function hiddenPairBlocJS(gr, cands) {
    for (let blocL = 0; blocL < 9; blocL += 3) {
        for (let blocC = 0; blocC < 9; blocC += 3) {
            const positionsParChiffre = {};

            for (let n = 1; n <= 9; n++) {
                const s = String(n);
                const positions = [];

                for (let l = blocL; l < blocL + 3; l++) {
                    for (let c = blocC; c < blocC + 3; c++) {
                        if (gr[l][c] === 0 && cands[l][c].includes(s)) {
                            positions.push(`${l}_${c}`);
                        }
                    }
                }

                if (positions.length === 2) {
                    positionsParChiffre[s] = positions.slice();
                }
            }

            const chiffres = Object.keys(positionsParChiffre);

            for (let i = 0; i < chiffres.length; i++) {
                for (let j = i + 1; j < chiffres.length; j++) {
                    const a = chiffres[i];
                    const b = chiffres[j];

                    const posA = positionsParChiffre[a];
                    const posB = positionsParChiffre[b];

                    if (posA[0] === posB[0] && posA[1] === posB[1]) {
                        const paire = a + b;
                        const [l1, c1] = posA[0].split("_").map(Number);
                        const [l2, c2] = posA[1].split("_").map(Number);
                        let modif = false;

                        const avant1 = cands[l1][c1];
                        const apres1 = garderSeulementJS(avant1, paire);
                        if (apres1 !== avant1) {
                            cands[l1][c1] = apres1;
                            modif = true;
                        }

                        const avant2 = cands[l2][c2];
                        const apres2 = garderSeulementJS(avant2, paire);
                        if (apres2 !== avant2) {
                            cands[l2][c2] = apres2;
                            modif = true;
                        }

                        if (modif) return true;
                    }
                }
            }
        }
    }

    return false;
}

function appliquerHiddenPairJS(gr, cands) {
    if (hiddenPairLigneJS(gr, cands)) return true;
    if (hiddenPairColonneJS(gr, cands)) return true;
    if (hiddenPairBlocJS(gr, cands)) return true;
    return false;
}

function trouverCaseMinJS(gr) {
    const cands = creerCandidatsJS(gr);
    let best = null;
    let minLen = 10;

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (gr[l][c] !== 0) continue;

            const nb = cands[l][c].length;
            if (nb > 1 && nb < minLen) {
                minLen = nb;
                best = { l, c, cands: cands[l][c] };
                if (nb === 2) return best;
            }
        }
    }

    return best;
}

function appliquerLogiqueJS(gr, stats) {
    let cands = creerCandidatsJS(gr);
    let progression = true;

    while (progression) {
        progression = false;
        stats.logic_loops += 1;
        stats.iterations_total += 1;

        // 1. Naked single
        const single = trouverSingleJS(gr, cands);
        if (single) {
            gr[single.l][single.c] = single.n;
            stats.single += 1;
            cands = creerCandidatsJS(gr);
            progression = true;
            continue;
        }

        // 2. Hidden single
        const hs = trouverHiddenSingleJS(gr, cands);
        if (hs) {
            gr[hs.l][hs.c] = hs.n;
            stats.hidden_single += 1;
            cands = creerCandidatsJS(gr);
            progression = true;
            continue;
        }

        // 3. Locked candidates bloc -> ligne/colonne
        if (appliquerLockedCandidatesBlocJS(gr, cands)) {
            stats.locked += 1;
            progression = true;
            continue;
        }

        // 4. Locked candidates ligne/colonne -> bloc
        if (appliquerLockedCandidatesLigneColonneJS(gr, cands)) {
            stats.locked += 1;
            progression = true;
            continue;
        }

        // 5. Naked pair
        if (appliquerNakedPairJS(gr, cands)) {
            stats.pair += 1;
            progression = true;
            continue;
        }

        // 6. Hidden pair
        if (appliquerHiddenPairJS(gr, cands)) {
            stats.hidden_pair += 1;
            progression = true;
            continue;
        }
    }

    return gr;
}

function solveRecursiveJS(gr, stats) {
    stats.backtrack_calls += 1;
    stats.iterations_total += 1;

    gr = appliquerLogiqueJS(gr, stats);

    if (grilleCompleteJS(gr)) {
        return { success: true, solution: gr };
    }

    const caseMin = trouverCaseMinJS(gr);
    if (!caseMin) {
        return { success: false, solution: gr };
    }

    for (const ch of caseMin.cands) {
        stats.guess += 1;
        stats.branches_tested += 1;

        const copie = copieGrilleJS(gr);
        copie[caseMin.l][caseMin.c] = Number(ch);

        const res = solveRecursiveJS(copie, stats);
        if (res.success) return res;
    }

    return { success: false, solution: gr };
}

function resoudreSudokuJS(grilleDepart) {
    const stats = {
    single: 0,
    hidden_single: 0,
    pair: 0,
    hidden_pair: 0,
    locked: 0,
    guess: 0,
    logic_loops: 0,
    backtrack_calls: 0,
    branches_tested: 0,
    iterations_total: 0
};

    const grilleTravail = copieGrilleJS(grilleDepart);
    const res = solveRecursiveJS(grilleTravail, stats);

    return {
        success: res.success,
        solution: res.solution,
        stats
    };
}

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

        effacements: 0,
        undo: 0
    };
}

function creerStatsJeuParDefaut() {
    return {
        chiffres_places: 0,

        candidats_ajoutes_manuel: 0,
        candidats_supprimes_manuel: 0,

        candidats_ajoutes_cands_selection: 0,
        candidats_ajoutes_tous_cands: 0,

        premier_usage_cands_selection: null,
        premier_usage_tous_cands: null,

        effacements: 0,
        undo: 0
    };
}

function reinitialiserStatsJeu() {
    statsJeu = creerStatsJeuParDefaut();
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
        "Effacements : " + statsJeu.effacements + "\n" +
        "Undo : " + statsJeu.undo + "\n" +
        "Temps : " + formaterTemps(tempsEcoule);
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

dessinerTout();
afficherStatsSolveur();
afficherNomPartie();
afficherTimer();
mettreAJourClavier();
afficherStatsJeu();