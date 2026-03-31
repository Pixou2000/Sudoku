// =====================================================
// GENERATEUR SUDOKU
// utilise sudoku_solver.js
// =====================================================

function shuffleArray(arr) {
    const a = arr.slice();

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}

// =====================================================
// CREATION D'UNE GRILLE COMPLETE
// =====================================================

function genererGrilleComplete() {

    const grille = Array.from({ length: 9 }, () => Array(9).fill(0));

    function remplir() {

        for (let l = 0; l < 9; l++) {
            for (let c = 0; c < 9; c++) {

                if (grille[l][c] !== 0) continue;

                const chiffres = shuffleArray([1,2,3,4,5,6,7,8,9]);

                for (const n of chiffres) {

                    if (possibleJS(grille, l, c, n)) {

                        grille[l][c] = n;

                        if (remplir()) return true;

                        grille[l][c] = 0;
                    }
                }

                return false;
            }
        }

        return true;
    }

    remplir();

    return grille;
}

// =====================================================
// SUPPRESSION DE CASES AVEC UNICITE
// =====================================================

function retirerCasesAvecUnicite(solution, objectif) {

    const puzzle = copieGrilleJS(solution);

    const positions = [];

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            positions.push({l,c});
        }
    }

    const ordre = shuffleArray(positions);

    let retirees = 0;

    for (const pos of ordre) {

        if (retirees >= objectif) break;

        const {l,c} = pos;

        const backup = puzzle[l][c];

        if (backup === 0) continue;

        puzzle[l][c] = 0;

        const nbSolutions = compterSolutionsSudokuJS(puzzle,2);

        if (nbSolutions === 1) {
            retirees++;
        } else {
            puzzle[l][c] = backup;
        }
    }

    return puzzle;
}

// =====================================================
// GENERATION SIMPLE
// =====================================================

function generateSudoku(cellsToRemove = 45) {

    const solution = genererGrilleComplete();

    const puzzle = retirerCasesAvecUnicite(solution, cellsToRemove);

    const evaluation = evaluerDifficulteSudokuJS(puzzle);

    return {
        puzzle,
        solution,
        niveau: evaluation.niveau,
        stats: evaluation.stats
    };
}

// =====================================================
// GENERATION PAR NIVEAU
// =====================================================

function generateSudokuByLevel(niveauVise, essaisMax) {
    const retraitParNiveau = {
        facile: [32, 33, 34, 35, 36, 37, 38],
        moyen: [42, 43, 44, 42, 43,37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
        difficile: [44, 45, 46, 47, 48, 49, 50, 51],
        expert: [50, 51, 52, 53, 54, 55]
    };

    const retraits = retraitParNiveau[niveauVise] ?? [45];

    if (essaisMax === undefined) {
        essaisMax = 30; //(niveauVise === "moyen") ? 1000 : 100;
    }

    for (let essai = 0; essai < essaisMax; essai++) {
        const solution = genererGrilleComplete();
        const cellsToRemove = retraits[Math.floor(Math.random() * retraits.length)];
        const puzzle = retirerCasesAvecUnicite(solution, cellsToRemove);

        const evaluation = evaluerDifficulteSudokuJS(puzzle);

        if (essai % 10 === 0) {
            document.getElementById("statsSolveur").textContent =
                `Essai ${essai + 1}/${essaisMax}
        Niveau visé : ${niveauVise}
        Niveau obtenu : ${evaluation.niveau}
        Guess : ${evaluation.stats.guess}`;
        }        

        if (evaluation.success && evaluation.niveau === niveauVise) {
            return {
                puzzle,
                solution,
                niveau: evaluation.niveau,
                stats: evaluation.stats
            };
        }
    }

    return null;
}