import { PlusIcon } from './icons';

interface TariffsPageHeaderProps {
    onAddTariff: () => void;
}

export function TariffsPageHeader({ onAddTariff }: TariffsPageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Model Tariffs</h1>
            <button
                onClick={onAddTariff}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                <PlusIcon />
                Add Tariff
            </button>
        </div>
    );
}
