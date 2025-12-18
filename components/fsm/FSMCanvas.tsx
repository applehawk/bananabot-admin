
'use client';

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    addEdge,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface FSMCanvasProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
    onConnect?: (params: Connection | Edge) => void;
}

import StateNode from './StateNode';

const nodeTypes = { state: StateNode };

const FSMCanvas: React.FC<FSMCanvasProps & {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: any;
    onEdgesChange: any;
}> = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onEdgeClick,
    onConnect
}) => {
        const handleConnect = useCallback(
            (params: Connection | Edge) => {
                onConnect && onConnect(params);
            },
            [onConnect]
        );

        // Custom Styles for graph
        const flowStyles = { background: '#f8f9fa' };

        return (
            <div style={{ height: '800px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    style={flowStyles}
                    fitView
                >
                    <Background gap={16} />
                    <Controls />
                </ReactFlow>
            </div>
        );
    };

export default FSMCanvas;
