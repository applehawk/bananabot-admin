
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FSMCanvas from '@/components/fsm/FSMCanvas';
import { ArrowLeft, Plus, Users, Zap, BookOpen, Clock, ShieldAlert } from 'lucide-react';
import ReactFlow, { Node, Edge, MarkerType, Connection, useNodesState, useEdgesState } from 'reactflow';
import FSMStateModal from '@/components/fsm/modals/FSMStateModal';
import FSMTransitionModal from '@/components/fsm/modals/FSMTransitionModal';
import { ActionExecutionModal } from '@/components/fsm/immersion/ActionExecutionModal';
import { formatDistanceToNow } from 'date-fns';

export default function FSMEditorPage() {
    const { id } = useParams();
    const router = useRouter();
    const [version, setVersion] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    // ReactFlow Hooks
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    // Selection & User Data State
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Modal State
    const [stateModalOpen, setStateModalOpen] = useState(false);
    const [editingState, setEditingState] = useState<any>(null);

    const [transitionModalOpen, setTransitionModalOpen] = useState(false);
    const [editingTransition, setEditingTransition] = useState<any>(null);
    const [newConnection, setNewConnection] = useState<{ source: string, target: string } | null>(null);

    // Action Execution State
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState('SEND_MESSAGE');
    const [actionConfig, setActionConfig] = useState<any>({});
    const [executingAction, setExecutingAction] = useState(false);
    const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchGraph();
            fetchStats();
            fetchPackages();
        }
    }, [id]);

    // Added version to dependencies
    useEffect(() => {
        if (version && stats) transformData(version, stats);
    }, [stats, version]);

    const fetchPackages = async () => {
        try {
            const res = await fetch('/admin/api/credits/packages');
            if (res.ok) {
                const data = await res.json();
                setAvailablePackages(data);
            }
        } catch (e) { console.error("Failed to load packages", e); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`/admin/api/fsm/stats?versionId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                if (version) transformData(version, data);
            }
        } catch (e) { console.error("Stats fetch error:", e); }
    };

    const fetchGraph = async () => {
        try {
            const res = await fetch(`/admin/api/fsm/versions/${id}`);
            if (res.ok) {
                const data = await res.json();
                setVersion(data);
                transformData(data, stats);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsersForState = async (stateId: string | number) => {
        setLoadingUsers(true);
        setUsersList([]);
        try {
            const res = await fetch(`/admin/api/fsm/states/${stateId}/users`);
            if (res.ok) {
                const data = await res.json();
                setUsersList(data.users || []);
                return data.users || [];
            }
        } catch (e) { console.error(e); }
        finally { setLoadingUsers(false); }
        return [];
    };

    // Action Handler
    const handleNodeActionClick = async (stateId: string) => {
        // Fetch users for this state to get IDs
        const users = await fetchUsersForState(stateId);
        const ids = users.map((u: any) => u.id);

        if (ids.length === 0) {
            alert("No users in this state to execute actions on.");
            return;
        }

        setTargetUserIds(ids);
        setActionModalOpen(true);
    };

    const handleExecuteAction = async () => {
        if (targetUserIds.length === 0) return;
        setExecutingAction(true);

        try {
            // Transform conditions from JSON string if needed
            let conditions = actionConfig.conditions;
            if (typeof conditions === 'string' && conditions.trim()) {
                try {
                    conditions = JSON.parse(conditions);
                } catch (e) {
                    alert('Invalid JSON in conditions');
                    setExecutingAction(false);
                    return;
                }
            } else if (!conditions) {
                conditions = undefined;
            }

            const payload = {
                userIds: targetUserIds,
                action: actionType,
                config: { ...actionConfig, conditions }, // Pass conditions to API
                conditions: conditions // Redundant but explicit for API top-level check if logic differs
            };

            const res = await fetch('/admin/api/fsm/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Action executed! Success: ${data.successCount}, Skipped: ${data.skippedCount || 0}, Failed: ${data.failedCount}`);
                setActionModalOpen(false);
            } else {
                alert('Failed to execute action: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error executing action');
        } finally {
            setExecutingAction(false);
        }
    };


    const transformData = (data: any, statsData?: any) => {
        // 1. Transform States to Nodes
        const newNodes: Node[] = data.states.map((state: any) => {
            const stat = statsData?.stateDistribution?.find((s: any) => s.stateId === state.id);
            return {
                id: state.id.toString(), // Ensure string ID for ReactFlow
                type: 'state', // USE CUSTOM NODE
                data: {
                    label: state.name,
                    id: state.id.toString(), // Pass ID to data for handler
                    isTerminal: state.isTerminal,
                    isInitial: state.isInitial,
                    userCount: stat ? stat.count : 0,
                    onActionClick: handleNodeActionClick // Pass handler
                },
                position: { x: state.positionX, y: state.positionY },
                width: 200,
            };
        });

        // 2. Transform Transitions to Edges
        const newEdges: Edge[] = data.transitions.map((t: any) => {
            const hasRules = t.actions && t.actions.length > 0;
            const ruleCount = t.actions ? t.actions.length : 0;

            return {
                id: t.id.toString(),
                source: t.fromStateId.toString(),
                target: t.toStateId.toString(),
                label: `${t.triggerType === 'EVENT' ? t.triggerEvent : t.timeoutMinutes + 'm Timeout'} ${ruleCount > 0 ? `(⚡${ruleCount})` : ''}`,
                type: 'default', // Standard Bezier curve for smoother lines
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: hasRules ? '#2563eb' : '#555', strokeWidth: hasRules ? 2 : 1 },
                data: t // Store full transition data
            };
        });

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
            const res = await fetch('/admin/api/fsm/layout', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes: layoutData })
            });
            if (res.ok) alert('Layout saved!');
        } catch (e) {
            alert('Error saving layout');
        }
    };

    // --- Interaction Handlers ---
    const onNodeClick = (e: React.MouseEvent, node: Node) => {
        const stateData = version.states.find((s: any) => s.id.toString() === node.id);
        const stat = stats?.stateDistribution?.find((s: any) => s.stateId.toString() === node.id);

        setSelectedItem({ type: 'state', data: stateData, stats: stat });
        if (stateData) fetchUsersForState(stateData.id); // Fetch users immediately
    };

    const onEdgeClick = (e: React.MouseEvent, edge: Edge) => {
        setSelectedItem({ type: 'transition', data: edge.data });
        setUsersList([]); // Clear users when selecting transition
    };

    // --- Edit Handlers ---
    const handleAddState = () => {
        setEditingState(null);
        setStateModalOpen(true);
    };

    const handleEditState = () => {
        if (selectedItem?.type === 'state') {
            setEditingState(selectedItem.data);
            setStateModalOpen(true);
        }
    };

    const handleEditTransition = () => {
        if (selectedItem?.type === 'transition') {
            setEditingTransition(selectedItem.data);
            setNewConnection({ source: selectedItem.data.fromStateId, target: selectedItem.data.toStateId });
            setTransitionModalOpen(true);
        }
    }

    const handleSaveState = async (data: any) => {
        try {
            const isEdit = !!editingState;
            const url = isEdit ? `/admin/api/fsm/states/${editingState.id}` : '/admin/api/fsm/states';
            const method = isEdit ? 'PUT' : 'POST';
            const payload = { ...data, versionId: parseInt(id as string) };

            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                setStateModalOpen(false);
                fetchGraph();
            }
        } catch (e) { console.error(e); }
    };

    const handleConnect = (params: Connection | Edge) => {
        setNewConnection({ source: params.source!, target: params.target! });
        setEditingTransition(null);
        setTransitionModalOpen(true);
    };

    const handleSaveTransition = async (data: any) => {
        try {
            const isEdit = !!editingTransition;
            const url = isEdit ? `/admin/api/fsm/transitions/${editingTransition.id}` : '/admin/api/fsm/transitions';
            const method = isEdit ? 'PUT' : 'POST';
            const payload = {
                ...data,
                versionId: parseInt(id as string),
                fromStateId: newConnection?.source || editingTransition.fromStateId,
                toStateId: newConnection?.target || editingTransition.toStateId
            };
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                setTransitionModalOpen(false);
                fetchGraph();
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="p-8">Loading Editor...</div>;
    if (!version) return <div className="p-8">Version not found</div>;

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="h-16 flex justify-between items-center px-6 border-b bg-white shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/fsm')}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">{version.name}</h2>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${version.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {version.isActive ? 'Active' : 'Draft'}
                            </span>
                        </div>
                        {stats && (
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Users size={12} /> {stats.totalActiveUsers} Active Users
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddState}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add State
                    </button>
                    <button
                        onClick={handleSaveLayout}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Save Layout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Canvas */}
                <div className="flex-1 bg-gray-50 relative">
                    <FSMCanvas
                        initialNodes={[]} // Unused
                        initialEdges={[]} // Unused
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onEdgeClick={onEdgeClick}
                        onConnect={handleConnect}
                    />
                </div>

                {/* Details Panel */}
                {selectedItem && (
                    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto shadow-xl z-20 flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-semibold text-gray-900">
                                {selectedItem.type === 'state' ? 'State Details' : 'Transition Logic'}
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                            {selectedItem.type === 'state' ? (
                                <>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{selectedItem.data.name}</div>
                                        {selectedItem.data.isTerminal && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">Terminal State</span>}
                                        {selectedItem.data.isInitial && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">Initial State</span>}
                                    </div>

                                    {/* USERS LIST with OVERLAYS */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                                <Users size={12} /> Users Here ({selectedItem.stats?.count || 0})
                                            </label>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg border border-gray-200 min-h-[100px] max-h-[400px] overflow-y-auto">
                                            {loadingUsers ? (
                                                <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>
                                            ) : usersList.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-400">No users in this state</div>
                                            ) : (
                                                <ul className="divide-y divide-gray-100">
                                                    {usersList.map((user: any) => (
                                                        <li key={user.id} className="p-3 hover:bg-white transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="font-medium text-sm text-gray-900">
                                                                        {user.firstName} {user.username ? `(@${user.username})` : ''}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                        <Clock size={10} />
                                                                        Last active {formatDistanceToNow(new Date(user.lastTransitionAt))} ago
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-gray-400 font-mono">#{user.telegramId}</div>
                                                            </div>

                                                            {/* ACTIVE OVERLAYS */}
                                                            {user.overlays && user.overlays.length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-1">
                                                                    {user.overlays.map((ov: any, idx: number) => (
                                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200" title={`Expires: ${ov.expiresAt ? new Date(ov.expiresAt).toLocaleString() : 'Never'}`}>
                                                                            <ShieldAlert size={10} className="mr-1" />
                                                                            {ov.type}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            onClick={handleEditState}
                                            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Edit State
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* TRANSITION DETAILS (Same as before) */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Trigger</label>
                                        <div className="mt-1 p-2 bg-gray-100 rounded text-sm font-mono">
                                            {selectedItem.data.triggerType === 'EVENT' ? selectedItem.data.triggerEvent : `${selectedItem.data.timeoutMinutes}m Timeout`}
                                        </div>
                                    </div>

                                    {/* RULES VISUALIZATION */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                            <Zap size={12} /> Execution Rules
                                        </label>

                                        {(!selectedItem.data.actions || selectedItem.data.actions.length === 0) ? (
                                            <div className="text-sm text-gray-400 italic mt-1">No actions configured</div>
                                        ) : (
                                            <div className="mt-2 space-y-3">
                                                {selectedItem.data.actions.map((action: any, i: number) => (
                                                    <div key={i} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                                                        <div className="font-semibold text-blue-600 mb-1">{action.type}</div>
                                                        <div className="text-xs text-gray-500 font-mono break-all">
                                                            {JSON.stringify(action.params || action.config || {})}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            onClick={handleEditTransition}
                                            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Edit Transition
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
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

            <ActionExecutionModal
                open={actionModalOpen}
                onOpenChange={setActionModalOpen}
                selectedCount={targetUserIds.length}
                actionType={actionType}
                setActionType={setActionType}
                actionConfig={actionConfig}
                setActionConfig={setActionConfig}
                availablePackages={availablePackages}
                loading={executingAction}
                onExecute={handleExecuteAction}
            />
        </div>
    );
}
