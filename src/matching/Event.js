import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {indent, toStringAsFunctionCall} from "src/base/Util.js";
import {Edit} from "src/matching/Edit.js";
import {AltTree, AltTreeZipper} from "src/matching/AltTree.js";
import {Matching} from "src/matching/Matching.js";
import {Blossom} from "src/matching/Blossom.js";

class Event {
    /**
     * @param {!number} time
     */
    constructor(time) {
        this.time = time;
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        // throw new Error('Not implemented');
    }

    /**
     * @param {!MinWeightMatchingState} state
     * @returns {!Edit.<!AltTree|!Matching>}
     */
    edit() {
        throw new Error('Not implemented');
    }
}

class WaitEvent extends Event {
    constructor(time) {
        super(time)
    }

    edit() {
        return new Edit().
            transform(e => e instanceof AltTree ? e.afterGrowing(this.time) : e);
    }

    toString() {
        return `WaitEvent(${this.time})`;
    }
}

class TreeHitMatchEvent extends Event {
    /**
     * @param {!number} time
     * @param {!AltTree} tree
     * @param {!Matching} match
     */
    constructor(time, tree, match) {
        super(time);
        this.time = time;
        this.tree = tree;
        this.match = match;
    }

    edit() {
        let matchSubTree = AltTree.fromMatchingSettingRootClosestTo(this.match, this.tree);
        let closestNode = this.tree.closestNodeWithAncestryTo(this.match);
        let treeContainingMatch = closestNode.withAppendedChild(matchSubTree).root();
        return new Edit().
            remove(this.match, this.tree).
            add(treeContainingMatch);
    }

    toString() {
        return toStringAsFunctionCall(
            'TreeHitMatchEvent(',
            this.time,
            this.tree,
            this.match)
    }
}

class TreeHitSelfEvent extends Event {
    /**
     * @param {!number} time
     * @param {!AltTreeZipper} ancestry1
     * @param {!AltTreeZipper} ancestry2
     */
    constructor(time, ancestry1, ancestry2) {
        super(time);
        this.time = time;
        this.ancestry1 = ancestry1;
        this.ancestry2 = ancestry2;
    }

    edit() {
        let c = this.ancestry1.mostRecentCommonAncestor(this.ancestry2);
        let p1 = this.ancestry1.pruneUpwardTo(c);
        let p2 = this.ancestry2.pruneUpwardTo(c);
        let orphanedSubTrees = [
            ...c.subtree.children.filter(e => e !== p1.childTree && e !== p2.childTree),
            ...p1.orphanedSubTrees,
            ...p2.orphanedSubTrees,
        ];
        let cycle = [
            ...p1.removedMatchables, // Travel up one path.
            c.subtree.val, // Switch directions where they meet.
            ...[...p2.removedMatchables].reverse(), // Travel down the other path.
        ];
        let blossom = new Blossom(cycle, 0);
        let newSubTree = new AltTree(blossom, true, orphanedSubTrees);
        let newAncestry = c.withSubTreeReplacedBy(newSubTree);
        let newRoot = newAncestry.root();
        let oldRoot = this.ancestry1.root();

        return new Edit().remove(oldRoot).add(newRoot);
    }

    toString() {
        return toStringAsFunctionCall(
            'TreeHitSelfEvent',
            this.time,
            this.ancestry1.subtree.val,
            this.ancestry2.subtree.val);
    }
}

class TreeHitTreeEvent extends Event {
    /**
     * @param {!number} time
     * @param {!AltTree} tree1
     * @param {!AltTree} tree2
     */
    constructor(time, tree1, tree2) {
        super(time);
        this.time = time;
        this.tree1 = tree1;
        this.tree2 = tree2;
    }

    edit() {
        let c1 = this.tree1.closestNodeWithAncestryTo(this.tree2);
        let c2 = this.tree2.closestNodeWithAncestryTo(c1.subtree);
        return new Edit().
            remove(
                this.tree1,
                this.tree2).
            add(
                ...c1.asNewAugmentedRoot().matchings(),
                ...c2.asNewAugmentedRoot().matchings(),
                new Matching(c1.subtree.val, c2.subtree.val));
    }

    toString() {
        return toStringAsFunctionCall(
            'TreeHitTreeEvent',
            this.time,
            this.tree1,
            this.tree2);
    }
}

class BlossomExpandEvent extends Event {
    /**
     * @param {!number} time
     * @param {!AltTreeZipper} blossomZipper
     */
    constructor(time, blossomZipper) {
        if (!(blossomZipper instanceof AltTreeZipper)) {
            throw new Error(`blossomZipper must be an AltTreeZipper but got ${AltTreeZipper}`)
        }
        if (blossomZipper.subtree.outer) {
            throw new Error(`Only inner blossoms can expand.`)
        }
        if (!(blossomZipper.subtree.val instanceof Blossom)) {
            throw new Error(`blossomZipper must contain a blossom but got ${AltTreeZipper.subtree.val}`)
        }
        super(time);
        this.time = time;
        this.blossomZipper = blossomZipper;
    }

    edit() {
        let parent = this.blossomZipper.parent.subtree;
        let child = this.blossomZipper.subtree.children[0];
        let blossom = /** @type {!Blossom} */ this.blossomZipper.subtree.val;
        let parentNeighbor = blossom.closestPieceTo(parent.val);
        let childNeighbor = blossom.closestPieceTo(child.val);
        let i = blossom.cycle.indexOf(parentNeighbor);
        let j = blossom.cycle.indexOf(childNeighbor);

        let [p0, p1] = cycleSplit(blossom.cycle, i, j);
        p1.reverse();
        if (p1.length % 2 === 0) {
            [p1, p0] = [p0, p1];
        }

        let matches = [];
        for (let i = 1; i + 2 < p0.length; i += 2) {
            matches.push(new Matching(p0[i], p0[i+1]));
        }

        let newSubTree = new AltTree(p1[p1.length - 1], false, [child]);
        for (let k = p1.length - 3; k >= 0; k -= 2) {
            newSubTree = AltTree.innerOuter(p1[k], p1[k + 1], [newSubTree]);
        }

        return new Edit().
            remove(this.blossomZipper.root()).
            add(
                ...matches,
                this.blossomZipper.withSubTreeReplacedBy(newSubTree).root()
            );
    }

    toString() {
        return toStringAsFunctionCall(
            'BlossomExpandEvent',
            this.time,
            this.blossomZipper.subtree.val);
    }
}

/**
 * @param {!Array.<T>} items
 * @param {!int} i
 * @param {!int} j
 * @returns {![!Array.<T>, !Array.<T>]}
 * @template T
 */
function cycleSplit(items, i, j) {
    let n = items.length;
    i %= n;
    i += n;
    i %= n;
    j %= n;
    j += n;
    j %= n;
    if (i === j) {
        return [[items[i]], [...items.slice(i), ...items.slice(0, i + 1)]]
    }

    let result1 = [];
    let result2 = [];
    for (let k = i; k !== j; k = (k + 1) % n) {
        result1.push(items[k]);
    }
    result1.push(items[j]);
    for (let k = j; k !== i; k = (k + 1) % n) {
        result2.push(items[k]);
    }
    result2.push(items[i]);
    return [result1, result2];
}

export {Event, TreeHitSelfEvent, TreeHitMatchEvent, TreeHitTreeEvent, WaitEvent, BlossomExpandEvent, cycleSplit}
