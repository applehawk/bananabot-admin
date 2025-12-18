'use client';

import { useState, useEffect } from 'react';
import { Prisma, Provider } from '@prisma/client';
import { LoaderIcon } from '@/components/tariffs/icons';
import { TariffsPageHeader } from '@/components/tariffs/TariffsPageHeader';
import { TariffsTable } from '@/components/tariffs/TariffsTable';
import { TariffEditorModal } from '@/components/tariffs/TariffEditorModal';

type ModelTariff = Prisma.ModelTariffGetPayload<{
    include: {
        provider: true;
    }
}>;

export default function TariffsPage() {
    const [tariffs, setTariffs] = useState<ModelTariff[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTariff, setEditingTariff] = useState<ModelTariff | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tariffsRes, providersRes] = await Promise.all([
                fetch('/admin/api/tariffs'),
                fetch('/admin/api/providers'),
            ]);
            const tariffsData = await tariffsRes.json();
            const providersData = await providersRes.json();
            setTariffs(tariffsData);
            setProviders(providersData);
        } catch (error) {
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData: Partial<ModelTariff>) => {
        try {
            const url = editingTariff
                ? `/admin/api/tariffs/${editingTariff.id}`
                : '/admin/api/tariffs';
            const method = editingTariff ? 'PUT' : 'POST';

            // Convert numeric strings to numbers, preserve undefined for empty fields
            const payload = {
                ...formData,
                inputPrice: formData.inputPrice ? Number(formData.inputPrice) : undefined,
                outputPrice: formData.outputPrice ? Number(formData.outputPrice) : undefined,
                outputImagePrice: formData.outputImagePrice ? Number(formData.outputImagePrice) : undefined,
                outputVideoPrice: formData.outputVideoPrice ? Number(formData.outputVideoPrice) : undefined,
                outputAudioPrice: formData.outputAudioPrice ? Number(formData.outputAudioPrice) : undefined,
                creditsPerSecond: formData.creditsPerSecond ? Number(formData.creditsPerSecond) : undefined,
                modelMargin: Number(formData.modelMargin) || 0,
                imageTokensLowRes: formData.imageTokensLowRes ? Number(formData.imageTokensLowRes) : undefined,
                imageTokensHighRes: formData.imageTokensHighRes ? Number(formData.imageTokensHighRes) : undefined,
                maxVideoDuration: formData.maxVideoDuration ? Number(formData.maxVideoDuration) : undefined,
                inputImagesLimit: formData.inputImagesLimit ? Number(formData.inputImagesLimit) : 5,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save tariff');

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Failed to save tariff');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const res = await fetch(`/admin/api/tariffs/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete tariff');

            fetchData();
        } catch (error) {
            alert('Failed to delete tariff');
        }
    };

    const openModal = (tariff?: ModelTariff) => {
        setEditingTariff(tariff || null);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoaderIcon />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen text-gray-900">
            <TariffsPageHeader onAddTariff={() => openModal()} />
            <TariffsTable
                tariffs={tariffs}
                onEdit={openModal}
                onDelete={handleDelete}
            />
            <TariffEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tariff={editingTariff}
                providers={providers}
                onSave={handleSave}
            />
        </div>
    );
}
