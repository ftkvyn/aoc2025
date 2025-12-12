import { readFileSync } from 'fs';

const main =  () => {
    const input =  readFileSync('./task.txt', 'utf-8');
    let graph = {};
    input.replaceAll('\r', '').split('\n').map(line => {
        const [fromNode, toNodesRaw] = line.split(':').map(s => s.trim());
        const toNodes = toNodesRaw.split(' ');
        graph[fromNode] = toNodes;
    });
    console.log(graph);

    // Expand state space: each node becomes 4 nodes based on (dacVisited, fftVisited)
    // Build a new graph with states (node, dac, fft) and count paths in this expanded graph
    // This allows memoization because state transitions are deterministic
    
    // For counting paths in a graph with cycles, we use DFS with on-stack detection
    // Memoize results for nodes not currently on the recursion stack
    
    const memo = new Map(); // key: "node,dac,fft" -> path count (only when fully computed)
    const onStack = new Set(); // nodes currently being processed
    
    const findPathes = (node, dacState, fftState) => {
        // Update state based on current node
        if (node === 'dac') dacState = 1;
        if (node === 'fft') fftState = 1;
        
        const key = `${node},${dacState},${fftState}`;
        
        // If we're revisiting a node on the current stack, it's a cycle - don't count
        if (onStack.has(key)) return 0;
        
        // Check memo
        if (memo.has(key)) return memo.get(key);
        
        if (node === 'out') {
            return (dacState && fftState) ? 1 : 0;
        }
        if (!graph[node]) return 0;
        
        onStack.add(key);
        let pathes = 0;
        for (const nextNode of graph[node]) {
            pathes += findPathes(nextNode, dacState, fftState);
        }
        onStack.delete(key);
        
        memo.set(key, pathes);
        return pathes;
    };
    
    console.log(findPathes('svr', 0, 0));
}

main();