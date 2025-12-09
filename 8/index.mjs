import { readFile } from 'fs/promises';

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const poses = input.replaceAll('\r', '').split('\n').map(ln => ln.split(',').map(Number));
    let cirquits = poses.map((_, i) => [i]);
    let pairs = [];
    let dists = [];
    // console.log(poses);

    let min = Infinity, minI = -1, minK = -1;
    for (let i = 0; i < poses.length - 1; i++) {
        console.log("Calculating... " + i);
        for( let k = i + 1; k < poses.length; k++) {
            if (pairs.find(p => p.includes(i) && p.includes(k))) {
                continue;
            }
            const a = poses[i], b = poses[k];
            const dist = Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
            dists.push([i,k,dist]);
            if (dist < min) {
                min = dist;
                minI = i;
                minK = k;
            }
        }
    }

    dists = dists.sort((a,b) => a[2] - b[2]);

    let closest = () => {
        let min = Infinity, minI = -1, minK = -1;
        for (let i = 0; i < poses.length - 1; i++) {
            console.log('checking ' + i);
            for( let k = i + 1; k < poses.length; k++) {
                if (pairs.find(p => p.includes(i) && p.includes(k))) {
                    console.log('skipping ' + i + ' ' + k);
                    continue;
                }
                const dist = dists.find(d => d[0] == i && d[1] == k)[2];
                if (dist < min) {
                    min = dist;
                    minI = i;
                    minK = k;
                }
            }
        }
        return [minI, minK];
    }

    let joinCirquit = (i,k) => {
        if (cirquits.find(c => c.includes(i) && c.includes(k))) {
            // do nothing
            return;
        }
        const c_i = cirquits.find(c => c.includes(i));
        const c_k = cirquits.find(c => c.includes(k));
        cirquits.splice(cirquits.indexOf(c_k), 1);
        c_i.push(...c_k);
    }

    
    
    // for (let p = 0; p < poses.length; p++) {
    let last = [];
    let p = 0;
    while(cirquits.length > 1){
        // console.log('processing... ' + p);
        const [i,k] = dists[p++];
        last = [i,k]
        pairs.push([i,k]);
        joinCirquit(i,k);    
    }
    // const sorted = cirquits.sort((a,b) => b.length - a.length);
    // console.log(sorted);
    // console.log(sorted[0].length * sorted[1].length * sorted[2].length);
    const [i,k] = last;
    console.log(poses[i],poses[k]);
    console.log(poses[i][0]*poses[k][0]);
}

main();