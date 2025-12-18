import { getOverlay } from '@/app/actions/overlay-actions';
import OverlayEditor from '@/components/overlays/OverlayEditor';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OverlayEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === 'new';
    let overlay = undefined;

    if (!isNew) {
        overlay = await getOverlay(id);
        if (!overlay) {
            notFound();
        }
    }

    return (
        <div className="p-6">
            <OverlayEditor overlay={overlay} />
        </div>
    );
}
