
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FSMCanvas from '@/components/fsm/FSMCanvas';
// Removed Button import
import { ArrowLeft, Plus } from 'lucide-react';
import { Node, Edge, MarkerType, Connection } from 'reactflow';
import FSMStateModal from '@/components/fsm/modals/FSMStateModal';
import FSMTransitionModal from '@/components/fsm/modals/FSMTransitionModal';

export default function FSMEditorPage() {
    const { id } = useParams();
    const router = useRouter();
    const [version, setVersion] = useState<any>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [stateModalOpen, setStateModalOpen] = useState(false);
    const [editingState, setEditingState] = useState<any>(null);

    const [transitionModalOpen, setTransitionModalOpen] = useState(false);
    const [editingTransition, setEditingTransition] = useState<any>(null);
    const [newConnection, setNewConnection] = useState<{ source: string, target: string } | null>(null);

    useEffect(() => {
        if (id) fetchGraph();
    }, [id]);

    const fetchGraph = async () => {
        try {
            const res = await fetch(`/api/fsm/versions/${id}`);
            if (res.ok) {
                const data = await res.json();
                setVersion(data);
                transformData(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const transformData = (data: any) => {
        // 1. Transform States to Nodes
        const newNodes: Node[] = data.states.map((state: any) => ({
            id: state.id,
            type: 'default', // Using default node for now
            data: { label: `${state.name} ${state.isTerminal ? '(END)' : ''}` },
            position: { x: state.positionX, y: state.positionY },
            style: {
                border: state.isTerminal ? '2px solid red' : (state.isInitial ? '2px solid green' : '1px solid #777'),
                background: state.isTerminal ? '#fff0f0' : '#fff',
                width: 180,
            }
        }));

        // 2. Transform Transitions to Edges
        // Transitions are stored on the 'version' object level usually, via state expansion?
        // Wait, my API `include` structure in `versions/[id]` route was:
        // include: { states: true, transitions: true } -> Transitions are at version level? 
        // ERROR: My schema has transitions linked to STATES, not just versions directly (though versionId is there).
        // Actually `FSMTransition` links `fromState` and `toState`.
        // The API I wrote returns `version` with `states` and `transitions` (as per `fSMVersion.transitions`).
        // Let's verify schema... `FSMVersion` has `transitions FSMTransition[]`. So yes, I included them. Good.

        // Map transitions to edges, storing full data in 'data' field for editing
        const newEdges: Edge[] = data.transitions.map((t: any) => ({
            id: t.id,
            source: t.fromStateId,
            target: t.toStateId,
            label: t.triggerType === 'EVENT' ? t.triggerEvent : `${t.timeoutMinutes}m Timeout`,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#555' },
            data: t // Store full transition data
        }));

        setNodes(newNodes);
        setEdges(newEdges);
    };

    const handleSaveLayout = async () => {
        const layoutData = nodes.map((n: Node) => ({
            id: n.id,
            x: n.position.x,
            y: n.position.y
        }));

        try {
            const res = await fetch('/api/fsm/layout', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes: layoutData })
            });
            if (res.ok) alert('Layout saved!');
            else alert('Failed to save layout');
        } catch (e) {
            console.error(e);
            alert('Error saving layout');
        }
    };

    // --- State Handlers ---
    const handleAddState = () => {
        setEditingState(null);
        setStateModalOpen(true);
    };

    const handleEditState = (e: React.MouseEvent, node: Node) => {
        // Find full state data from version states if needed, or use node props
        // We need more than just position/label.
        // Easiest is to refetch or look up in `version.states`
        const stateData = version.states.find((s: any) => s.id === node.id);
        setEditingState(stateData || node);
        setStateModalOpen(true);
    };

    const handleSaveState = async (data: any) => {
        try {
            const isEdit = !!editingState;
            const url = isEdit ? `/api/fsm/states/${editingState.id}` : '/api/fsm/states';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = { ...data, versionId: parseInt(id as string) };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStateModalOpen(false);
                fetchGraph(); // Refresh
            } else {
                alert('Failed to save state');
            }
        } catch (e) { console.error(e); }
    };

    // --- Transition Handlers ---
    const handleConnect = (params: Connection | Edge) => {
        // Open Modal to configure transition
        setNewConnection({ source: params.source!, target: params.target! });
        setEditingTransition(null);
        setTransitionModalOpen(true);
    };

    const handleEditTransition = (e: React.MouseEvent, edge: Edge) => {
        setEditingTransition(edge.data); // We stored full object in 'data'
        setNewConnection({ source: edge.source, target: edge.target });
        setTransitionModalOpen(true);
    };

    const handleSaveTransition = async (data: any) => {
        try {
            const isEdit = !!editingTransition;
            const url = isEdit ? `/api/fsm/transitions/${editingTransition.id}` : '/api/fsm/transitions';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                ...data,
                versionId: parseInt(id as string),
                // Ensure from/to are set
                fromStateId: newConnection?.source || editingTransition.fromStateId,
                toStateId: newConnection?.target || editingTransition.toStateId
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setTransitionModalOpen(false);
                fetchGraph();
            } else {
                alert('Failed to save transition');
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="p-8">Loading Editor...</div>;
    if (!version) return <div className="p-8">Version not found</div>;

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center px-4 py-2 border-b bg-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/fsm')}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </button>
                    <div>
                        <h2 className="text-lg font-bold">{version.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${version.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {version.isActive ? 'Active' : 'Draft'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddState}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add State
                    </button>
                    <button
                        onClick={handleSaveLayout}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Save Layout
                    </button>
                </div>
            </div>

            <div className="flex-1 px-4 pb-4">
                <FSMCanvas
                    initialNodes={nodes}
                    initialEdges={edges}
                    onNodeClick={handleEditState}
                    onEdgeClick={handleEditTransition}
                    onConnect={handleConnect}
                />
            </div>

            <FSMStateModal
                isOpen={stateModalOpen}
                onClose={() => setStateModalOpen(false)}
                onSave={handleSaveState}
                initialData={editingState}
            />

            <FSMTransitionModal
                isOpen={transitionModalOpen}
                onClose={() => setTransitionModalOpen(false)}
                onSave={handleSaveTransition}
                initialData={editingTransition}
                fromStateId={newConnection?.source}
                toStateId={newConnection?.target}
            />
        </div>
    );
}
