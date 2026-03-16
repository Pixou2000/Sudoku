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

        const single = trouverSingleJS(gr, cands);
        if (single) {
            gr[single.l][single.c] = single.n;
            stats.single += 1;
            cands = creerCandidatsJS(gr);
            progression = true;
            continue;
        }

        const hs = trouverHiddenSingleJS(gr, cands);
        if (hs) {
            gr[hs.l][hs.c] = hs.n;
            stats.hidden_single += 1;
            cands = creerCandidatsJS(gr);
            progression = true;
            continue;
        }

        if (appliquerLockedCandidatesBlocJS(gr, cands)) {
            stats.locked += 1;
            progression = true;
            continue;
        }

        if (appliquerLockedCandidatesLigneColonneJS(gr, cands)) {
            stats.locked += 1;
            progression = true;
            continue;
        }

        if (appliquerNakedPairJS(gr, cands)) {
            stats.pair += 1;
            progression = true;
            continue;
        }

        if (appliquerHiddenPairJS(gr, cands)) {
            stats.hidden_pair += 1;
            progression = true;
            continue;
        }
    }

    return gr;
}

function evaluerDifficulteDepuisStatsJS(stats) {
    const techniquesAvancees =
        stats.locked + stats.pair + stats.hidden_pair;

    if (
        stats.guess === 0 &&
        techniquesAvancees === 0
    ) {
        return "facile";
    }

    if (
        stats.guess === 0 &&
        techniquesAvancees > 0
    ) {
        return "moyen";
    }

    if (stats.guess <= 2) {
        return "difficile";
    }

    return "expert";
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
        niveau: "inconnu",
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

    if (res.success) {
        stats.niveau = evaluerDifficulteDepuisStatsJS(stats);
    }

    return {
        success: res.success,
        solution: res.solution,
        stats
    };
}

// =====================================================
// COMPTAGE DE SOLUTIONS
// =====================================================
function trouverCaseMinPourComptageJS(gr) {
    const cands = creerCandidatsJS(gr);
    let best = null;
    let minLen = 10;

    for (let l = 0; l < 9; l++) {
        for (let c = 0; c < 9; c++) {
            if (gr[l][c] !== 0) continue;

            const chaine = cands[l][c];
            const nb = chaine.length;

            if (nb === 0) {
                return { l, c, cands: "" };
            }

            if (nb < minLen) {
                minLen = nb;
                best = { l, c, cands: chaine };
                if (nb === 1) return best;
            }
        }
    }

    return best;
}

function compterSolutionsRecJS(gr, limite, compteur) {
    if (compteur.count >= limite) return;

    const caseMin = trouverCaseMinPourComptageJS(gr);

    if (!caseMin) {
        compteur.count += 1;
        return;
    }

    if (caseMin.cands.length === 0) {
        return;
    }

    for (const ch of caseMin.cands) {
        gr[caseMin.l][caseMin.c] = Number(ch);
        compterSolutionsRecJS(gr, limite, compteur);
        gr[caseMin.l][caseMin.c] = 0;

        if (compteur.count >= limite) return;
    }
}

function compterSolutionsSudokuJS(grilleDepart, limite = 2) {
    const grilleTravail = copieGrilleJS(grilleDepart);
    const compteur = { count: 0 };

    compterSolutionsRecJS(grilleTravail, limite, compteur);

    return compteur.count;
}

function evaluerDifficulteSudokuJS(grilleDepart) {
    const resultat = resoudreSudokuJS(grilleDepart);

    return {
        success: resultat.success,
        niveau: resultat.stats.niveau,
        stats: resultat.stats,
        solution: resultat.solution
    };
}
