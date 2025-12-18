import { Prisma } from '@prisma/client';
import { TariffTableRow } from './TariffTableRow';

type ModelTariff = Prisma.ModelTariffGetPayload<{
    include: {
        provider: true;
    }
}>;

interface TariffsTableProps {
    tariffs: ModelTariff[];
    onEdit: (tariff: ModelTariff) => void;
    onDelete: (id: string) => void;
}

export function TariffsTable({ tariffs, onEdit, onDelete }: TariffsTableProps) {
    return (
        <div className="bg-white border rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-4 font-semibold text-gray-600">Name</th>
                        <th className="p-4 font-semibold text-gray-600">Model ID</th>
                        <th className="p-4 font-semibold text-gray-600">Provider</th>
                        <th className="p-4 font-semibold text-gray-600">Price Unit</th>
                        <th className="p-4 font-semibold text-gray-600">Input Price</th>
                        <th className="p-4 font-semibold text-gray-600">Output Price</th>
                        <th className="p-4 font-semibold text-gray-600">Margin</th>
                        <th className="p-4 font-semibold text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-gray-600 w-[100px]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {tariffs.map((tariff) => (
                        <TariffTableRow
                            key={tariff.id}
                            tariff={tariff}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
