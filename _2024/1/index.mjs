import { readFile } from 'fs/promises';

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const lines = input.split('\n');
    let a = [], b = [];
    lines.forEach(line => {
        let nums = line.split('   ');
        a.push(+nums[0]);b.push(+nums[1]);
    });
    // a = a.sort();
    // b = b.sort();
    let score = 0;
    // console.log(a);
    // console.log(b);
    for (let i = 0; i < a.length; i++) {
        // diff += Math.abs(a[i]-b[i]);
        let count = b.filter(bi => bi == a[i]).length;
        score += a[i] * count;
    }
    console.log(score);
}

main();