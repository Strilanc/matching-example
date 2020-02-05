import {Suite, assertThat, assertThrows, assertTrue, EqualsTester} from "test/TestUtil.js"
import {AltTree, AltTreeZipper} from "src/matching/AltTree.js"
import {Node} from "src/matching/Node.js"
import {Point} from "src/base/Point.js";

let suite = new Suite("AltTree");

suite.test("isEqualTo", () => {
    let eq = new EqualsTester();
    let m1 = new Node(new Point(1, 2), 3);
    let m2 = new Node(new Point(2, 3), 5);
    let t1 = new AltTree(m1, true, []);
    let t2 = new AltTree(m2, false, [t1]);

    eq.assertAddGroup(t1);
    eq.assertAddGroup(new AltTree(m2, true, []));
    eq.assertAddGroup(new AltTree(m1, true, [t2]));
    eq.assertAddGroup(new AltTree(m1, false, [t1]));
    eq.assertAddGroup(t2);
});
