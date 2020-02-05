/**
 * Alternating tree node.
 */
import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {indent, toStringAsFunctionCall} from "src/base/Util.js";
import {GraphPiece, Matchable} from "src/matching/GraphPiece.js";
import {Blossom} from "src/matching/Blossom.js";
import {Node} from "src/matching/Node.js";
import {equate_Iterables} from "src/base/Equate.js";
import {Matching} from "src/matching/Matching.js";

class AltTree extends GraphPiece{
    /**
     * @param {!Matchable} val
     * @param {!boolean} outer
     * @param {!Array.<!AltTree>} children
     */
    constructor(val, outer, children) {
        super();
        if (!(val instanceof Matchable)) {
            throw new Error(`AltTree.val must be a Matchable but got ${val}`);
        }

        if (!Array.isArray(children)) {
            throw new Error(`Not a child array: ${children}`);
        }
        if (!outer && children.length !== 1) {
            throw new Error(`Inner node must have exactly 1 child but got ${children.length} ${children}.`);
        }
        for (let c of children) {
            if (!(c instanceof AltTree)) {
                throw new Error(`Child isn't an alternating tree node: ${c}.`);
            }
            if (c.outer === outer) {
                throw new Error('Same child type.')
            }
        }
        this.val = val;
        this.outer = outer;
        this.children = children;
    }

    /**
     * Returns a function that creates tree nodes easily for testing purposes.
     *
     * Example usage:
     *
     *     t = AltTree.testBuilder();
     *     result = new AltTree(t().children[0].val, true, [
     *         t(
     *             t(),
     *             t(),
     *         ),
     *         t(),
     *         t(),
     *     ])
     *
     * @returns {!function(...!AltTree=): !AltTree}
     */
    static testBuilder() {
        let counter = 0;
        let node = () => new Node(new Point(counter++, 0), 0);
        return (...children) => AltTree.innerOuter(node(), node(), children);
    }

    /**
     * @param {!Matchable} innerVal
     * @param {!Matchable} outerVal
     * @param {!Array.<!AltTree>=} children
     * @returns {!AltTree}
     */
    static innerOuter(innerVal, outerVal, children=[]) {
        return new AltTree(innerVal, false, [new AltTree(outerVal, true, children)]);

    }

    /**
     * @returns {!Array.<[!GraphPiece, !GraphPiece]>}
     */
    matchings() {
        let result = [];
        if (!this.outer && this.children.length === 1) {
            result.push(new Matching(this.val, this.children[0].val));
        }
        for (let c of this.children) {
            result.push(...c.matchings());
        }
        return result;
    }

    /**
     * @returns {!Point}
     */
    center() {
        return this.val.center();
    }

    /**
     * @param {undefined|!AltTreeZipper} ancestry
     * @yields {!AltTreeZipper}
     */
    *iterNodesWithAncestry(ancestry=undefined) {
        let a = new AltTreeZipper(this, ancestry);
        yield a;
        for (let c of this.children) {
            yield* c.iterNodesWithAncestry(a);
        }
    }

    /**
     * @param {!AltTreeZipper} ancestry
     * @yields {!AltTreeZipper}
     */
    *subtreeOuterNodesWithAncestry(ancestry) {
        for (let e of this.iterNodesWithAncestry(ancestry)) {
            if (e.subtree.outer) {
                yield e;
            }
        }
    }

    /**
     * @param {!GraphPiece} other
     * @returns {!AltTreeZipper}
     */
    closestNodeWithAncestryTo(other) {
        return seq(this.subtreeOuterNodesWithAncestry()).minBy(e => e.subtree.val.timeUntilCollision(other))
    }

    /**
     * @param {undefined|!AltTreeZipper} ancestry
     * @returns {!AltTreeZipper}
     */
    anyLeafWithAncestry(ancestry=undefined) {
        let a = AltTreeZipper(this, ancestry);
        if (this.children.length === 0) {
            return a;
        }
        return this.children[0].anyLeafWithAncestry(a);
    }

