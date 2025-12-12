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