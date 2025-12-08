import { readFile } from 'fs/promises';

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const lines = input.split('\n');
    let isSecond = false;
    let ranges = [];
    let ids = [];
    for(let line of lines) {
        if (line.trim() == '') {
            isSecond = true;
            continue;
        }
        if (!isSecond) {
            let range = line.split('-').map(Number);
            ranges.push(range);
        } else {
            ids.push(Number(line));
        }
    }
    
    // let sum = 0;
    // for(let id of ids) {
    //     for (let range of ranges) {
    //         if (id >= range[0] && id <= range[1]) {
    //             sum++;
    //             break;
    //         }
    //     }
    // }
    // console.log(sum);
    let allIds = [];let sum = 0;
    ranges = ranges.sort((a, b) => a[0] - b[0]);
    let condensed = [];
    for (let i = 0; i < ranges.length; i++) {
        let range = ranges[i];
        if (! range) continue;
        for (let k = 1; k + i < ranges.length; k++) {
            let nextRange = ranges[i + k];
            if (nextRange && nextRange[0] <= range[1] + 1) {
                range[1] = Math.max(range[1], nextRange[1]);
                ranges[i + k] = null;
            }
        } 
        condensed.push(range);
    }
    ranges = condensed;
    for(let range of ranges) {
        console.log(range);
        sum += range[1] - range[0] + 1;
    }
    console.log(sum);
}

main();