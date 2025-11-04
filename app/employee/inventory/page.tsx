"use client";
import { EmployeeLayout } from '@/components/employee-layout';
import InventoryForm from '@/components/inventory-form';
import InventoryTable from '@/components/inventory-table';


export default function EmployeeInventoryPage() {
return (
<EmployeeLayout>
<div className="p-4 space-y-4">
<InventoryForm role="employee" />
<InventoryTable role="employee" />
</div>
</EmployeeLayout>
);
}