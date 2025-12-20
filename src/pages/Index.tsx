import { Header } from '@/components/Header';
import { WarehousePage } from '@/components/WarehousePage';
import { InstallPrompt } from '@/components/InstallPrompt';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <InstallPrompt />
      <Header />
      <main className="container mx-auto px-6 py-8">
        <WarehousePage warehouseId="warehouse1" warehouseName="Skladište 1 - Inventura" />
      </main>
    </div>
  );
};

export default Index;
