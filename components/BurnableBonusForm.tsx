'use client';

interface BurnableBonusFormProps {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;

    amount: string;
    setAmount: (val: string) => void;

    expiresIn: string; // hours
    setExpiresIn: (val: string) => void;

    conditionType: 'generations' | 'topup' | 'none';
    setConditionType: (val: 'generations' | 'topup' | 'none') => void;

    conditionValue: string;
    setConditionValue: (val: string) => void;
}

export default function BurnableBonusForm({
    enabled, setEnabled,
    amount, setAmount,
    expiresIn, setExpiresIn,
    conditionType, setConditionType,
    conditionValue, setConditionValue
}: BurnableBonusFormProps) {
    return (
        <div className="mt-4 border rounded-md p-4 bg-orange-50 border-orange-200">
            <label className="flex items-center space-x-2 font-medium text-orange-900 cursor-pointer mb-3">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>Attach Burnable Bonus</span>
            </label>

            {enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-orange-200 ml-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Amount (Credits)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
                                placeholder="50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Expires In (Hours)
                            </label>
                            <input
                                type="number"
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
                                placeholder="24"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Condition to Keep
                        </label>
                        <div className="flex space-x-4 mb-2">
                            <label className="inline-flex items-center text-sm">
                                <input
                                    type="radio"
                                    name="conditionType"
                                    checked={conditionType === 'generations'}
                                    onChange={() => setConditionType('generations')}
                                    className="text-orange-600 focus:ring-orange-500"
                                />
                                <span className="ml-1.5 text-gray-700">Generations</span>
                            </label>
                            <label className="inline-flex items-center text-sm">
                                <input
                                    type="radio"
                                    name="conditionType"
                                    checked={conditionType === 'topup'}
                                    onChange={() => setConditionType('topup')}
                                    className="text-orange-600 focus:ring-orange-500"
                                />
                                <span className="ml-1.5 text-gray-700">Top Up</span>
                            </label>
                            <label className="inline-flex items-center text-sm">
                                <input
                                    type="radio"
                                    name="conditionType"
                                    checked={conditionType === 'none'}
                                    onChange={() => setConditionType('none')}
                                    className="text-orange-600 focus:ring-orange-500"
                                />
                                <span className="ml-1.5 text-gray-700">None</span>
                            </label>
                        </div>

                        {conditionType !== 'none' && (
                            <div className="animate-in fade-in">
                                <label className="block text-xs text-gray-500 mb-1">
                                    {conditionType === 'generations' ? 'Number of Generations' : 'Top Up Amount (RUB)'}
                                </label>
                                <input
                                    type="number"
                                    value={conditionValue}
                                    onChange={(e) => setConditionValue(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
                                    placeholder={conditionType === 'generations' ? 'e.g. 5' : 'e.g. 100'}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
