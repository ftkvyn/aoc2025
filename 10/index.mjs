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
 * Build the effect matrix: A[i][j] = 1 if button j affects position i
 */
function buildEffectMatrix(buttons, numPositions) {
    return Array.from({ length: numPositions }, (_, pos) =>
        buttons.map(btn => btn.includes(pos) ? 1 : 0)
    );
}

/**
 * Solve by trying all button orderings with greedy, then pick best.
 * For large problems, use iterative deepening.
 */
function solveMinPresses(buttons, target) {
    const n = target.length;
    const m = buttons.length;
    const effect = buildEffectMatrix(buttons, n);
    
    // Try greedy with different button orderings
    let bestResult = Infinity;
    
    // Strategy 1: Original order
    const r1 = tryGreedy(buttons, target, effect, n, m, Array.from({length: m}, (_, i) => i));
    if (r1 !== null) bestResult = Math.min(bestResult, r1);
    
    // Strategy 2: Order by number of positions affected (descending)
    const order2 = Array.from({length: m}, (_, i) => i).sort((a, b) => buttons[b].length - buttons[a].length);
    const r2 = tryGreedy(buttons, target, effect, n, m, order2);
    if (r2 !== null) bestResult = Math.min(bestResult, r2);
    
    // Strategy 3: Order by number of positions affected (ascending)
    const order3 = Array.from({length: m}, (_, i) => i).sort((a, b) => buttons[a].length - buttons[b].length);
    const r3 = tryGreedy(buttons, target, effect, n, m, order3);
    if (r3 !== null) bestResult = Math.min(bestResult, r3);
    
    // Strategy 4: Incremental greedy
    const r4 = tryIncrementalGreedy(buttons, target, effect, n, m);
    if (r4 !== null) bestResult = Math.min(bestResult, r4);
    
    // Strategy 5: Random shuffle attempts
    for (let attempt = 0; attempt < 50; attempt++) {
        const order = Array.from({length: m}, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        const r = tryGreedy(buttons, target, effect, n, m, order);
        if (r !== null) bestResult = Math.min(bestResult, r);
    }
    
    // If greedy found something, try to improve with local search
    if (bestResult < Infinity) {
        // Try branch and bound with tight upper bound
        const improved = boundedSearch(buttons, target, effect, n, m, bestResult);
        if (improved !== null) bestResult = improved;
    } else {
        // No greedy solution, try hybrid approach: partial greedy + exhaustive
        const hybrid = tryHybridSearch(buttons, target, effect, n, m);
        if (hybrid !== null) bestResult = Math.min(bestResult, hybrid);
    }
    
    return bestResult === Infinity ? -1 : bestResult;
}

/**
 * Greedy solver with specific button ordering
 */
function tryGreedy(buttons, target, effect, n, m, buttonOrder) {
    const remaining = [...target];
    let total = 0;
    
    let changed = true;
    while (changed && remaining.some(v => v > 0)) {
        changed = false;
        
        for (const btn of buttonOrder) {
            let maxP = Infinity;
            for (let pos = 0; pos < n; pos++) {
                if (effect[pos][btn] === 1) {
                    maxP = Math.min(maxP, remaining[pos]);
                }
            }
            if (maxP <= 0 || maxP === Infinity) continue;
            
            for (let pos = 0; pos < n; pos++) {
                remaining[pos] -= effect[pos][btn] * maxP;
            }
            total += maxP;
            changed = true;
            break; // Restart with first button in order
        }
    }
    
    return remaining.every(v => v === 0) ? total : null;
}

/**
 * Incremental greedy - press one button at a time, choosing best each step
 */
function tryIncrementalGreedy(buttons, target, effect, n, m) {
    const remaining = [...target];
    let total = 0;
    
    while (remaining.some(v => v > 0)) {
        let bestBtn = -1;
        let bestScore = -Infinity;
        
        for (let btn = 0; btn < m; btn++) {
            // Can we press this button at least once?
            let canPress = true;
            for (let pos = 0; pos < n; pos++) {
                if (effect[pos][btn] === 1 && remaining[pos] <= 0) {
                    canPress = false;
                    break;
                }
            }
            if (!canPress) continue;
            
            // Score: prefer buttons that reduce positions with unique coverage
            let score = 0;
            for (let pos = 0; pos < n; pos++) {
                if (effect[pos][btn] === 1 && remaining[pos] > 0) {
                    // Count how many other buttons can reduce this position
                    let alternatives = 0;
                    for (let b2 = 0; b2 < m; b2++) {
                        if (b2 !== btn && effect[pos][b2] === 1) {
                            let canPressB2 = true;
                            for (let p2 = 0; p2 < n; p2++) {
                                if (effect[p2][b2] === 1 && remaining[p2] <= 0) {
                                    canPressB2 = false;
                                    break;
                                }
                            }
                            if (canPressB2) alternatives++;
                        }
                    }
                    // Higher score for positions with fewer alternatives
                    score += 10 / (alternatives + 1);
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestBtn = btn;
            }
        }
        
        if (bestBtn === -1) break;
        
        // Press the best button as many times as possible
        let maxP = Infinity;
        for (let pos = 0; pos < n; pos++) {
            if (effect[pos][bestBtn] === 1) {
                maxP = Math.min(maxP, remaining[pos]);
            }
        }
        
        for (let pos = 0; pos < n; pos++) {
            remaining[pos] -= effect[pos][bestBtn] * maxP;
        }
        total += maxP;
    }
    
    return remaining.every(v => v === 0) ? total : null;
}

/**
 * Branch and bound with upper bound
 */
function boundedSearch(buttons, target, effect, n, m, upperBound) {
    let bestSum = upperBound;
    
    function search(btnIdx, remaining, currentSum) {
        if (currentSum >= bestSum) return;
        if (remaining.some(v => v < 0)) return;
        
        if (remaining.every(v => v === 0)) {
            bestSum = currentSum;
            return;
        }
        
        if (btnIdx === m) return;
        
        // Lower bound
        let lb = 0;
        for (let pos = 0; pos < n; pos++) {
            if (remaining[pos] > 0) {
                let canAffect = 0;
                for (let b = btnIdx; b < m; b++) {
                    if (effect[pos][b] === 1) canAffect++;
                }
                if (canAffect === 0) return;
                lb = Math.max(lb, Math.ceil(remaining[pos] / canAffect));
            }
        }
        if (currentSum + lb >= bestSum) return;
        
        let maxP = Infinity;
        for (let pos = 0; pos < n; pos++) {
            if (effect[pos][btnIdx] === 1) {
                maxP = Math.min(maxP, remaining[pos]);
            }
        }
        if (maxP === Infinity) maxP = 0;
        
        for (let p = maxP; p >= 0; p--) {
            const newRem = remaining.map((v, pos) => v - effect[pos][btnIdx] * p);
            search(btnIdx + 1, newRem, currentSum + p);
        }
    }
    
    search(0, [...target], 0);
    return bestSum < upperBound ? bestSum : null;
}

/**
 * Hybrid: try partial greedy reductions then exhaustive on remainder
 */
function tryHybridSearch(buttons, target, effect, n, m) {
    let bestResult = Infinity;
    const maxVal = Math.max(...target);
    const maxDepth = maxVal > 200 ? 5 : 4;
    
    // Try reducing each button by different amounts, then solve remainder
    function tryPartial(remaining, usedPresses, depth, lastBtn) {
        if (depth > maxDepth) return;
        if (usedPresses >= bestResult) return;
        
        const maxRemaining = Math.max(...remaining);
        
        // If small enough, try exhaustive
        if (maxRemaining <= 50) {
            const result = boundedSearch(buttons, remaining, effect, n, m, bestResult - usedPresses);
            if (result !== null && usedPresses + result < bestResult) {
                bestResult = usedPresses + result;
            }
            return;
        }
        
        // Try pressing each button some amount (start from lastBtn to avoid duplicates)
        for (let btn = 0; btn < m; btn++) {
            let maxP = Infinity;
            for (let pos = 0; pos < n; pos++) {
                if (effect[pos][btn] === 1) {
                    maxP = Math.min(maxP, remaining[pos]);
                }
            }
            if (maxP === Infinity || maxP <= 0) continue;
            
            // Try pressing this button maxP times
            const newRem = remaining.map((v, pos) => v - effect[pos][btn] * maxP);
            tryPartial(newRem, usedPresses + maxP, depth + 1, btn);
            
            // Also try pressing 3/4, 1/2, 1/4 as many times
            for (const frac of [0.75, 0.5, 0.25]) {
                const fracP = Math.floor(maxP * frac);
                if (fracP > 0 && fracP !== maxP) {
                    const newRem2 = remaining.map((v, pos) => v - effect[pos][btn] * fracP);
                    tryPartial(newRem2, usedPresses + fracP, depth + 1, btn);
                }
            }
        }
    }
    
    tryPartial([...target], 0, 0, 0);
    
    return bestResult === Infinity ? null : bestResult;
}

/**
 * Optimized solver using Gaussian elimination to reduce the problem.
 * Finds a particular solution, then optimizes.
 */
function solveWithGaussian(buttons, target) {
    const n = target.length;  // number of positions (equations)
    const m = buttons.length; // number of buttons (variables)
    
    // Build augmented matrix [A | b]
    // A[i][j] = 1 if button j affects position i
    const matrix = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(buttons[j].includes(i) ? 1 : 0);
        }
        row.push(target[i]); // augmented column
        matrix.push(row);
    }
    
    // Gaussian elimination to find row echelon form
    let pivotRow = 0;
    const pivotCols = [];
    
    for (let col = 0; col < m && pivotRow < n; col++) {
        // Find pivot
        let maxRow = pivotRow;
        for (let row = pivotRow + 1; row < n; row++) {
            if (Math.abs(matrix[row][col]) > Math.abs(matrix[maxRow][col])) {
                maxRow = row;
            }
        }
        
        if (matrix[maxRow][col] === 0) continue;
        
        // Swap rows
        [matrix[pivotRow], matrix[maxRow]] = [matrix[maxRow], matrix[pivotRow]];
        pivotCols.push(col);
        
        // Eliminate below
        for (let row = pivotRow + 1; row < n; row++) {
            if (matrix[row][col] !== 0) {
                const factor = matrix[row][col] / matrix[pivotRow][col];
                for (let c = col; c <= m; c++) {
                    matrix[row][c] -= factor * matrix[pivotRow][c];
                }
            }
        }
        pivotRow++;
    }
    
    // Check for inconsistency (row with all zeros except last column)
    for (let row = pivotRow; row < n; row++) {
        if (Math.abs(matrix[row][m]) > 1e-9) {
            return -1; // No solution
        }
    }
    
    // Back substitution to find a particular solution
    // Free variables (non-pivot columns) will be determined by optimization
    const freeVars = [];
    for (let col = 0; col < m; col++) {
        if (!pivotCols.includes(col)) {
            freeVars.push(col);
        }
    }
    
    // If no free variables, we have a unique solution
    if (freeVars.length === 0) {
        const solution = new Array(m).fill(0);
        for (let i = pivotCols.length - 1; i >= 0; i--) {
            const col = pivotCols[i];
            let val = matrix[i][m];
            for (let j = col + 1; j < m; j++) {
                val -= matrix[i][j] * solution[j];
            }
            solution[col] = val / matrix[i][col];
            if (solution[col] < -1e-9 || Math.abs(solution[col] - Math.round(solution[col])) > 1e-9) {
                return -1; // Non-integer or negative solution
            }
            solution[col] = Math.round(solution[col]);
        }
        if (solution.some(x => x < 0)) return -1;
        return solution.reduce((a, b) => a + b, 0);
    }
    
    // With free variables, we need to search for optimal non-negative integer solution
    // Use branch and bound on free variables
    const maxFreeVal = Math.max(...target);
    
    let bestSum = Infinity;
    
    function tryFreeVars(idx, freeValues) {
        if (idx === freeVars.length) {
            // Compute pivot variables from free variables
            const solution = new Array(m).fill(0);
            for (let i = 0; i < freeVars.length; i++) {
                solution[freeVars[i]] = freeValues[i];
            }
            
            // Back substitution
            for (let i = pivotCols.length - 1; i >= 0; i--) {
                const col = pivotCols[i];
                let val = matrix[i][m];
                for (let j = col + 1; j < m; j++) {
                    val -= matrix[i][j] * solution[j];
                }
                val = val / matrix[i][col];
                if (val < -1e-9 || Math.abs(val - Math.round(val)) > 1e-9) {
                    return; // Invalid
                }
                solution[col] = Math.round(val);
            }
            
            if (solution.some(x => x < 0)) return;
            
            const sum = solution.reduce((a, b) => a + b, 0);
            if (sum < bestSum) {
                bestSum = sum;
            }
            return;
        }
        
        // Pruning: current sum of free vars
        const currentFreeSum = freeValues.reduce((a, b) => a + b, 0);
        if (currentFreeSum >= bestSum) return;
        
        // Try values for this free variable
        for (let v = 0; v <= maxFreeVal; v++) {
            freeValues[idx] = v;
            tryFreeVars(idx + 1, freeValues);
        }
    }
    
    // If too many free variables, fall back to direct search
    if (freeVars.length > 4) {
        return solveMinPresses(buttons, target);
    }
    
    tryFreeVars(0, new Array(freeVars.length).fill(0));
    
    return bestSum === Infinity ? -1 : bestSum;
}

/**
 * Main solver: tries Gaussian first, falls back to branch & bound
 */
function solve(buttons, target) {
    // Try Gaussian elimination approach first
    let result = solveWithGaussian(buttons, target);
    if (result >= 0) return result;
    
    // Fall back to branch and bound
    return solveMinPresses(buttons, target);
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