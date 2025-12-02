import { readFile } from 'fs/promises';

const isSafe = (row) => {
    let isUp = row[0] < row[1];

    for (let i=1; i<row.length; i++) {
        if (row[i-1] == row[i]) {
            return false;
        }
        if (Math.abs(row[i-1] - row[i]) > 3) {
            return false;
        }
        if (isUp && row[i-1] > row[i]) {
            return false;
        }
        if (!isUp && row[i-1] < row[i]) {
            return false;
        }
    }
    return true;
}

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const lines = input.split('\n');
    // let map = [];
    let safes = 0;
    lines.forEach(line => {
        let n = 2;
        let row = line.split(' ').map(t => +t);
        // map.push(row);
        if (isSafe(row)) {
            console.log(row);
            safes++;
        }
        else {
            for (let i = 0; i < row.length; i++) {
                const subRow = row.filter((_, k) => k !== i);
                if (isSafe(subRow)) {
                    console.log(row);
                    safes++;
                    break;
                }
            }
        }
    });
    console.log(safes);
}

main();