'use client';

import { Prisma } from '@prisma/client';

type Transaction = Prisma.TransactionGetPayload<{
    include: {
        user: {
            select: {
                username: true;
                firstName: true;
                telegramId: true;
            }
        };
        package: {
            select: {
                name: true;
            }
        };
    }
}>;

interface TransactionDetailsModalProps {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function TransactionDetailsModal({ transaction, isOpen, onClose }: TransactionDetailsModalProps) {
    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none bg-black/50 backdrop-blur-sm">
            <div className="relative z-50 w-full max-w-2xl mx-auto my-6">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                        <h3 className="text-2xl font-semibold">
                            Transaction Details
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none opacity-50 hover:opacity-100"
                            onClick={onClose}
                        >
                            <span className="bg-transparent text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                                ×
                            </span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">ID</span>
                                <span className="text-gray-600 font-mono text-sm break-all">{transaction.id}</span>
                            </div>
                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">Date</span>
                                <span className="text-gray-600 text-sm">
                                    {new Date(transaction.createdAt).toLocaleString()}
                                </span>
                            </div>

                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">Status</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded inline-block ${transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {transaction.status}
                                </span>
                            </div>
                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">Type</span>
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded inline-block">
                                    {transaction.type}
                                </span>
                            </div>

                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">User</span>
                                <span className="text-gray-600 text-sm">
                                    {transaction.user.firstName || transaction.user.username}
                                    <span className="text-gray-400 text-xs ml-1">({transaction.user.telegramId.toString()})</span>
                                </span>
                            </div>
                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">Payment Method</span>
                                <span className="text-gray-600 text-sm">{transaction.paymentMethod}</span>
                            </div>

                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">Amount</span>
                                <span className="text-gray-600 text-sm font-medium">
                                    {transaction.amount ? `${transaction.amount} ${transaction.currency || 'USD'}` : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-gray-700 text-sm font-bold mb-1">Credits Added</span>
                                <span className={`text-sm font-medium ${transaction.creditsAdded > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.creditsAdded > 0 ? '+' : ''}{transaction.creditsAdded}
                                </span>
                            </div>

                            {transaction.package && (
                                <div className="col-span-2">
                                    <span className="block text-gray-700 text-sm font-bold mb-1">Package</span>
                                    <span className="text-gray-600 text-sm">{transaction.package.name}</span>
                                </div>
                            )}

                            {transaction.paymentId && (
                                <div className="col-span-2">
                                    <span className="block text-gray-700 text-sm font-bold mb-1">External Payment ID</span>
                                    <span className="text-gray-600 font-mono text-sm">{transaction.paymentId}</span>
                                </div>
                            )}
                            {transaction.description && (
                                <div className="col-span-2">
                                    <span className="block text-gray-700 text-sm font-bold mb-1">Description</span>
                                    <span className="text-gray-600 text-sm">{transaction.description}</span>
                                </div>
                            )}
                        </div>

                        {/* Metadata JSON */}
                        {transaction.metadata && (
                            <div className="mt-6">
                                <span className="block text-gray-700 text-sm font-bold mb-2">Metadata</span>
                                <div className="bg-gray-50 rounded border border-gray-200 p-4 overflow-x-auto">
                                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                                        {JSON.stringify(transaction.metadata, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Raw JSON Debug View */}
                        <div className="mt-6 border-t pt-4">
                            <details>
                                <summary className="text-xs text-gray-500 cursor-pointer">View Raw Transaction Data</summary>
                                <div className="mt-2 bg-gray-50 rounded border border-gray-200 p-4 overflow-x-auto">
                                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                                        {JSON.stringify(transaction, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b">
                        <button
                            className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            type="button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black" onClick={onClose}></div>
        </div>
    );
}
