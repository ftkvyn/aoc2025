import { readFileSync } from 'fs';

const main = () => {
    const input = readFileSync('./task.txt', 'utf-8');
    const lines = input.replace(/\r/g, '').split('\n');
    const map = lines.map(line => {
        return line.split('').map(char => char == '@' ? 1 : 0);
    });
    // console.log(map);
    const isFree = (x,y) => {
        if (x == -1 || y == -1) return true;
        if (!map[x]) return true;
        if (!map[x][y]) return true;
        return false;
    }
    let count = 0;
    const onePass = () => {
        let toFree = [];
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map.length; j++) {
                let takenTiles = 0;
                if (!map[i][j]) continue;
                if (!isFree(i-1,j-1)) takenTiles++;
                if (!isFree(i-1,j)) takenTiles++;
                if (!isFree(i-1,j+1)) takenTiles++;
                if (!isFree(i,j-1)) takenTiles++;
                if (!isFree(i,j+1)) takenTiles++;
                if (!isFree(i+1,j-1)) takenTiles++;
                if (!isFree(i+1,j)) takenTiles++;
                if (!isFree(i+1,j+1)) takenTiles++;
                if (takenTiles < 4) {
                    // count ++;
                    toFree.push([i,j]);
                    // lines[i][j] = 'o';
                    // console.log(i,j);
                }
            }
        }
        for (let pair of toFree) {
            map[pair[0]][pair[1]] = 0;
        }
        console.log(toFree.length);
        count += toFree.length;
        return toFree.length;
    }
    while (onePass());
    
    console.log(count);
}

main();