"use client";
import { useState } from 'react';


export default function InventoryForm({ role }: { role: 'owner' | 'employee' }) {
const [name, setName] = useState('');
const [category, setCategory] = useState('');
const [quantity, setQuantity] = useState<number>(0);
const api = process.env.NEXT_PUBLIC_API_URL || '';


const submit = async (e: React.FormEvent) => {
e.preventDefault();
try {
const res = await fetch(api + '/api/inventory', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name, category, quantity }),
});
if (!res.ok) throw new Error('Failed');
alert(role === 'owner' ? 'Item added' : 'Request sent');
setName('');
setCategory('');
setQuantity(0);
} catch (err) {
console.error(err);
alert('Error submitting');
}
};


return (
<form onSubmit={submit} className="bg-white p-4 rounded-md shadow">
<div className="grid grid-cols-1 gap-2">
<input
className="border p-2 rounded"
placeholder="Item name"
value={name}
onChange={(e) => setName(e.target.value)}
required
/>
<input
className="border p-2 rounded"
placeholder="Category"
value={category}
onChange={(e) => setCategory(e.target.value)}
/>
<input
className="border p-2 rounded"
type="number"
placeholder="Quantity"
value={quantity}
onChange={(e) => setQuantity(Number(e.target.value))}
/>
<button className="bg-blue-600 text-white px-3 py-2 rounded mt-2" type="submit">
{role === 'owner' ? 'Add Item' : 'Request Item'}
</button>
</div>
</form>
);
}