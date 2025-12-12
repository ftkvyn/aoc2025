import { readFileSync } from 'fs';

/**
 * Solve for minimum button presses using linear algebra approach.
 * We have: A * x = b, where:
 *   A = matrix of button effects (rows = positions, cols = buttons)
 *   x = number of times each button is pressed (what we solve for)
 *   b = target joltage values
 * 
 * We need non-negative integer solutions that minimize sum(x).
 */

function parseLine(line) {
    // Parse buttons (0,1) (0,1,2) etc.
    const buttonMatches = line.match(/\(([^)]+)\)/g);
    const buttons = buttonMatches ? 
        buttonMatches.map(match => {
            const numbers = match.slice(1, -1);
            return numbers.split(',').map(num => parseInt(num.trim()));
        }) : [];
    
    // Parse joltage {53,35,33,3}
    const joltageMatch = line.match(/\{([^}]+)\}/);
    const joltage = joltageMatch ? 
        joltageMatch[1].split(',').map(num => parseInt(num.trim())) : [];
    
    return { buttons, joltage };
}

/**
 * Solves Ax = b for non-negative integers x minimizing sum(x).
 * @param {number[][]} buttons List of buttons, each is array of affected indices
 * @param {number[]} targets Target values for each position
 * @returns {number} Minimum total presses, or -1 if no solution
 */
