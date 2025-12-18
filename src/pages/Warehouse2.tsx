import { Header } from '@/components/Header';
import { WarehousePage } from '@/components/WarehousePage';

const Warehouse2 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <WarehousePage warehouseId="warehouse2" warehouseName="Skladište 2 - Inventura" />
      </main>
    </div>
  );
};

export default Warehouse2;
