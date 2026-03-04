import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

interface DagreNode {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function layoutGraph(nodes: Array<Node>, edges: Array<Edge>): Array<Node> {
	const graph = new dagre.graphlib.Graph();

	graph.setDefaultEdgeLabel(() => ({}));
	graph.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });

	for (const node of nodes) {
		graph.setNode(node.id, { width: 180, height: 100 });
	}

	for (const edge of edges) {
		graph.setEdge(edge.source, edge.target);
	}

	dagre.layout(graph);

	return nodes.map((node) => {
		const pos = graph.node(node.id) as DagreNode;

		return {
			...node,
			position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 },
		};
	});
}
