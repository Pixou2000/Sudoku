// =====================================================
// UI HISTORIQUE
// =====================================================

function formaterDateHistorique(iso) {
    if (!iso) return "-";

    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;

    const an = d.getFullYear();
    const mois = String(d.getMonth() + 1).padStart(2, "0");
    const jour = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");

    return `${an}-${mois}-${jour} ${hh}:${mm}`;
}

function getLibelleTypeNiveau(typeNiveau) {
    if (typeNiveau === "classique") return "Classique";
    if (typeNiveau === "sport_cerebral") return "Sport Cérébral";
    return "-";
}

function getHistoriqueFiltre() {
    const select = document.getElementById("filtreHistoriqueNiveau");
    const filtre = select ? select.value : "";

    if (!filtre) return historiqueParties.slice();

    return historiqueParties.filter(p => {
        const cle = `${p.typeNiveau || ""}|${p.niveau || ""}`;
        return cle === filtre;
    });
}

function remplirFiltreHistorique() {
    const select = document.getElementById("filtreHistoriqueNiveau");
    if (!select) return;

    const valeurActuelle = select.value || "";

    const options = new Map();
    historiqueParties.forEach(p => {
        const cle = `${p.typeNiveau || ""}|${p.niveau || ""}`;
        const label = p.niveau
            ? `${p.niveau} (${getLibelleTypeNiveau(p.typeNiveau)})`
            : `Sans niveau (${getLibelleTypeNiveau(p.typeNiveau)})`;

        if (!options.has(cle)) {
            options.set(cle, label);
        }
    });

    const entreesTriees = Array.from(options.entries()).sort((a, b) =>
        a[1].localeCompare(b[1], "fr")
    );

    select.innerHTML = `<option value="">Tous</option>`;

    entreesTriees.forEach(([cle, label]) => {
        const opt = document.createElement("option");
        opt.value = cle;
        opt.textContent = label;
        select.appendChild(opt);
    });

    if ([...select.options].some(opt => opt.value === valeurActuelle)) {
        select.value = valeurActuelle;
    }
}

