'use client';

import React from 'react';
import { TrendingUp, FileText, Download, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OwnerFinancialReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-600" /> Financial Statements & Reports
          </h1>
          <p className="text-sm text-slate-500">
            Profit & Loss, Revenue Breakdown by Customer, and Expense Summaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" /> Profit & Loss Statement
            </CardTitle>
            <CardDescription className="text-xs">Summary of job revenues versus employee labor & inventory material costs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between text-xs">
              <span>Export P&L Summary (PDF)</span>
              <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" /> Revenue by Customer
            </CardTitle>
            <CardDescription className="text-xs">Client-wise total billing and collection breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between text-xs">
              <span>Export Revenue Report (CSV / XLSX)</span>
              <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