    /***
     * @param {...int} indices
     * @returns {!AltTreeZipper}
     */
    descend(...indices) {
        return new AltTreeZipper(this, undefined).descend(...indices);
    }

    allReweightedNodes() {
        let result = [];
        result.push(...this.val.allReweightedNodes());
        for (let c of this.children) {
            result.push(...c.allReweightedNodes());
        }
        return result;
    }

    afterGrowing(dt) {
        let sign = this.outer ? 1 : -1;
        return new AltTree(
            this.val.afterGrowing(dt * sign),
            this.outer,
            this.children.map(e => e.afterGrowing(dt)));
    }

    nodesWithGrowthRate() {
        let result = [];
        let rate = this.outer ? 1 : -1;
        result.push(...this.val.allReweightedNodes().map(e => ({node: e, rate})));
        for (let c of this.children) {
            result.push(...c.nodesWithGrowthRate());
        }
        return result;
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this.val.draw(ctx, this.outer ? '#F00' : '#FF0');
        for (let c of this.children) {
            c.draw(ctx);
        }

        // Draw edges.
        try {
            ctx.save();
            ctx.strokeStyle = 'black';
            if (this.outer) {
                ctx.setLineDash([3]);
            }
            ctx.beginPath();
            let c1 = this.val.center();
            for (let c of this.children) {
                let c2 = c.center();
                let d = c2.minus(c1);
                d = d.times(1 / d.length());
                let p = new Point(-d.y, d.x);
                let c3 = c2.minus(d.plus(p).times(10));
                let c4 = c2.minus(d.minus(p).times(10));
                ctx.moveTo(c1.x, c1.y);
                ctx.lineTo(c2.x, c2.y);
                ctx.moveTo(c3.x, c3.y);
                ctx.lineTo(c2.x, c2.y);
                ctx.moveTo(c4.x, c4.y);
                ctx.lineTo(c2.x, c2.y);
            }
            ctx.stroke();
        } finally {
            ctx.restore();
        }

    }

    /**
     * @param {*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (!(other instanceof AltTree)) {
            return false;
        }
        return this.val.isEqualTo(other.val) &&
            this.outer === other.outer &&
            equate_Iterables(this.children, other.children);
    }

    /**
     * @param {!Matching} match
     * @param {!GraphPiece} other
     */
    static fromMatchingSettingRootClosestTo(match, other) {
        let t1 = match.n1.timeUntilCollision(other);
        let t2 = match.n2.timeUntilCollision(other);
        let close, far;
        if (t1 > t2) {
            far = match.n1;
            close = match.n2;
        } else {
            close = match.n1;
            far = match.n2;
        }

        let leaf = new AltTree(far, true, []);
        return new AltTree(close, false, [leaf]);
    }

    /**
     * @returns {!string}
     */
    toString() {
        if (!this.outer) {
            return this.val.toString() + ' ===> ' + this.children[0].toString();
        }

        let indent1 = '+---';
        let indent2 = '|   ';
        let childParagraphs = this.children.map(c => indent1 + c.toString().trimEnd().split('\n').join('\n' + indent2));
        let result = this.val.toString().trimEnd();
        if (childParagraphs) {
            result += '\n' + childParagraphs.join('\n').trimEnd();
        }
        return result;
    }
}

/**
 * An alternating tree node augmented with ancestry information.
 */
class AltTreeZipper {
    /**
     * @param {!AltTree} subtree
     * @param {undefined|!AltTreeZipper} parent
     */
    constructor(subtree, parent) {
        if (!(subtree instanceof AltTree)) {
            throw new Error(`not an AltTree: ${subtree}`)
        }
        if (parent !== undefined && !(parent instanceof AltTreeZipper)) {
            throw new Error(`not an AltTreeZipper: ${parent}`)
        }
        this.subtree = subtree;
        this.parent = parent;
    }