function solve(buttons, targets) {
    const numVars = buttons.length;
    const numEqs = targets.length;

    // Build Augmented Matrix [A | b]
    // A[row][col] is 1 if button col affects position row, else 0
    // Rows are equations (positions), Cols are variables (buttons)
    // We use a fraction-based approach or floating point with epsilon?
    // Given the constraints and nature, float with epsilon should be fine for now,
    // but integers are safer. Let's stick to floats and check for integer proximity.
    // Or better: keep it simple first.
    
    let matrix = [];
    for (let r = 0; r < numEqs; r++) {
        let row = new Array(numVars + 1).fill(0);
        for (let c = 0; c < numVars; c++) {
            if (buttons[c].includes(r)) {
                row[c] = 1;
            }
        }
        row[numVars] = targets[r];
        matrix.push(row);
    }

    // Gaussian Elimination to RREF
    let pivotRow = 0;
    const pivots = new Array(numVars).fill(-1); // maps var index to pivot row
    const freeVars = [];

    for (let col = 0; col < numVars && pivotRow < numEqs; col++) {
        // Find pivot
        let sel = pivotRow;
        while (sel < numEqs && Math.abs(matrix[sel][col]) < 1e-9) {
            sel++;
        }

        if (sel < numEqs) {
            // Swap
            [matrix[pivotRow], matrix[sel]] = [matrix[sel], matrix[pivotRow]];
            
            // Normalize
            const pivotVal = matrix[pivotRow][col];
            for (let j = col; j <= numVars; j++) {
                matrix[pivotRow][j] /= pivotVal;
            }

            // Eliminate other rows
            for (let i = 0; i < numEqs; i++) {
                if (i !== pivotRow) {
                    const factor = matrix[i][col];
                    if (Math.abs(factor) > 1e-9) {
                        for (let j = col; j <= numVars; j++) {
                            matrix[i][j] -= factor * matrix[pivotRow][j];
                        }
                    }
                }
            }
            
            pivots[col] = pivotRow;
            pivotRow++;
        } else {
            freeVars.push(col);
        }
    }
    
    // For any remaining rows (pivotRow to numEqs), the left side is 0.
    // The right side must be 0 for consistency.
    for (let i = pivotRow; i < numEqs; i++) {
        if (Math.abs(matrix[i][numVars]) > 1e-5) {
            return -1; // Inconsistent
        }
    }

    // Now we have the system in RREF.
    // Pivot variables are expressed as: x_p = b' - sum(c_j * x_free)
    // We need to iterate over free variables.
    // If there are too many free variables, this brute force is bad.
    // But usually in AoC there are few degrees of freedom.

    // Collect free variables
    for (let col = 0; col < numVars; col++) {
        if (pivots[col] === -1 && !freeVars.includes(col)) {
            // Should have been added above, but just in case
            freeVars.push(col);
        }
    }

    // Helper to check if a solution is valid (non-negative integers)
    // and returns its sum.
    const checkSolution = (assignment) => {
        let sum = 0;
        for (let x of assignment) {
            if (x < -1e-9 || Math.abs(x - Math.round(x)) > 1e-5) return Infinity;
            sum += Math.round(x);
        }
        return sum;
    };

    let minTotal = Infinity;

    // Recursive search for free variables
    // We need to bound the free variables.
    // A naive bound is min(targets) if the button contributes positively?
    // Actually, x_j <= targets[i] for all i where A[i][j] > 0.
    // Let's compute bounds for free vars.
    const bounds = freeVars.map(v => {
        let minB = Infinity;
        for (let r = 0; r < numEqs; r++) {
            // If this button v contributes to row r (A[r][v] == 1 in original matrix, but we have RREF now)
            // Wait, we should look at original constraints for bounds.
            if (buttons[v].includes(r)) {
                minB = Math.min(minB, targets[r]);
            }
        }
        return minB === Infinity ? 100 : minB; // Fallback if button does nothing (useless button)
    });

    const currentAssignment = new Array(numVars).fill(0);

    const search = (freeIdx) => {
        if (freeIdx === freeVars.length) {
            // Calculate pivot variables based on free variables
            // Start with RHS
            let valid = true;
            let currentSum = 0;

            // Compute pivots
            // For each pivot column p, find its row r = pivots[p]
            // x_p = matrix[r][numVars] - sum(matrix[r][f] * x_f for f in freeVars)
            
            for (let v = 0; v < numVars; v++) {
                if (pivots[v] !== -1) {
                    const r = pivots[v];
                    let val = matrix[r][numVars];
                    for (const f of freeVars) {
                        val -= matrix[r][f] * currentAssignment[f];
                    }
                    
                    // Check non-negativity and integrality
                    if (val < -1e-5 || Math.abs(val - Math.round(val)) > 1e-5) {
                        valid = false;
                        break;
                    }
                    currentAssignment[v] = Math.round(val);
                }
                currentSum += currentAssignment[v];
            }

            if (valid) {
                if (currentSum < minTotal) {
                    minTotal = currentSum;
                }
            }
            return;
        }

        const v = freeVars[freeIdx];
        const maxVal = bounds[freeIdx];
        
        // Heuristic: try small values first? Or just iterate.
        // Bounds can be up to ~200. If we have multiple free vars, this is slow.
        // But let's hope we have 0 or 1 or 2 free vars.
        for (let val = 0; val <= maxVal; val++) {
            currentAssignment[v] = val;
            
            // Optimization: Check if partial sum already exceeds minTotal
            // (Only works if we strictly increase sum, which we do)
            if (currentAssignment.reduce((a,c, i) => (freeVars.slice(0, freeIdx+1).includes(i) ? a+c : a), 0) >= minTotal) {
                 break;
            }

            // Pruning: Check if any pivot becomes negative determined solely by this and previous free vars?
            // Pivots depend on ALL free vars where coeff != 0.
            // If a pivot depends only on this and previous free vars, we can check.
            // But matrix is RREF, so pivots might depend on later free vars too.
            // However, typically in RREF, pivot i depends on free vars > i.
            // So if we iterate free vars in order, earlier pivots might NOT be fully determined.
            // Actually, if we order loops by free variable index (descending?), maybe?
            // Let's stick to simple recursion first.

            search(freeIdx + 1);
        }
    };

    search(0);

    return minTotal === Infinity ? -1 : minTotal;
}

const main = () => {
    const input = readFileSync('./task.txt', 'utf-8');
    const lines = input.replace(/\r/g, '').split('\n').filter(l => l.trim());
    
    let totalSum = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const { buttons, joltage } = parseLine(lines[i]);
        const minPresses = solve(buttons, joltage);
        
        if (minPresses < 0) {
            console.log(`Line ${i + 1}: No solution found`);
        } else {
            console.log(`Line ${i + 1}: ${minPresses}`);
            totalSum += minPresses;
        }
    }
    
    console.log(`\nTotal: ${totalSum}`);
};

main();