import { readFile } from 'fs/promises';

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const lines = input.split('\n');
    let isSecond = false;
    let conditions = {};
    let updates = [];
    for(let line of lines) {
        if (line.trim() == '') {
            isSecond = true;
            continue;
        }
        if (!isSecond) {
            console.log(line);
            let [before, after] = line.split('|').map(Number);
            if (after in conditions) {
                conditions[after].push(before);
            } else {
                conditions[after] = [before];
            }
        } else {
            updates.push(line.split(',').map(Number));
        }
    }
    console.log(conditions);
    console.log(updates);

    // Custom comparator based on ordering rules
    const comparePages = (a, b) => {
        // If a must come before b
        if (b in conditions && conditions[b].includes(a)) {
            return -1;
        }
        // If b must come before a
        if (a in conditions && conditions[a].includes(b)) {
            return 1;
        }
        return 0;
    };

    let sum = 0;
    for(let update of updates) {
        let isUpdateGood = true;
        for(let page of update) {
            if (page in conditions) {
                const mustBeBefore = conditions[page];
                for(let before of mustBeBefore) {
                    if (update.indexOf(before) > update.indexOf(page)) {
                        isUpdateGood = false;
                        break;
                    }
                }
            }
            if (!isUpdateGood) break;
        }
        
        if (!isUpdateGood) {
            // Fix the incorrect update by sorting
            const fixedUpdate = [...update].sort(comparePages);
            console.log('Fixed:', fixedUpdate);
            sum += fixedUpdate[Math.floor(fixedUpdate.length/2)];
        }
    }
    console.log(sum);
}

main();