import { Prisma } from '@prisma/client';
import { PencilIcon, TrashIcon } from './icons';

type ModelTariff = Prisma.ModelTariffGetPayload<{
    include: {
        provider: true;
    }
}>;

interface TariffTableRowProps {
    tariff: ModelTariff;
    onEdit: (tariff: ModelTariff) => void;
    onDelete: (id: string) => void;
}

export function TariffTableRow({ tariff, onEdit, onDelete }: TariffTableRowProps) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="p-4 font-medium">{tariff.name}</td>
            <td className="p-4 text-gray-600">{tariff.modelId}</td>
            <td className="p-4 text-gray-600">{tariff.provider?.name || '-'}</td>
            <td className="p-4 text-gray-600">{tariff.priceUnit}</td>
            <td className="p-4 text-gray-600">${tariff.inputPrice}</td>
            <td className="p-4 text-gray-600">${tariff.outputPrice}</td>
            <td className="p-4 text-gray-600">{(tariff.modelMargin * 100).toFixed(0)}%</td>
            <td className="p-4">
                <span
                    className={`px-2 py-1 rounded-full text-xs ${tariff.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                >
                    {tariff.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(tariff)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <PencilIcon />
                    </button>
                    <button
                        onClick={() => onDelete(tariff.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}
