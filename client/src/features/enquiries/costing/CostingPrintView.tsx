import { ICosting } from "../../../interfaces/costing.interface";
import { ICopperPipeRateConfig } from "../../../api/costing.api";

interface CostingPrintViewProps {
  costing: ICosting;
  copperPipeRates: ICopperPipeRateConfig[];
}

export function CostingPrintView({ costing, copperPipeRates }: CostingPrintViewProps) {
  const { summary, highSide, lowSide } = costing;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(1)}%`;
  };

  return (
    <div className="hidden print:block p-8 bg-white text-black min-h-screen text-[12px] font-sans leading-tight">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
            height: 0;
            margin: 0;
            border: 0;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          @page {
            margin: 15mm 15mm 15mm 15mm;
            size: A4 portrait;
          }
          tr {
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      ` }} />
      {/* 1. DOCUMENT HEADER */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Continental HVAC Costing Sheet</h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">Revision {costing.revision} • {costing.isActive ? "ACTIVE" : "ARCHIVED"}</p>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase">Enquiry No: {costing.enquiryNo}</p>
            <p className="text-slate-500">Date: {new Date(costing.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Project Name</span>
            <span className="font-semibold text-slate-900">{costing.projectName}</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Location</span>
            <span className="font-semibold text-slate-900">{costing.location}</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Client</span>
            <span className="font-semibold text-slate-900">{costing.clientName}</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Capacity (TR)</span>
            <span className="font-semibold text-slate-900">{costing.totalTR} TR</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Prepared By</span>
            <span className="font-semibold text-slate-900">{costing.preparedBy}</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Approved By</span>
            <span className="font-semibold text-slate-900">{costing.approvedBy}</span>
          </div>
        </div>
      </div>

      {/* 2. COST SUMMARY SECTION */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2 tracking-wider">I. Cost Summary (Accounts Dept)</h2>
        <table className="w-full border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="border border-slate-300 p-2 text-left">Sr. No</th>
              <th className="border border-slate-300 p-2 text-left">Description</th>
              <th className="border border-slate-300 p-2 text-right">Project Value (Excl. Tax)</th>
              <th className="border border-slate-300 p-2 text-right">Total Expense (Excl. Tax)</th>
              <th className="border border-slate-300 p-2 text-right">Over Head</th>
              <th className="border border-slate-300 p-2 text-right">Profit</th>
              <th className="border border-slate-300 p-2 text-right">Total Price (Incl. Tax)</th>
              <th className="border border-slate-300 p-2 text-right">Price per TR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2">1</td>
              <td className="border border-slate-300 p-2 font-semibold">HIGH SIDE WORK</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.highSideProjectValueExclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.highSideTotalExpenseExclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.highSideOverhead)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.highSideProfit)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.highSideTotalPriceInclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.highSidePricePerTR)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-2">2</td>
              <td className="border border-slate-300 p-2 font-semibold">LOW SIDE WORK</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.lowSideProjectValueExclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.lowSideTotalExpenseExclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.lowSideOverhead)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.lowSideProfit)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.lowSideTotalPriceInclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.lowSidePricePerTR)}</td>
            </tr>
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
              <td className="border border-slate-300 p-2" colSpan={2}>TOTAL</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.totalProjectValueExclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.totalExpenseExclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.totalOverhead)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.totalProfit)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.totalPriceInclTax)}</td>
              <td className="border border-slate-300 p-2 text-right">{formatCurrency(summary.totalPricePerTR)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="page-break-before" />

      {/* 3. HIGH SIDE DETAIL */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2 tracking-wider">II. High Side Works Detail (Equipment)</h2>
        <table className="w-full border-collapse border border-slate-300 text-[11px] mb-4">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="border border-slate-300 p-1.5 text-left w-16">Sr. No</th>
              <th className="border border-slate-300 p-1.5 text-left">Equipment Description</th>
              <th className="border border-slate-300 p-1.5 text-center w-20">Qty</th>
              <th className="border border-slate-300 p-1.5 text-right w-32">Unit Rate</th>
              <th className="border border-slate-300 p-1.5 text-right w-32">Total Rate</th>
              <th className="border border-slate-300 p-1.5 text-right w-36">CPF (Client Price)</th>
            </tr>
          </thead>
          <tbody>
            {highSide.equipment.map((eq, i) => (
              <tr key={i}>
                <td className="border border-slate-300 p-1.5">{i + 1}</td>
                <td className="border border-slate-300 p-1.5 font-medium">{eq.description}</td>
                <td className="border border-slate-300 p-1.5 text-center">{eq.qty}</td>
                <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(eq.unitRate)}</td>
                <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(eq.qty * eq.unitRate)}</td>
                <td className="border border-slate-300 p-1.5 text-right font-bold text-amber-800">
                  {formatCurrency(eq.cpf ?? (eq.qty * eq.unitRate * (1 + highSide.gstPercent)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* High Side Markups */}
        <div className="w-1/2 ml-auto">
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Design & Planning:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.designPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Warranty & Service:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.warrantyPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Freight & Transportation:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.transportationPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Unloading & Shifting:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.unloadingPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Bank Charges:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.bankChargesPercent)}</td>
              </tr>
              <tr className="border-t border-slate-300">
                <td className="py-1 text-slate-800 font-bold">Total Expense (Excl. Tax):</td>
                <td className="py-1 text-right text-slate-900 font-bold">{formatCurrency(summary.highSideTotalExpenseExclTax)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Profit Markup:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.profitPercent)} ({formatCurrency(summary.highSideProfit)})</td>
              </tr>
              <tr className="border-t border-slate-300">
                <td className="py-1 text-slate-800 font-bold">Project Value (Excl. Tax):</td>
                <td className="py-1 text-right text-slate-900 font-bold">{formatCurrency(summary.highSideProjectValueExclTax)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">GST Rate:</td>
                <td className="py-1 text-right font-medium">{formatPercent(highSide.gstPercent)}</td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="py-1.5 text-slate-900 font-bold text-[12px]">Final High-Side Value (with Tax):</td>
                <td className="py-1.5 text-right text-slate-900 font-bold text-[12px]">{formatCurrency(summary.highSideTotalPriceInclTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-break-before" />

      {/* 4. LOW SIDE DETAIL */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2 tracking-wider">III. Low Side Works Detail (Contracting)</h2>
        <table className="w-full border-collapse border border-slate-300 text-[11px] mb-4">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300 text-[10px]">
              <th className="border border-slate-300 p-1 text-left w-12">Sr</th>
              <th className="border border-slate-300 p-1 text-left">Description</th>
              <th className="border border-slate-300 p-1 text-center w-12">Qty</th>
              <th className="border border-slate-300 p-1 text-center w-12">Unit</th>
              <th className="border border-slate-300 p-1 text-right w-24">Material Cost</th>
              <th className="border border-slate-300 p-1 text-right w-24">Labour Cost</th>
              <th className="border border-slate-300 p-1 text-right w-24">Total Cost</th>
              <th className="border border-slate-300 p-1 text-right w-24">Q. Rate (Excl Tax)</th>
            </tr>
          </thead>
          <tbody>
            {lowSide.items.map((item) => (
              <tr key={item.srNo}>
                <td className="border border-slate-300 p-1">{item.srNo}</td>
                <td className="border border-slate-300 p-1">{item.description}</td>
                <td className="border border-slate-300 p-1 text-center">{item.qty || "—"}</td>
                <td className="border border-slate-300 p-1 text-center">{item.unit}</td>
                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.materialRate)}</td>
                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.labourRate)}</td>
                <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(item.materialRate + item.labourRate)}</td>
                <td className="border border-slate-300 p-1 text-right font-medium text-slate-800">{formatCurrency(item.qRate || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Low Side Markups */}
        <div className="w-1/2 ml-auto">
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Design & Coordination:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.designPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Warranty Support:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.warrantyPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Contingency:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.contingencyPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Local Transportation:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.transportationPercent)}</td>
              </tr>
              {lowSide.accommodationValue > 0 && (
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Accommodation & Food:</td>
                  <td className="py-1 text-right font-medium">{formatCurrency(lowSide.accommodationValue)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-slate-600 font-medium">Unloading:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.unloadingPercent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Bank Charges:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.bankChargesPercent)}</td>
              </tr>
              <tr className="border-t border-slate-300">
                <td className="py-1 text-slate-800 font-bold">Total Expense (Excl. Tax):</td>
                <td className="py-1 text-right text-slate-900 font-bold">{formatCurrency(summary.lowSideTotalExpenseExclTax)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Profit Markup:</td>
                <td className="py-1 text-right font-medium">{formatPercent(lowSide.profitPercent)} ({formatCurrency(summary.lowSideProfit)})</td>
              </tr>
              {(() => {
                const expenseProjectValue = Math.round(summary.lowSideTotalExpenseExclTax) + Math.round(summary.lowSideProfit);
                const expenseGst = Math.round(expenseProjectValue * lowSide.gstPercent);
                const expenseFinal = expenseProjectValue + expenseGst;
                return (
                  <>
                    <tr className="border-t border-slate-300">
                      <td className="py-1 text-slate-800 font-bold">Project Value (Excl. Tax):</td>
                      <td className="py-1 text-right text-slate-900 font-bold">{formatCurrency(expenseProjectValue)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-medium">GST Rate:</td>
                      <td className="py-1 text-right font-medium">{formatPercent(lowSide.gstPercent)} ({formatCurrency(expenseGst)})</td>
                    </tr>
                    <tr className="border-t border-slate-300">
                      <td className="py-1 text-slate-850 font-semibold">Final Project Value:</td>
                      <td className="py-1 text-right text-slate-900 font-semibold">{formatCurrency(expenseFinal)}</td>
                    </tr>
                  </>
                );
              })()}
              <tr className="border-t border-slate-300">
                <td colSpan={2} className="py-0.5 text-center text-slate-400 italic">— Q. Rate Client Quote —</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">Q. Rate Project Value (Excl. Tax):</td>
                <td className="py-1 text-right font-semibold text-slate-800">
                  {(() => {
                    const quoteProjectValue = lowSide.items.reduce((sum, item) => sum + Math.round(item.qRate || 0), 0);
                    return formatCurrency(quoteProjectValue);
                  })()}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600 font-medium">GST on Q. Rate:</td>
                <td className="py-1 text-right font-medium text-slate-700">
                  {(() => {
                    const quoteProjectValue = lowSide.items.reduce((sum, item) => sum + Math.round(item.qRate || 0), 0);
                    const quoteGst = Math.round(quoteProjectValue * lowSide.gstPercent);
                    return formatCurrency(quoteGst);
                  })()}
                </td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="py-1.5 text-slate-900 font-bold text-[12px]">Final Low-Side Value (with Tax):</td>
                <td className="py-1.5 text-right text-slate-900 font-bold text-[12px]">
                  {(() => {
                    const quoteProjectValue = lowSide.items.reduce((sum, item) => sum + Math.round(item.qRate || 0), 0);
                    const quoteGst = Math.round(quoteProjectValue * lowSide.gstPercent);
                    return formatCurrency(quoteProjectValue + quoteGst);
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-break-before" />

      {/* 5. DETAILED MATERIAL ESTIMATES SUMMARY */}
      <div className="mb-6">
        <h2 className="text-[13px] font-bold uppercase border-b-2 border-black pb-1.5 mb-4 tracking-wider">IV. Detailed Material Estimates Summary</h2>
        <div className="space-y-5">
          {/* Section 1: Installation */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">1. Installation Accessories</h3>
            <table className="w-full border-collapse border border-slate-350 text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-350">
                  <th className="border border-slate-300 p-1.5 text-left">Description</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Qty</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Unit</th>
                  <th className="border border-slate-300 p-1.5 text-right w-28">Unit Rate</th>
                  <th className="border border-slate-300 p-1.5 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {(lowSide.materialEstimate.installation?.items || []).map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="border border-slate-300 p-1.5">{item.description}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">{item.qty}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-500">{item.unit}</td>
                    <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(item.ur)}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(item.qty * item.ur)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-100/70 border-t-2 border-slate-300">
                  <td colSpan={4} className="border border-slate-300 p-1.5 text-right">Subtotal:</td>
                  <td className="border border-slate-300 p-1.5 text-right text-slate-900">
                    {formatCurrency((lowSide.materialEstimate.installation?.items || []).reduce((s, i) => s + (i.qty * i.ur), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Testing */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">2. Testing & Commissioning</h3>
            <table className="w-full border-collapse border border-slate-350 text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-350">
                  <th className="border border-slate-300 p-1.5 text-left">Description</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Qty</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Unit</th>
                  <th className="border border-slate-300 p-1.5 text-right w-28">Unit Rate</th>
                  <th className="border border-slate-300 p-1.5 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {(lowSide.materialEstimate.testingCommissioning?.items || []).map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="border border-slate-300 p-1.5">{item.description}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">{item.qty}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-500">{item.unit}</td>
                    <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(item.ur)}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(item.qty * item.ur)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-100/70 border-t-2 border-slate-300">
                  <td colSpan={4} className="border border-slate-300 p-1.5 text-right">Subtotal:</td>
                  <td className="border border-slate-300 p-1.5 text-right text-slate-900">
                    {formatCurrency((lowSide.materialEstimate.testingCommissioning?.items || []).reduce((s, i) => s + (i.qty * i.ur), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Ref Piping */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">3. Refrigerant Piping</h3>
            <div className="border border-slate-300 p-2.5 space-y-3">
              {/* Copper Pipes */}
              <div>
                <div className="text-[10px] font-bold text-slate-700 mb-1 pl-1">Copper Pipes:</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-1 text-left">Size</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Type</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Qty (Rmt)</th>
                      <th className="border border-slate-300 p-1 text-right w-24">Unit Rate</th>
                      <th className="border border-slate-300 p-1 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowSide.materialEstimate.refPiping.copperPipes.map((p, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                        <td className="border border-slate-300 p-1 font-semibold">{p.size}</td>
                        <td className="border border-slate-300 p-1 text-center capitalize text-slate-500">{p.type}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{p.qty}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatCurrency(p.ur)}</td>
                        <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(p.qty * p.ur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Insulation */}
              <div>
                <div className="text-[10px] font-bold text-slate-700 mb-1 pl-1">Insulation:</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-1 text-left">Size</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Qty (Nos)</th>
                      <th className="border border-slate-300 p-1 text-right w-24">Unit Rate</th>
                      <th className="border border-slate-300 p-1 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowSide.materialEstimate.refPiping.insulation.map((ins, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                        <td className="border border-slate-300 p-1 font-semibold">{ins.size}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{ins.qty}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatCurrency(ins.ur)}</td>
                        <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(ins.qty * ins.ur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Accessories */}
              <div>
                <div className="text-[10px] font-bold text-slate-700 mb-1 pl-1">Accessories:</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-1 text-left">Description</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Qty</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Unit</th>
                      <th className="border border-slate-300 p-1 text-right w-24">Unit Rate</th>
                      <th className="border border-slate-300 p-1 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lowSide.materialEstimate.refPiping.accessories || []).map((acc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                        <td className="border border-slate-300 p-1">{acc.description}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{acc.qty}</td>
                        <td className="border border-slate-300 p-1 text-center text-slate-500">{acc.unit}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatCurrency(acc.ur)}</td>
                        <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(acc.qty * acc.ur)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-50 border-t border-slate-300">
                      <td colSpan={4} className="border border-slate-300 p-1 text-right">Subtotal Refrigerant Piping:</td>
                      <td className="border border-slate-300 p-1 text-right text-slate-900">
                        {formatCurrency(
                          lowSide.materialEstimate.refPiping.copperPipes.reduce((s, p) => s + (p.qty * p.ur), 0) +
                          lowSide.materialEstimate.refPiping.insulation.reduce((s, i) => s + (i.qty * i.ur), 0) +
                          (lowSide.materialEstimate.refPiping.accessories || []).reduce((s, a) => s + (a.qty * a.ur), 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break-before" />

      <div className="mb-6">
        <div className="space-y-5">
          {/* Section 4 & 5: Cabling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">4. Control Cabling</h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-55 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-1.5 text-left">Size</th>
                    <th className="border border-slate-300 p-1.5 text-center w-14">Qty (Rmt)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">UR</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lowSide.materialEstimate.controlCabling.cables.map((c, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5">{c.size}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{c.qty}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(c.ur)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(c.qty * c.ur)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-100/50">
                    <td colSpan={3} className="border border-slate-300 p-1.5 text-right">Total:</td>
                    <td className="border border-slate-300 p-1.5 text-right">
                      {formatCurrency(lowSide.materialEstimate.controlCabling.cables.reduce((s, c) => s + (c.qty * c.ur), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">5. Power Cabling</h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-55 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-1.5 text-left">Size</th>
                    <th className="border border-slate-300 p-1.5 text-center w-14">Qty (Rmt)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">UR</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lowSide.materialEstimate.powerCabling.cables.map((c, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5">{c.size}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{c.qty}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(c.ur)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(c.qty * c.ur)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-100/50">
                    <td colSpan={3} className="border border-slate-300 p-1.5 text-right">Total:</td>
                    <td className="border border-slate-300 p-1.5 text-right">
                      {formatCurrency(lowSide.materialEstimate.powerCabling.cables.reduce((s, c) => s + (c.qty * c.ur), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Drain Piping */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">6. Drain Piping</h3>
            <table className="w-full border-collapse border border-slate-350 text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-350">
                  <th className="border border-slate-300 p-1.5 text-left">Description/Size</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Qty</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Unit</th>
                  <th className="border border-slate-300 p-1.5 text-right w-28">Unit Rate</th>
                  <th className="border border-slate-300 p-1.5 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {lowSide.materialEstimate.drainPiping.pvcPipes.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                    <td className="border border-slate-300 p-1.5 font-semibold">{p.size} PVC Pipe</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{p.qty}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-500">Rmt</td>
                    <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(p.ur)}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(p.qty * p.ur)}</td>
                  </tr>
                ))}
                {(lowSide.materialEstimate.drainPiping.accessories || []).map((acc, idx) => (
                  <tr key={idx} className={(idx + lowSide.materialEstimate.drainPiping.pvcPipes.length) % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                    <td className="border border-slate-300 p-1.5">{acc.description}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{acc.qty}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-500">{acc.unit}</td>
                    <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(acc.ur)}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(acc.qty * acc.ur)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-100/70 border-t-2 border-slate-300">
                  <td colSpan={4} className="border border-slate-300 p-1.5 text-right">Subtotal Drain Piping:</td>
                  <td className="border border-slate-300 p-1.5 text-right text-slate-900">
                    {formatCurrency(
                      lowSide.materialEstimate.drainPiping.pvcPipes.reduce((s, p) => s + (p.qty * p.ur), 0) +
                      (lowSide.materialEstimate.drainPiping.accessories || []).reduce((s, a) => s + (a.qty * a.ur), 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 7: Ducting & Accessories */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">7. Ducting Sheet Metal & Canvas Accessories</h3>
            <div className="border border-slate-300 p-2.5 space-y-3">
              {/* GSS Ducting */}
              <div>
                <div className="text-[10px] font-bold text-slate-700 mb-1 pl-1">GSS Ducting:</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-1 text-left">Gauge</th>
                      <th className="border border-slate-300 p-1 text-center w-14">Qty (Sq.m)</th>
                      <th className="border border-slate-300 p-1 text-center w-14">No. Sheets</th>
                      <th className="border border-slate-300 p-1 text-center w-14">Wt/Sheet</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Total Wt (Kg)</th>
                      <th className="border border-slate-300 p-1 text-right w-20">Rate/Kg</th>
                      <th className="border border-slate-300 p-1 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowSide.materialEstimate.ducting.gssDucting.map((d, idx) => {
                      const numSheets = d.qtySqMtr / 3;
                      const totalWt = numSheets * d.wtPerSheet;
                      const totalCost = totalWt * d.ratePerKg;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                          <td className="border border-slate-300 p-1 font-semibold">{d.gauge}</td>
                          <td className="border border-slate-300 p-1 text-center font-bold">{d.qtySqMtr}</td>
                          <td className="border border-slate-300 p-1 text-center">{numSheets.toFixed(2)}</td>
                          <td className="border border-slate-300 p-1 text-center text-slate-500">{d.wtPerSheet}</td>
                          <td className="border border-slate-300 p-1 text-center font-semibold">{totalWt.toFixed(2)}</td>
                          <td className="border border-slate-300 p-1 text-right">{formatCurrency(d.ratePerKg)}</td>
                          <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(totalCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Insulation details */}
              <div>
                <div className="text-[10px] font-bold text-slate-700 mb-1 pl-1">Thermal & Acoustic Insulation:</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-1 text-left">Insulation Type</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Qty (Sq.m)</th>
                      <th className="border border-slate-300 p-1 text-right w-24">Unit Rate</th>
                      <th className="border border-slate-300 p-1 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const qty24 = lowSide.materialEstimate.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
                      const qty22 = lowSide.materialEstimate.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
                      return (
                        <>
                          <tr className="bg-white">
                            <td className="border border-slate-300 p-1 font-medium">Thermal Insulation (under 24 SWG)</td>
                            <td className="border border-slate-300 p-1 text-center font-bold">{qty24}</td>
                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(lowSide.materialEstimate.ducting.thermalInsulationUR)}</td>
                            <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(qty24 * lowSide.materialEstimate.ducting.thermalInsulationUR)}</td>
                          </tr>
                          <tr className="bg-slate-50/20">
                            <td className="border border-slate-300 p-1 font-medium">Acoustic Insulation (under 22 SWG)</td>
                            <td className="border border-slate-300 p-1 text-center font-bold">{qty22}</td>
                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(lowSide.materialEstimate.ducting.acousticInsulationUR)}</td>
                            <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(qty22 * lowSide.materialEstimate.ducting.acousticInsulationUR)}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Accessories */}
              <div>
                <div className="text-[10px] font-bold text-slate-700 mb-1 pl-1">Ducting Accessories:</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-1 text-left">Description</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Qty</th>
                      <th className="border border-slate-300 p-1 text-center w-16">Unit</th>
                      <th className="border border-slate-300 p-1 text-right w-24">Unit Rate</th>
                      <th className="border border-slate-300 p-1 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lowSide.materialEstimate.ducting.accessories || []).map((acc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                        <td className="border border-slate-300 p-1">{acc.description}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{acc.qty}</td>
                        <td className="border border-slate-300 p-1 text-center text-slate-500">{acc.unit}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatCurrency(acc.ur)}</td>
                        <td className="border border-slate-300 p-1 text-right font-medium">{formatCurrency(acc.qty * acc.ur)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-50 border-t border-slate-300">
                      <td colSpan={4} className="border border-slate-300 p-1 text-right">Subtotal GSS Ducting & Accessories:</td>
                      <td className="border border-slate-300 p-1 text-right text-slate-900">
                        {(() => {
                          let gssTotal = 0;
                          lowSide.materialEstimate.ducting.gssDucting.forEach(d => {
                            gssTotal += (d.qtySqMtr / 3) * d.wtPerSheet * d.ratePerKg;
                          });
                          const qty24 = lowSide.materialEstimate.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
                          const qty22 = lowSide.materialEstimate.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
                          const thermCost = qty24 * lowSide.materialEstimate.ducting.thermalInsulationUR;
                          const acousCost = qty22 * lowSide.materialEstimate.ducting.acousticInsulationUR;
                          const accCost = (lowSide.materialEstimate.ducting.accessories || []).reduce((s, a) => s + (a.qty * a.ur), 0);
                          return formatCurrency(gssTotal + thermCost + acousCost + accCost);
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break-before" />

      <div className="mb-6">
        <div className="space-y-5">
          {/* Section 8: Air Terminals */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">8. Air Terminals</h3>
            <table className="w-full border-collapse border border-slate-350 text-[10px] mt-1">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-1.5 text-left">Grill Description</th>
                  <th className="border border-slate-300 p-1.5 text-center w-14">Qty</th>
                  <th className="border border-slate-300 p-1.5 text-center w-14">Unit</th>
                  <th className="border border-slate-300 p-1.5 text-center w-14">Area</th>
                  <th className="border border-slate-300 p-1.5 text-right w-20">Rate/Sq.ft or Unit</th>
                  <th className="border border-slate-300 p-1.5 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {(lowSide.materialEstimate.airTerminals?.items || []).map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                    <td className="border border-slate-300 p-1.5 font-semibold">{item.description}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{item.qty || "—"}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-500">{item.unit}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-medium">{item.area ? `${item.area.toFixed(2)} Sq.m` : "—"}</td>
                    <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(item.ur)}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-medium">
                      {formatCurrency(item.area && item.area > 0 ? item.area * item.ur : item.qty * item.ur)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-100/70 border-t-2 border-slate-300">
                  <td colSpan={5} className="border border-slate-300 p-1.5 text-right">Total Air Terminals (incl. freight):</td>
                  <td className="border border-slate-300 p-1.5 text-right text-slate-900">
                    {(() => {
                      const itemTotal = (lowSide.materialEstimate.airTerminals?.items || [])
                        .filter(i => i.description.toLowerCase() !== "freight")
                        .reduce((s, i) => s + ((i.area && i.area > 0) ? i.area * i.ur : i.qty * i.ur), 0);
                      const fRate = lowSide.materialEstimate.airTerminals?.freightRate !== undefined ? lowSide.materialEstimate.airTerminals.freightRate : 0.10;
                      return formatCurrency(itemTotal * (1 + fRate));
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 9: Eyeball Diffuser */}
          {lowSide.materialEstimate.eyeballDiffuser?.items && lowSide.materialEstimate.eyeballDiffuser.items.some(i => i.qty > 0) && (
            <div>
              <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">9. Eyeball Diffuser</h3>
              <table className="w-full border-collapse border border-slate-350 text-[10px] mt-1">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-1.5 text-left">Description</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Qty</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Unit</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Unit Rate</th>
                    <th className="border border-slate-300 p-1.5 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(lowSide.materialEstimate.eyeballDiffuser?.items || []).map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5">{item.description}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{item.qty}</td>
                      <td className="border border-slate-300 p-1.5 text-center text-slate-500">{item.unit}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(item.ur)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(item.qty * item.ur)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-100/70 border-t-2 border-slate-300">
                    <td colSpan={4} className="border border-slate-300 p-1.5 text-right">Total Eyeball Diffuser (incl. freight):</td>
                    <td className="border border-slate-300 p-1.5 text-right text-slate-900">
                      {(() => {
                        const itemTotal = (lowSide.materialEstimate.eyeballDiffuser?.items || []).reduce((s, i) => s + (i.qty * i.ur), 0);
                        const fRate = lowSide.materialEstimate.eyeballDiffuser?.freightRate !== undefined ? lowSide.materialEstimate.eyeballDiffuser.freightRate : 0.10;
                        return formatCurrency(itemTotal * (1 + fRate));
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Section 10 & 11: ODU Stand and PVC Casing Cap */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">10. ODU Stand</h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-55 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-1.5 text-left">Description</th>
                    <th className="border border-slate-300 p-1.5 text-center w-14">Qty</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">UR</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(lowSide.materialEstimate.oduStand?.items || []).map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5">{item.description}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{item.qty}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(item.ur)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(item.qty * item.ur)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-100/50">
                    <td colSpan={3} className="border border-slate-300 p-1.5 text-right">Total:</td>
                    <td className="border border-slate-300 p-1.5 text-right font-bold text-slate-900">
                      {formatCurrency((lowSide.materialEstimate.oduStand?.items || []).reduce((s, i) => s + (i.qty * i.ur), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg">11. PVC Casing Cap</h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-55 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-1.5 text-left">Description</th>
                    <th className="border border-slate-300 p-1.5 text-center w-14">Qty (Rmt)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">UR</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(lowSide.materialEstimate.pvcCasingCap?.items || []).map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5">{item.description}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{item.qty}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(item.ur)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(item.qty * item.ur)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-100/50">
                    <td colSpan={3} className="border border-slate-300 p-1.5 text-right">Total:</td>
                    <td className="border border-slate-300 p-1.5 text-right font-bold text-slate-900">
                      {formatCurrency((lowSide.materialEstimate.pvcCasingCap?.items || []).reduce((s, i) => s + (i.qty * i.ur), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break-before" />

      {/* 6. COPPER PIPE RATES CONFIGURATION */}
      <div className="mb-6">
        <h2 className="text-[13px] font-bold uppercase border-b-2 border-black pb-1.5 mb-4 tracking-wider">V. Copper Pipe Rates Configuration</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Hard Pipes */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg mb-1">Hard Pipes Configuration</h3>
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-1.5 text-left">Size</th>
                  <th className="border border-slate-300 p-1.5 text-right">Rate</th>
                  <th className="border border-slate-300 p-1.5 text-right">Sleeve</th>
                  <th className="border border-slate-300 p-1.5 text-center">Unit</th>
                  <th className="border border-slate-300 p-1.5 text-right">Total</th>
                  <th className="border border-slate-300 p-1.5 text-right">Incl 10%</th>
                </tr>
              </thead>
              <tbody>
                {copperPipeRates?.filter(r => r.type === "hard").map((r, idx) => {
                  const tot = r.rate + r.sleeveRate;
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5 font-semibold text-slate-800">{r.size}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{r.rate ? formatCurrency(r.rate) : "—"}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{r.sleeveRate ? formatCurrency(r.sleeveRate) : "—"}</td>
                      <td className="border border-slate-300 p-1.5 text-center text-slate-500">{r.unit}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(tot)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold text-pink-700">{formatCurrency(tot * 1.1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Soft Pipes */}
          <div>
            <h3 className="font-bold text-[11px] bg-slate-150 p-1.5 pl-2.5 border border-slate-300 rounded-t-lg mb-1">Soft Pipes Configuration</h3>
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-1.5 text-left">Size</th>
                  <th className="border border-slate-300 p-1.5 text-right">Rate</th>
                  <th className="border border-slate-300 p-1.5 text-right">Sleeve</th>
                  <th className="border border-slate-300 p-1.5 text-center">Unit</th>
                  <th className="border border-slate-300 p-1.5 text-right">Total</th>
                  <th className="border border-slate-300 p-1.5 text-right">Incl 10%</th>
                </tr>
              </thead>
              <tbody>
                {copperPipeRates?.filter(r => r.type === "soft").map((r, idx) => {
                  const tot = r.rate + r.sleeveRate;
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"}>
                      <td className="border border-slate-300 p-1.5 font-semibold text-slate-800">{r.size}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{r.rate ? formatCurrency(r.rate) : "—"}</td>
                      <td className="border border-slate-300 p-1.5 text-right">{r.sleeveRate ? formatCurrency(r.sleeveRate) : "—"}</td>
                      <td className="border border-slate-300 p-1.5 text-center text-slate-500">{r.unit}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">{formatCurrency(tot)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold text-pink-700">{formatCurrency(tot * 1.1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
