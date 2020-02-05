import {indent} from "src/base/Util.js";
import {seq} from "src/base/Seq.js";
import {GraphPiece, Matchable} from "src/matching/GraphPiece.js";

class Matching extends GraphPiece {
    /**
     * @param {!Matchable} n1
     * @param {!Matchable} n2
     */
    constructor(n1, n2) {
        if (!(n1 instanceof Matchable)) {
            throw new Error(`Not a Matchable: ${n1}`)
        }
        if (!(n2 instanceof Matchable)) {
            throw new Error(`Not a Matchable: ${n2}`)
        }
        super();
        this.n1 = n1;
        this.n2 = n2;
    }

    allReweightedNodes() {
        return [...this.n1.allReweightedNodes(), ...this.n2.allReweightedNodes()];
    }

    center() {
        this.n1.center();
    }

    afterGrowing(dt) {
        return this;
    }

    nodesWithGrowthRate() {
        let nodes = [...this.n1.nodesWithGrowthRate(), ...this.n2.nodesWithGrowthRate()];
        return nodes.map(e => ({node: e.node, rate: 0}));
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this.n1.draw(ctx, '#0F0');
        this.n2.draw(ctx, '#0F0');
        let n1 = seq(this.n1.allReweightedNodes()).minBy(e => this.n2.timeUntilCollision(e, true));
        let n2 = seq(this.n2.allReweightedNodes()).minBy(e => n1.timeUntilCollision(e, true));
        let c1 = n1.center();
        let c2 = n2.center();
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
    }

    toString() {
        return [
            'Matching(',
            indent(this.n1).trimEnd() + ',',
            indent(this.n2).trimEnd() + ',',
            ')'
        ].join('\n');
    }

    isEqualTo(other) {
        if (!(other instanceof Matching)) {
            return false;
        }
        if (other.n1.isEqualTo(this.n1) && other.n2.isEqualTo(this.n2)) {
            return true;
        }
        return other.n2.isEqualTo(this.n1) && other.n1.isEqualTo(this.n2);
    }
}

export {Matching}
