import { Layout } from './components/Layout';
import { FarmSetup } from './pages/FarmSetup';
import { CropProduction } from './pages/CropProduction';
import { Summary } from './pages/Summary';
import { Marketing } from './pages/Marketing';
import { Equipment } from './pages/Equipment';
import { DataManagement } from './pages/DataManagement';
import { useFarmStore } from './store/farmStore';

export function App() {
    const activePage = useFarmStore(s => s.activePage);

    const pages: Record<string, React.ReactNode> = {
        setup: <FarmSetup />,
        production: <CropProduction />,
        summary: <Summary />,
        marketing: <Marketing />,
        equipment: <Equipment />,
        data: <DataManagement />,
    };

    return <Layout>{pages[activePage] ?? <FarmSetup />}</Layout>;
}
