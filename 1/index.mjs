import { readFile } from 'fs/promises';

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const lines = input.split('\n');

    let curr = 50;
    let zeros = 0;

    lines.forEach(line => {
        let dir = line[0];
        let count = +line.slice(1);
        // if (count > 100) {
        //     zeros += Math.abs(Math.floor(curr / 100));
        //     count = count % 100;
        // }
        // console.log(dir + ' ' + count);
        if (dir == "L") {
            curr = curr - count;
            // if (curr < 0) {
            //     zeros ++;
            // }
        }
        // 4932 too low
        // 5941 too low
        // 6296 too high
        if (dir == "R") {
            curr = curr + count;
        }
        zeros += Math.abs(Math.floor(curr / 100));
        console.log(dir + ' ' + count + ' ==>> ' + curr);
        
        curr = (curr + 100) % 100;

        // console.log(curr);
        // if (curr === 0) {
        //     zeros++;
        // }
    });
    console.log("Password");
    console.log(zeros);
}

main();