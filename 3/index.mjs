import { readFileSync } from 'fs';

let lineMax = -1;

const getNumsRecursive = (line, a, numSoFar, numsToGo) => {
    // let numsToCheck = [];
    for (let b = a + 1; b < line.length - numsToGo; b++) {
        // if (!line[b]) continue;
        const newNum = numSoFar * 10 + +line[b];
        // console.log(newNum);
        if (numsToGo == 0) {
            // numsToCheck.push(newNum);
            if (newNum > lineMax) {
                lineMax = newNum;
            }
        } else {
            getNumsRecursive(line, b, newNum, numsToGo - 1);
            // numsToCheck.push(...underlyingNums);
        }
    }
    return [];
}

const main = () => {
    const input = readFileSync('./task.txt', 'utf-8');
    const lines = input.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0);
    let sum = 0;
    for(let line of lines) {
        // let line = lineStr.split('').map(Number);
        // lineMax = -1;
        // const nums = getNumsRecursive(line, -1, 0, 11);
        let num = 0;
        let maxIndex = -1;
        for (let i = 12; i > 0; i --) {
            const avaliable = line.substring(maxIndex + 1, line.length - i + 1);
            const maxNum = Math.max(...avaliable);
            maxIndex = avaliable.indexOf(maxNum)+maxIndex + 1;
            num = +maxNum + num* 10;
            // console.log(avaliable, maxNum, maxIndex, num);
            // return;
        }
        console.log(num);
        // return

        // const max = Math.max(...nums);
        // console.log(max);
        // return;
        // for (let a = 0; a < line.length - 1; a++) {
        //     for (let b = a + 1; b < line.length; b++) {
        //         const num = +line[a]*10 + +line[b];
        //         if (num > max) {
        //             max = num;
        //         }
        //     }
        // }
        // console.log(lineMax);
        sum += num;
    }
    console.log(sum);
}

main();