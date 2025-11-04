"use client";
import { OwnerLayout } from '@/components/owner-layout';
import InventoryTable from '@/components/inventory-table';


export default function OwnerInventoryPage() {
return (
<OwnerLayout>
<div className="p-4 space-y-4">
<InventoryTable role="owner" />
</div>
</OwnerLayout>
);
}