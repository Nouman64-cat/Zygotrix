import { useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
    BackgroundVariant,
    Position,
    type Node,
    type Edge,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { FiCheckCircle, FiAlertTriangle, FiActivity } from 'react-icons/fi';

import FamilyNode from './FamilyNode';
import type { PedigreeStructure, GeneticAnalysisResult } from '../../types';

interface FamilyTreeVisualizerProps {
    data?: PedigreeStructure;
    analysisResult?: GeneticAnalysisResult;
    isLoading?: boolean;
}

const nodeTypes = {
    familyMember: FamilyNode,
};

const nodeWidth = 200;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    try {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

        nodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        nodes.forEach((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            if (nodeWithPosition) {
                node.targetPosition = Position.Top;
                node.sourcePosition = Position.Bottom;
                node.position = {
                    x: nodeWithPosition.x - nodeWidth / 2,
                    y: nodeWithPosition.y - nodeHeight / 2,
                };
            }
            return node;
        });
    } catch (e) {
        console.error("Dagre Layout Failed:", e);
        // Fallback: Arrange in a simple vertical stack if layout fails
        nodes.forEach((node, index) => {
            node.position = { x: 0, y: index * 150 };
            node.targetPosition = Position.Top;
            node.sourcePosition = Position.Bottom;
        });
    }

    return { nodes, edges };
};

const StatusHeader = ({ result }: { result?: GeneticAnalysisResult }) => {
    if (!result) return null;

    const isConflict = result.status === 'CONFLICT';
    const isSolvable = result.status === 'SOLVABLE';

    const bgColor = isConflict ? 'bg-red-500/10 border-red-500/30' :
        isSolvable ? 'bg-green-500/10 border-green-500/30' :
            'bg-blue-500/10 border-blue-500/30';

    const textColor = isConflict ? 'text-red-400' :
        isSolvable ? 'text-green-400' :
            'text-blue-400';

    const icon = isConflict ? <FiAlertTriangle className="text-xl" /> :
        isSolvable ? <FiCheckCircle className="text-xl" /> :
            <FiActivity className="text-xl" />;

    const title = isConflict ? "ANOMALY DETECTED: NON-MENDELIAN PATTERN" :
        isSolvable ? "MENDELIAN PATTERN CONFIRMED" :
            "ANALYSIS STATUS: UNKNOWN";

    return (
        <div className={`absolute top-4 left-4 right-4 z-10 flex items-center p-4 rounded-xl border backdrop-blur-xl ${bgColor} ${textColor} shadow-lg`}>
            <div className="mr-3 p-2 bg-black/5 dark:bg-white/5 rounded-full shadow-inner">{icon}</div>
            <div>
                <h3 className="text-sm font-bold tracking-widest uppercase">{title}</h3>
                {isConflict && (
                    <p className="text-xs text-gray-600 dark:text-white/60 mt-0.5">
                        Possible Cause: <span className="font-mono text-red-600 dark:text-red-300">Epistasis / Gene Masking</span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default function FamilyTreeVisualizer({ data, analysisResult, isLoading }: FamilyTreeVisualizerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Transform data into React Flow nodes/edges
    useEffect(() => {
        if (!data?.members) return;

        const initialNodes: Node[] = data.members.map((member) => ({
            id: member.id,
            type: 'familyMember',
            data: { ...member, isTarget: false },
            position: { x: 0, y: 0 },
        }));

        const initialEdges: Edge[] = [];

        // Create edges based on parent_ids
        data.members.forEach((member) => {
            member.parent_ids?.forEach((parentId) => {
                initialEdges.push({
                    id: `e${parentId}-${member.id}`,
                    source: parentId,
                    target: member.id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 }, // Slate-400
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#94a3b8',
                    },
                });
            });
        });

        // Safely Apply Layout
        const layouted = getLayoutedElements(initialNodes, initialEdges);
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);
    }, [data, setNodes, setEdges]); // Run when data changes

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-blue-500 dark:text-blue-400 font-mono animate-pulse">
                <FiActivity className="w-6 h-6 mr-2 animate-spin" />
                INITIALIZING GENETIC ENGINE...
            </div>
        );
    }

    if (!nodes.length) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-950/50 text-gray-500 dark:text-zinc-600">
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-full flex items-center justify-center mb-4">
                    <FiActivity className="w-6 h-6" />
                </div>
                <p className="font-mono text-sm tracking-widest">NO GENETIC DATA MAPPED</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-white dark:bg-zinc-950">
            <StatusHeader result={analysisResult} />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-white dark:bg-zinc-950"
                minZoom={0.5}
                maxZoom={2}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#71717a" />
                <Controls className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 fill-gray-500 dark:fill-zinc-400" />
            </ReactFlow>
        </div>
    );
}
