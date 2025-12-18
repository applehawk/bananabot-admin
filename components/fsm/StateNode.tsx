import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, AlertCircle, Flag, CheckCircle, Zap } from 'lucide-react';

const StateNode = ({ data }: { data: any }) => {
    const isTerminal = data.isTerminal;
    const isInitial = data.isInitial;
    const userCount = data.userCount || 0;

    return (
        <div className={`
            px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px]
            ${isTerminal ? 'bg-red-50 border-red-500' : isInitial ? 'bg-green-50 border-green-500' : 'bg-white border-blue-500'} // Changed default border to blue for better visibility
        `}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />

            <div className="flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-1">
                    <span className="font-bold text-sm text-gray-900">{data.label}</span>
                    <div className="flex gap-1">
                        {isInitial && <Flag size={14} className="text-green-600" />}
                        {isTerminal && <AlertCircle size={14} className="text-red-600" />}
                    </div>
                </div>

                {/* Body: User Count */}
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 p-2 rounded flex-1">
                        <Users size={14} />
                        <span className="text-sm font-medium">{userCount} Users</span>
                    </div>
                    {/* Actions Button */}
                    <button
                        className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200 nodrag transition-colors"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent node selection
                            data.onActionClick && data.onActionClick(data.id);
                        }}
                        title="Execute Action for All Users"
                    >
                        <Zap size={14} className="fill-blue-600" />
                    </button>
                </div>
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
        </div>
    );
};

export default memo(StateNode);
