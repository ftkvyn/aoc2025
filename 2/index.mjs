import { readFile } from 'fs/promises';

const isRepetetion = (val) => {
    val = '' + val;
    // Try substring lengths from 1 to val.length/2
    for (let len = 1; len <= Math.floor(val.length / 2); len++) {
        // Only check if the length divides evenly
        if (val.length % len === 0) {
            const substring = val.substring(0, len);
            const repeated = substring.repeat(val.length / len);
            if (repeated === val) {
                return true;
            }
        }
    }
    return false;
}

const isRepetetionTwice = (val) => {
    val = '' + val;
    let len = val.length / 2;
    const substring = val.substring(0, len);
    const repeated = substring + substring;
    if (repeated === val) {
        return true;
    }
    return false;
}

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const ranges = input.split(',');
    let sum = 0;
    for (let range of ranges) {
        const splt = range.split('-');
        const from = +splt[0];
        const to = +splt[1];
        for (let i = from; i <= to; i++) {
            if (isRepetetion(i)) {
                console.log(i);
                sum += i;
            }
        }
    }
    console.log(sum);
}

main();