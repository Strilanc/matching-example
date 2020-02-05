import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {indent} from "src/base/Util.js";

/**
 * A node or blossom collapsed into a node.
 */
class GraphPiece {

    /**
     * @returns {!Array.<!Point>}
     */
    allReweightedNodes() {
        throw new Error('not implemented');
    }

    /**
     * @returns {!Point}
     */
    center() {
        throw new Error('not implemented');
    }

    /**
     * @param {!number} dt
     * @returns {!GraphPiece}
     */
    afterGrowing(dt) {
        throw new Error('not implemented');
    }

    /**
     * @returns {!Array.<!{node: !Node, rate: !number}>}
     */
    nodesWithGrowthRate() {
        throw new Error('not implemented');
    }

    _validatedNodesWithGrowthRate() {
        let result = this.nodesWithGrowthRate();
        for (let {node, rate} of result) {
            if (node === undefined || node.constructor.name !== 'Node' || rate === undefined) {
                throw new Error(`Bad nodesWithGrowthRate from ${this}: ${result}`);
            }
        }
        return result;
    }

    /**
     * @param {!GraphPiece} other
     * @param {!boolean=} ignoreRate
     * @returns {!number}
     */
    timeUntilCollision(other, ignoreRate=false) {
        let nodeRates1 = this._validatedNodesWithGrowthRate();
        let nodeRates2 = other._validatedNodesWithGrowthRate();
        let bestDist = Number.POSITIVE_INFINITY;
        for (let {node: n1, rate: r1} of nodeRates1) {
            for (let {node: n2, rate: r2} of nodeRates2) {
                let r = ignoreRate ? 1 : r1 + r2;
                if (r > 0) {
                    let d = n1.pos.distanceTo(n2.pos) - n1.weight - n2.weight;
                    d /= r;
                    bestDist = Math.min(d, bestDist);
                }
            }
        }
        return bestDist;
    }

    /**
     * @param {*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        throw new Error('not implemented');
    }
}

/**
 * A detection event or blossom.
 */
class Matchable extends GraphPiece {
}

export {GraphPiece, Matchable}
