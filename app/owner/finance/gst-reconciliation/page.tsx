'use me';
'use client';

import React from 'react';
import { ShieldCheck, Upload, FileCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OwnerGSTReconciliationPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-600" /> GSTR-2B Input Tax Credit Reconciliation
          </h1>
          <p className="text-sm text-slate-500">
            Compare purchase invoices against official GSTR-2B portal JSON data to maximize legal ITC claims.
          </p>
        </div>
      </div>

      <Card className="border-dashed py-12 text-center">
        <CardContent className="space-y-4">
          <Upload className="h-12 w-12 text-purple-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Upload GSTR-2B JSON File</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Upload your monthly GSTR-2B JSON statement downloaded from the GST Portal. The reconciliation engine will match purchase invoices against portal entries automatically.
            </p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
            Select GSTR-2B JSON File
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
