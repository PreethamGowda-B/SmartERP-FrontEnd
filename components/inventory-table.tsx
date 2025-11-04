"use client";
import { useEffect, useState } from 'react';


type InventoryItem = {
id: number;
name: string;
category?: string;
quantity: number;
employee_name?: string;
office_name?: string;
};


export default function InventoryTable({ role }: { role: 'owner' | 'employee' }) {
const [items, setItems] = useState<InventoryItem[]>([]);
const api = process.env.NEXT_PUBLIC_API_URL || '';


useEffect(() => {
fetch(api + '/api/inventory')
.then((r) => r.json())
.then(setItems)
.catch(console.error);
}, []);


return (
<div className="bg-white shadow rounded-md overflow-hidden">
<table className="w-full text-sm">
<thead className="bg-gray-50">
<tr>
<th className="p-2 text-left">Name</th>
<th className="p-2 text-left">Category</th>
<th className="p-2 text-left">Quantity</th>
{role === 'owner' && <th className="p-2 text-left">Employee</th>}
{role === 'owner' && <th className="p-2 text-left">Office</th>}
</tr>
</thead>
<tbody>
{items.map((i) => (
<tr key={i.id} className="border-b hover:bg-gray-50">
<td className="p-2">{i.name}</td>
<td className="p-2">{i.category || '-'}</td>
<td className="p-2">{i.quantity}</td>
{role === 'owner' && <td className="p-2">{i.employee_name || '-'}</td>}
{role === 'owner' && <td className="p-2">{i.office_name || '-'}</td>}
</tr>
))}
</tbody>
</table>
</div>
);
}