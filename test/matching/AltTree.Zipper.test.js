import {Suite, assertThat, assertThrows, assertTrue, EqualsTester} from "test/TestUtil.js"
import {AltTree, AltTreeZipper} from "src/matching/AltTree.js"
import {Node} from "src/matching/Node.js"
import {Point} from "src/base/Point.js";

let suite = new Suite("AltTreeZipper");

suite.test("isEqualTo", () => {
    let eq = new EqualsTester();
    let m1 = new Node(new Point(1, 2), 3);
    let m2 = new Node(new Point(2, 3), 5);
    let t1 = new AltTree(m1, true, []);
    let t2 = new AltTree(m2, false, [t1]);
    let z1 = new AltTreeZipper(t1, undefined);
    let z2 = new AltTreeZipper(t2, z1);

    eq.assertAddGroup(z1);
    eq.assertAddGroup(z2);
});

suite.test("mostRecentCommonAncestor", () => {
    let t = AltTree.testBuilder();
    let tree = new AltTree(t().children[0].val, true, [
        t(
            t(),
            t(),
        ),
        t(),
        t(),
    ]);
    assertThat(tree.descend(0).mostRecentCommonAncestor(tree.descend(1))).isEqualTo(tree.descend());
    assertThat(tree.descend(0).mostRecentCommonAncestor(tree.descend(2))).isEqualTo(tree.descend());
    assertThat(tree.descend(0, 0).mostRecentCommonAncestor(tree.descend(1))).isEqualTo(tree.descend());
    assertThat(tree.descend(0, 0, 0).mostRecentCommonAncestor(tree.descend(1))).isEqualTo(tree.descend());
    assertThat(tree.descend(0, 0, 0).mostRecentCommonAncestor(tree.descend(0, 0, 1))).isEqualTo(tree.descend(0, 0));
});
