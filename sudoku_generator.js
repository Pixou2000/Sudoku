// sudoku_generator.js

const SUDOKU_SIZE = 9;
const SUDOKU_BOX = 3;

function shuffle(array) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function createEmptyGrid() {
    return Array.from({ length: SUDOKU_SIZE }, () =>
        Array(SUDOKU_SIZE).fill(0)
    );
}

function cloneGrid(grid) {
    return grid.map(row => [...row]);
}

function isValidInGrid(grid, row, col, num) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
        if (grid[row][c] === num) return false;
    }

    for (let r = 0; r < SUDOKU_SIZE; r++) {
        if (grid[r][col] === num) return false;
    }

    const startRow = Math.floor(row / SUDOKU_BOX) * SUDOKU_BOX;
    const startCol = Math.floor(col / SUDOKU_BOX) * SUDOKU_BOX;

    for (let r = startRow; r < startRow + SUDOKU_BOX; r++) {
        for (let c = startCol; c < startCol + SUDOKU_BOX; c++) {
            if (grid[r][c] === num) return false;
        }
    }

    return true;
}

function fillGrid(grid) {
    for (let row = 0; row < SUDOKU_SIZE; row++) {
        for (let col = 0; col < SUDOKU_SIZE; col++) {
            if (grid[row][col] === 0) {
                const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

                for (const num of numbers) {
                    if (isValidInGrid(grid, row, col, num)) {
                        grid[row][col] = num;

                        if (fillGrid(grid)) {
                            return true;
                        }

                        grid[row][col] = 0;
                    }
                }

                return false;
            }
        }
    }

    return true;
}

function findEmptyCell(grid) {
    for (let row = 0; row < SUDOKU_SIZE; row++) {
        for (let col = 0; col < SUDOKU_SIZE; col++) {
            if (grid[row][col] === 0) {
                return { row, col };
            }
        }
    }

    return null;
}

/**
 * Compte le nombre de solutions d'une grille.
 * S'arrête dès que le nombre atteint "limit".
 */
function countSolutions(grid, limit = 2) {
    let count = 0;

    function solve() {
        if (count >= limit) return;

        const empty = findEmptyCell(grid);

        if (!empty) {
            count++;
            return;
        }

        const { row, col } = empty;

        for (let num = 1; num <= 9; num++) {
            if (isValidInGrid(grid, row, col, num)) {
                grid[row][col] = num;
                solve();
                grid[row][col] = 0;

                if (count >= limit) return;
            }
        }
    }

    solve();
    return count;
}

/**
 * Retire des cases tout en garantissant une solution unique.
 */
function removeCellsUnique(grid, cellsToRemove) {
    const puzzle = cloneGrid(grid);

    const positions = [];
    for (let row = 0; row < SUDOKU_SIZE; row++) {
        for (let col = 0; col < SUDOKU_SIZE; col++) {
            positions.push({ row, col });
        }
    }

    const shuffledPositions = shuffle(positions);
    let removed = 0;

    for (const pos of shuffledPositions) {
        if (removed >= cellsToRemove) break;

        const { row, col } = pos;
        const backup = puzzle[row][col];

        if (backup === 0) continue;

        puzzle[row][col] = 0;

        const testGrid = cloneGrid(puzzle);
        const nbSolutions = countSolutions(testGrid, 2);

        if (nbSolutions === 1) {
            removed++;
        } else {
            puzzle[row][col] = backup;
        }
    }

    return puzzle;
}

function generateSudokuGrid() {
    const grid = createEmptyGrid();
    fillGrid(grid);
    return grid;
}

/**
 * Génère un sudoku avec solution unique.
 * cellsToRemove est un objectif, pas une garantie absolue :
 * si on ne peut pas retirer plus de cases sans casser l'unicité,
 * la fonction s'arrête avant.
 */
function generateSudoku(cellsToRemove = 40) {
    const solution = generateSudokuGrid();
    const puzzle = removeCellsUnique(solution, cellsToRemove);

    return {
        puzzle: puzzle,
        solution: solution
    };
}