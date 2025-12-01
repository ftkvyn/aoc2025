import { readFile } from 'fs/promises';

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const lines = input.split('\n');

    let curr = 50;
    let zeros = 0;

    lines.forEach(line => {
        let dir = line[0];
        let count = +line.slice(1);
        let oldCur = curr;
        // if (count > 100) {
        //     zeros += Math.abs(Math.floor(curr / 100));
        //     count = count % 100;
        // }
        // console.log(dir + ' ' + count);
        let steps = dir == "L" ? -count : count;
        // 4932 too low
        // 5941 too low
        // 6225 wrong
        // 6269 wrong
        // 6296 too high
        while (steps != 0) {
            if (dir == "L") {
                curr -= 1;
                steps +=1;
            } else {
                curr += 1;
                steps -= 1;
            }
            if (curr == 0) {
                zeros++;
            } if (curr == 100) {
                zeros++;
                curr = 0;
            } if (curr == -100) {
                zeros++;
                curr = 0;
            }
        }
        
        console.log(`${curr} -> ${zeros}`);
        
        // console.log(curr);
        // if (curr === 0) {
        //     zeros++;
        // }
    });
    console.log("Password");
    console.log(zeros);
}

main();