    /**
     * @param {undefined|!AltTreeZipper=} stopBefore
     * @yields {!AltTreeZipper}
     */
    *iterUpward(stopBefore=undefined) {
        for (let z = this; z !== stopBefore; z = z.parent) {
            yield z;
        }
    }

    /**
     * @param {!AltTreeZipper} other
     * @returns {!AltTreeZipper}
     */
    mostRecentCommonAncestor(other) {
        let seen = [...this.iterUpward()].map(e => e.subtree);
        for (let z of other.iterUpward()) {
            if (seen.indexOf(z.subtree) !== -1) {
                return z;
            }
        }
        throw new Error(`No common ancestor between ${this} and ${other}.`);
    }

    /**
     * @param {undefined|!AltTreeZipper} pruneParent
     * @returns {!{
     *     orphanedSubTrees: !Array.<!AltTree>,
     *     removedMatchables: !Array.<!Matchable>,
     *     childTree: !AltTree,
     * }}
     */
    pruneUpwardTo(pruneParent=undefined) {
        let childTree = undefined;
        let orphanedSubTrees = [];
        let removedMatchables = [];
        for (let a of this.iterUpward(pruneParent)) {
            orphanedSubTrees.push(...a.subtree.children.filter(e => e !== childTree));
            childTree = a.subtree;
            removedMatchables.push(childTree.val);
        }
        return {orphanedSubTrees, removedMatchables, childTree};
    }

    /**
     * @returns {!AltTree}
     */
    root() {
        if (this.parent === undefined) {
            return this.subtree;
        }
        return this.parent.root();
    }

    /**
     * @param {undefined|!AltTree} removedChild
     * @returns {!AltTree}
     */
    asNewAugmentedRoot(removedChild=undefined) {
        let newChildren = this.subtree.children.filter(e => e !== removedChild);
        if (this.parent !== undefined) {
            newChildren.push(this.parent.asNewAugmentedRoot(this.subtree))
        }
        return new AltTree(this.subtree.val, this.subtree.outer, newChildren);
    }

    /**
     * @param {!AltTree} appendedChild
     * @returns {!AltTreeZipper}
     */
    withAppendedChild(appendedChild) {
        if (!(appendedChild instanceof AltTree)) {
            throw new Error(`appendedChild not an AlternatingTreeNode: ${appendedChild}`);
        }
        let newChildren = [...this.subtree.children, appendedChild];
        let newSubTree = new AltTree(this.subtree.val, this.subtree.outer, newChildren);
        return this.withSubTreeReplacedBy(newSubTree);
    }

    /***
     * @param {...int} indices
     * @returns {!AltTreeZipper}
     */
    descend(...indices) {
        let result = this;
        for (let i of indices) {
            if (i < 0 || i >= result.subtree.children.length) {
                throw new Error(`Descended to non-existent child ${i} of ${result}.`);
            }
            result = new AltTreeZipper(result.subtree.children[i], result);
        }
        return result;
    }

    /**
     * @param {!AltTree} newSubTree
     * @returns {!AltTreeZipper}
     */
    withSubTreeReplacedBy(newSubTree) {
        if (!(newSubTree instanceof AltTree)) {
            throw new Error(`newSubTree not an AlternatingTreeNode: ${newSubTree}`);
        }
        let newAncestry = undefined;
        if (this.parent !== undefined) {
            let parentNode = this.parent.subtree;
            let newParentNode = new AltTree(
                parentNode.val,
                parentNode.outer,
                parentNode.children.map(e => e !== this.subtree ? e : newSubTree)
            );
            newAncestry = this.parent.withSubTreeReplacedBy(newParentNode);
        }
        return new AltTreeZipper(newSubTree, newAncestry);
    }

    toString() {
        return toStringAsFunctionCall(
            'AltTreeZipper',
            this.subtree);
    }

    isEqualTo(other) {
        return other instanceof AltTreeZipper &&
            other.subtree.isEqualTo(this.subtree) &&
            (other.parent === undefined ? this.parent === undefined : other.parent.isEqualTo(this.parent));
    }
}

export {AltTreeZipper, AltTree}
