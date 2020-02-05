import {Suite, assertThat, assertThrows, assertTrue, EqualsTester} from "test/TestUtil.js"
import {AltTree, AltTreeZipper} from "src/matching/AltTree.js"
import {Node} from "src/matching/Node.js"
import {Point} from "src/base/Point.js";
import {cycleSplit, BlossomExpandEvent} from "src/matching/Event.js"
import {Seq} from "src/base/Seq.js";
import {Edit} from "src/matching/Edit.js";
import {Blossom} from "src/matching/Blossom.js"
import {Matching} from "src/matching/Matching.js"

let suite = new Suite("AltTree");

suite.test("cycleSplit", () => {
    let f = (i, j) => cycleSplit(Seq.range(7).toArray(), i, j);

    assertThat(cycleSplit(['a', 'b', 'c'], 0, 0)).isEqualTo([['a'], ['a', 'b', 'c', 'a']]);
    assertThat(cycleSplit(['a', 'b', 'c'], 0, 1)).isEqualTo([['a', 'b'], ['b', 'c', 'a']]);

    assertThat(f(0, 0)).isEqualTo([[0], [0, 1, 2, 3, 4, 5, 6, 0]]);
    assertThat(f(1, 1)).isEqualTo([[1], [1, 2, 3, 4, 5, 6, 0, 1]]);
    assertThat(f(2, 2)).isEqualTo([[2], [2, 3, 4, 5, 6, 0, 1, 2]]);

    assertThat(f(0, 1)).isEqualTo([[0, 1], [1, 2, 3, 4, 5, 6, 0]]);
    assertThat(f(1, 2)).isEqualTo([[1, 2], [2, 3, 4, 5, 6, 0, 1]]);
    assertThat(f(2, 1)).isEqualTo([[2, 3, 4, 5, 6, 0, 1], [1, 2]]);

    assertThat(f(1, 3)).isEqualTo([[1, 2, 3], [3, 4, 5, 6, 0, 1]]);
    assertThat(f(1, 4)).isEqualTo([[1, 2, 3, 4], [4, 5, 6, 0, 1]]);

    assertThat(f(0, 6)).isEqualTo([[0, 1, 2, 3, 4, 5, 6], [6, 0]]);
    assertThat(f(6, 0)).isEqualTo([[6, 0], [0, 1, 2, 3, 4, 5, 6]]);
});

suite.test("BlossomExpandEvent.edit", () => {
    function makeTree() {
        let t = AltTree.testBuilder();
        return new AltTree(t().children[0].val, true, [
            t(
                t(
                    t(),
                    t(),
                ),
                t(),
                t(),
            ),
        ]);
    }
    let tree = makeTree();
    let a = tree.descend(0, 0, 0);
    let n1 = new Node(new Point(1000, 1001), 1);
    let n2 = new Node(new Point(1000, 1002), 1);
    let n3 = new Node(new Point(1000, 1003), 1);
    let n4 = new Node(new Point(1000, 1004), 1);
    a.subtree.val = new Blossom([
        new Node(new Point(-1, -1), -1),
        n1,
        n2,
        n3,
        n4,
    ], 0);
    let b = new BlossomExpandEvent(0, a);

    let tree2 = makeTree();
    tree2.descend(0, 0, 0).subtree.val = new Node(new Point(-1, -1), -1);
    assertThat(b.edit()).isEqualTo(new Edit().
        add(new Matching(n4, n3)).
        add(new Matching(n2, n1)).
        add(tree2).
        remove(tree));
});
