import { getOverlays } from '@/app/actions/overlay-actions';
import OverlaysDashboard from '@/components/overlays/OverlaysDashboard';

export const dynamic = 'force-dynamic';

export default async function OverlaysPage() {
    const overlays = await getOverlays();

    return (
        <div className="p-6">
            <OverlaysDashboard overlays={overlays} />
        </div>
    );
}