function rafraichirHistoriqueModal() {
    const tbody = document.querySelector("#tableHistorique tbody");
    const resume = document.getElementById("resumeHistorique");
    if (!tbody || !resume) return;

    const lignes = getHistoriqueFiltre()
        .slice()
        .sort((a, b) => {
            const da = a.date || "";
            const db = b.date || "";
            return db.localeCompare(da);
        });

    tbody.innerHTML = "";

    const tempsListe = lignes
        .map(p => p.temps)
        .filter(t => typeof t === "number");

    const guessListe = lignes
        .map(p => p.nbGuess)
        .filter(g => typeof g === "number");

    const meilleurTemps = tempsListe.length ? Math.min(...tempsListe) : null;
    const moyenneTemps = tempsListe.length
        ? Math.round(tempsListe.reduce((a, b) => a + b, 0) / tempsListe.length)
        : null;

    const meilleurGuess = guessListe.length ? Math.min(...guessListe) : null;
    const moyenneGuess = guessListe.length
        ? Math.round((guessListe.reduce((a, b) => a + b, 0) / guessListe.length) * 10) / 10
        : null;

    resume.textContent =
        `Parties : ${lignes.length}` +
        ` | Meilleur temps : ${meilleurTemps !== null ? formaterTemps(meilleurTemps) : "-"}` +
        ` | Temps moyen : ${moyenneTemps !== null ? formaterTemps(moyenneTemps) : "-"}` +
        ` | Meilleur guess : ${meilleurGuess !== null ? meilleurGuess : "-"}` +
        ` | Guess moyen : ${moyenneGuess !== null ? moyenneGuess : "-"}`;

    lignes.forEach(p => {
        const tr = document.createElement("tr");

        const cellules = [
            formaterDateHistorique(p.date),
            p.nom || "-",
            getLibelleTypeNiveau(p.typeNiveau),
            p.niveau || "-",
            (typeof p.temps === "number") ? formaterTemps(p.temps) : "-",
            (typeof p.nbGuess === "number") ? p.nbGuess : "-",
            (typeof p.premierGuess === "number") ? formaterTemps(p.premierGuess) : "-",
            (typeof p.undo === "number") ? p.undo : "-",
            (typeof p.effacements === "number") ? p.effacements : "-",
            p.niveauSolveur || "-",
            (typeof p.guessSolveur === "number") ? p.guessSolveur : "-",
            (typeof p.logicLoopsSolveur === "number") ? p.logicLoopsSolveur : "-",
            (typeof p.branchesSolveur === "number") ? p.branchesSolveur : "-",
            p.sourceAnalyseSolveur || "-"
        ];

        cellules.forEach((val, index) => {
            const td = document.createElement("td");
            td.textContent = val;
            td.style.padding = "6px";
            td.style.borderBottom = "1px solid #eee";
            td.style.textAlign = [4, 5, 6, 7, 8, 10, 11, 12].includes(index) ? "right" : "left";
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function ouvrirHistoriqueModal() {
    remplirFiltreHistorique();
    rafraichirHistoriqueModal();

    const modal = document.getElementById("fenetreHistorique");
    if (modal) {
        modal.style.display = "flex";
    }
}

function fermerHistoriqueModal() {
    const modal = document.getElementById("fenetreHistorique");
    if (modal) {
        modal.style.display = "none";
    }
}

function echapperCSV(valeur) {
    if (valeur === null || valeur === undefined) return "";
    const texte = String(valeur).replace(/"/g, '""');
    return `"${texte}"`;
}

function exporterHistoriqueCSV() {
    if (!historiqueParties || historiqueParties.length === 0) {
        alert("Historique vide");
        return;
    }

    const lignes = [];
    lignes.push([
        "date",
        "nom",
        "type_niveau",
        "niveau",
        "temps_secondes",
        "temps_mmss",
        "nb_guess",
        "premier_guess_secondes",
        "premier_guess_mmss",
        "chiffres_places",
        "undo",
        "effacements",
        "niveau_solveur",
        "guess_solveur",
        "logic_loops_solveur",
        "branches_solveur",
        "source_analyse_solveur"
    ].join(";"));

    historiqueParties.forEach(p => {
        lignes.push([
            echapperCSV(p.date || ""),
            echapperCSV(p.nom || ""),
            echapperCSV(p.typeNiveau || ""),
            echapperCSV(p.niveau || ""),
            echapperCSV(typeof p.temps === "number" ? p.temps : ""),
            echapperCSV(typeof p.temps === "number" ? formaterTemps(p.temps) : ""),
            echapperCSV(typeof p.nbGuess === "number" ? p.nbGuess : ""),
            echapperCSV(typeof p.premierGuess === "number" ? p.premierGuess : ""),
            echapperCSV(typeof p.premierGuess === "number" ? formaterTemps(p.premierGuess) : ""),
            echapperCSV(typeof p.chiffresPlaces === "number" ? p.chiffresPlaces : ""),
            echapperCSV(typeof p.undo === "number" ? p.undo : ""),
            echapperCSV(typeof p.effacements === "number" ? p.effacements : ""),
            echapperCSV(p.niveauSolveur || ""),
            echapperCSV(typeof p.guessSolveur === "number" ? p.guessSolveur : ""),
            echapperCSV(typeof p.logicLoopsSolveur === "number" ? p.logicLoopsSolveur : ""),
            echapperCSV(typeof p.branchesSolveur === "number" ? p.branchesSolveur : ""),
            echapperCSV(p.sourceAnalyseSolveur || "")
        ].join(";"));
    });

    const contenu = lignes.join("\n");
    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sudoku_historique.csv";
    a.click();

    URL.revokeObjectURL(url);
}