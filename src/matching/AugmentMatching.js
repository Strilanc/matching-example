import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {toStringAsFunctionCall, indent} from "src/base/Util.js";
import {Matching} from "src/matching/Matching.js";

/**
 * @param {!Array.<![!Point, !Point]>} matches
 * @returns {!{nodes: !Array.<!Point>, edges: !Array.<!{u: !Point, v: !Point, w: !number}>}}
 */
function improvedMatching(matches) {
    let graph = matchingToCostGraph(matches);
    let negCycle = findNegCycle(graph.nodes, graph.edges);
    if (negCycle === undefined) {
        return undefined;
    }
    let n = negCycle
    for (let n of negCycle) {

    }
}

/**
 * @param {!Array.<![!Point, !Point]>} matches
 * @returns {!{nodes: !Array.<!Point>, edges: !Array.<!{u: !Point, v: !Point, w: !number}>}}
 */
function matchingToCostGraph(matches) {
    let nodes = [];
    for (let [a, b] of matches) {
        nodes.push(a, b);
    }

    let edges = [];
    for (let i = 0; i < matches.length; i++) {
        for (let m = 0; m < 2; m++) {
            let dst = matches[i][m];
            let partner = matches[i][(m + 1) & 1];
            let bonus = dst.distanceTo(partner);
            for (let j = i + 1; i < matches.length; i++) {
                for (let src of matches[j]) {
                    edges.push({u: src, v: dst, w: src.distanceTo(partner) - bonus});
                }
            }
        }
    }

    return {nodes, edges};
}

/**
 * @param {!Array.<T>} vertices
 * @param {!Array.<{u: T, v: T, w: !number}>} edges
 * @returns {undefined|!Array.<T>}
 * @template T
 */
function findNegCycle(vertices, edges) {
    let distance = new Map();
    let predecessor = new Map();
    for (let v of vertices) {
        distance.set(v, Number.POSITIVE_INFINITY);
        predecessor.set(v, undefined);
    }
    distance.set(vertices[0], 0);

    for (let i = 1; i < vertices.length; i++) {
        for (let {u, v, w} of edges) {
            if (distance.get(u) + w < distance.get(v)) {
                distance.set(v, distance.get(u) + w);
                predecessor.set(v, u);
            }
        }
    }

    let nodeInCycle = undefined;
    for (let {u, v, w} of edges) {
        if (distance.get(u) + w < distance.get(v)) {
            nodeInCycle = u;
            break;
        }
    }
    if (nodeInCycle === undefined) {
        return undefined;
    }

    // Get out of the tail and into the loop.
    let seen = new Set();
    while (!seen.has(nodeInCycle)) {
        seen.add(nodeInCycle);
        nodeInCycle = predecessor.get(nodeInCycle);
    }

    let result = [nodeInCycle];
    for (let n = predecessor.get(nodeInCycle); n !== nodeInCycle; n = predecessor.get(n)) {
        result.push(n);
    }
    return result.reverse();
}
