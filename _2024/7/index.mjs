import { readFileSync } from 'fs';

const main = () => {
    const input = readFileSync('./task.txt', 'utf-8');
    const lines = input.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0);
    
    let totalCalibration = 0;
    
    for(let line of lines) {
        let [before, after] = line.split(':');
        const target = Number(before);
        const numbers = after.trim().split(' ').map(Number);
        
        // Try all operator combinations (now 3 operators: +, *, ||)
        const numOperators = numbers.length - 1;
        const totalCombinations = Math.pow(3, numOperators);
        
        let found = false;
        for(let combo = 0; combo < totalCombinations; combo++) {
            // Evaluate left-to-right with this operator combination
            let result = numbers[0];
            
            // Convert combo to base-3 to get operator at each position
            let comboValue = combo;
            for(let i = 0; i < numOperators; i++) {
                const operator = comboValue % 3;
                comboValue = Math.floor(comboValue / 3);
                
                if (operator === 0) {
                    // Addition
                    result += numbers[i + 1];
                } else if (operator === 1) {
                    // Multiplication
                    result *= numbers[i + 1];
                } else {
                    // Concatenation (||)
                    result = Number(String(result) + String(numbers[i + 1]));
                }
            }
            
            if (result === target) {
                console.log(`${target}: ${numbers.join(' ')} - Found!`);
                totalCalibration += target;
                found = true;
                break;
            }
        }
        
        if (!found) {
            console.log(`${target}: ${numbers.join(' ')} - No solution`);
        }
    }
    
    console.log(`\nTotal calibration result: ${totalCalibration}`);
}

main();