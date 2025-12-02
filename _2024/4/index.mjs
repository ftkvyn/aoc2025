import { readFile } from 'fs/promises';
const input = await readFile('./task.txt', 'utf-8');
const map = input.replaceAll('\r', '').split('\n');

const word = 'MAS';

const dirs2 = {
    d1: [[-1,-1], [+1,+1]],
    d2: [[-1,+1], [+1,-1]],
    // v1: [[-1,0], [+1,0]],
    // v2: [[0,-1], [0,+1]]
}

const dirs = {
    n: [-1, 0],
    ne: [-1, +1],
    e: [0, +1],
    se: [+1, +1],
    s: [+1, 0],
    sw: [+1, -1],
    w: [0, -1],
    nw: [-1, -1]
};

console.log(map);

// 1830 too high
const findNextLetter = (r, c) => {
    // Check if r,c is 'A' and satisfies X-MAS pattern
    if (map[r][c] !== 'A') return 0;
    
    let count = 0;
    
    // Helper function to check a pair of positions
    const checkPair = (pair) => {
        const [pos1, pos2] = pair;
        const r1 = r + pos1[0];
        const c1 = c + pos1[1];
        const r2 = r + pos2[0];
        const c2 = c + pos2[1];
        
        // Check bounds
        if (!map[r1] || !map[r1][c1] || !map[r2] || !map[r2][c2]) {
            return false;
        }
        
        const char1 = map[r1][c1];
        const char2 = map[r2][c2];
        
        // Check if (M,S) or (S,M)
        return (char1 === 'M' && char2 === 'S') || (char1 === 'S' && char2 === 'M');
    };
    
    // Check diagonal patterns (d1 AND d2)
    const hasDiagonalCross = checkPair(dirs2.d1) && checkPair(dirs2.d2);
    
    // Check vertical patterns (v1 AND v2)
    // const hasVerticalCross = checkPair(dirs2.v1) && checkPair(dirs2.v2);
    
    // Return 1 if any valid cross exists, 0 otherwise
    return (hasDiagonalCross) ? 1 : 0;
}

const main = async () => {
    let words = 0;
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] == 'A') {
                const currWords = findNextLetter(r, c);
                if (currWords > 0) {
                    console.log(r, c, currWords);
                }
                words += currWords;
            }
        }
    }
    console.log(words);
}

main();