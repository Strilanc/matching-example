import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {Matrix} from "src/base/Matrix.js"

import {LinearProgram, LinearConstraint} from "src/base/LinearProgram.js"

let suite = new Suite("LinearProgram");

suite.test("basics", () => {
    let p = new LinearProgram(
        ['x1', 'x2'],
        [new LinearConstraint([-5, -6], -7)],
        [3, 4]);
    let d = p.dual(['y1']);

    assertThat(p.toString()).isEqualTo([
        'MAXIMIZE',
        '    3*x1 + 4*x2',
        'SUBJECT TO',
        '    x1 >= 0',
        '    x2 >= 0',
        '    -5*x1 + -6*x2 >= -7',
    ].join('\n'));
    assertThat(d.toString()).isEqualTo([
        'MAXIMIZE',
        '    -7*y1',
        'SUBJECT TO',
        '    y1 >= 0',
        '    5*y1 >= 3',
        '    6*y1 >= 4',
    ].join('\n'));


    assertFalse(d.satisfies([2/3 - 0.001]));
    assertTrue(d.satisfies([2/3]));
    assertTrue(d.satisfies([2/3 + 0.001]));
    assertThat(d.score([2/3])).isApproximatelyEqualTo(-14/3);
});

function findNegativeCycle(root, weightedNeighbors) {
    let queue = [{node: root, weight: 0, path: undefined}];
    let bestCost = new Map();
    while (queue.length > 0) {
        let k = Seq.range(queue.length).minBy(i => queue[i].weight);
        let {node, weight, path} = queue[k];
        queue.splice(k, 1);
        for (let neighbor of weightedNeighbors(node)) {

        }
    }
}
