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

// =====================================================
// SAVE / LOAD
// =====================================================
function sauverPartie() {
    if (mode === "jeu") {
        arreterTimer();
    }

    let nom = prompt("Nom de la sauvegarde :", nomSauvegarde);

    if (!nom) {
        if (mode === "jeu" && !timerEnPause) demarrerTimer();
        return;
    }

    nomSauvegarde = nom;
    afficherNomPartie();

    const data = {
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
        couleurCellule: couleurCellule
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nomSauvegarde + ".json";
    a.click();

    URL.revokeObjectURL(url);

    if (mode === "jeu" && !timerEnPause) {
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

            grille = data.grille ?? grille;
            grilleCand = data.grilleCand ?? grilleCand;
            grilleFixe = data.grilleFixe ?? grilleFixe;
            grilleCouleur = data.grilleCouleur ?? grilleCouleur;

            mode = data.mode ?? "preparation";
            modeCandidat = data.modeCandidat ?? false;

            tempsEcoule = data.tempsEcoule ?? 0;
            couleurCandidat = data.couleurCandidat ?? couleurCandidat;
            couleurSelection = data.couleurSelection ?? couleurSelection;
            couleurCellule = data.couleurCellule ?? couleurCellule;

            if (data.nom) {
                nomSauvegarde = data.nom;
                afficherNomPartie();
            }

            selectedCells.clear();
            caseSel = { l: 0, c: 0 };
            pileUndo = [];
            drag = false;
            pointerStartCell = null;
            dragSelection = false;
            longPress = false;
            clearTimeout(pressTimer);

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

            timerEnPause = false;
            document.getElementById("btnTimer").textContent = "Pause";

            if (mode === "jeu") {
                demarrerTimer();
            }

            verifierGrille();
            dessinerTout();
        } catch (err) {
            alert("Fichier de sauvegarde invalide");
            console.error(err);
        }
    };

    reader.readAsText(file);
    event.target.value = "";
}

function afficherNomPartie() {
    document.getElementById("nomPartie").textContent = "Partie : " + nomSauvegarde;
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
    clearTimeout(pressTimer);

    timerEnPause = false;

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnValider").style.display = "inline";
    document.getElementById("infoMode").style.display = "none";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";

    ajusterCanvas();
    dessinerTout();
    reinitialiserTimer();

    nomSauvegarde = "sudoku";
    afficherNomPartie();
}

function effacer() {
    let cellules = getCellsSelectionnees();

    cellules.forEach(({ l, c }) => {
        if (grilleFixe[l][c]) return;

        grille[l][c] = 0;
        grilleCand[l][c] = [];
    });

    verifierGrille();
    dessinerTout();
}

function effacerBouton() {
    sauverEtat();
    effacer();
}

// =====================================================
// CANDIDATS
// =====================================================
function creerCandidatsCellule(l, c) {
    if (grille[l][c] !== 0) return;

    grilleCand[l][c] = [];

    for (let n = 1; n <= 9; n++) {
        if (estValide(l, c, n)) {
            grilleCand[l][c].push({ n: n, c: couleurCandidat });
        }
    }
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

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (grilleFixe[l][c]) continue;
            if (grille[l][c] !== 0) continue;

            creerCandidatsCellule(l, c);
        }
    }

    dessinerTout();
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
    reinitialiserTimer();
    demarrerTimer();
    timerEnPause = false;
    selectedCells.clear();

    document.getElementById("btnTimer").textContent = "Pause";
    document.getElementById("btnCandidat").textContent = "Candidats : OFF";
    document.getElementById("btnValider").style.display = "none";
    document.getElementById("infoMode").style.display = "inline";

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

// =====================================================
// ACTIONS UTILISATEUR
// =====================================================
function touche(n) {
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
                } else {
                    liste.push({ n: n, c: couleurCandidat });
                    liste.sort((a, b) => a.n - b.n);
                }
            });
        } else {
            if (grilleFixe[caseSel.l][caseSel.c]) return;

            grille[caseSel.l][caseSel.c] = n;
            grilleCand[caseSel.l][caseSel.c] = [];

            supprimerCandidatAutour(caseSel.l, caseSel.c, n);
        }

        verifierGrille();
        dessinerTout();
    }
}

function toucheBouton(n) {
    sauverEtat();
    touche(n);
}

function toggleModeCandidat() {
    modeCandidat = !modeCandidat;
    selectedCells.clear();

    const btn = document.getElementById("btnCandidat");
    btn.textContent = modeCandidat ? "Candidats : ON" : "Candidats : OFF";

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

    const cellules = getCellsSelectionnees();

    cellules.forEach(({ l, c }) => {
        if (grilleFixe[l][c]) return;
        if (grille[l][c] !== 0) return;

        creerCandidatsCellule(l, c);
    });

    dessinerTout();
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
// DEBUG / INIT
// =====================================================
function afficherMode() {
    console.log("Mode actuel :", mode);
}

dessinerTout();
afficherNomPartie();
afficherTimer();