import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Building, Calendar, FileText, Download, MessageSquare, DollarSign } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";

// Mock data
const mockQuotations = [
  {
    id: 1,
    quotationNo: "QUO-2026-001",
    date: "2026-05-12",
    clientName: "ABC Corporation",
    enquiryNo: "ENQ-2026-001",
    amount: 850000,
    gst: 153000,
    total: 1003000,
    status: "Pending Approval",
    validUntil: "2026-06-12",
    items: [
      { description: "HVAC Unit Installation", qty: 2, rate: 300000, total: 600000 },
      { description: "Ducting Work", qty: 1, rate: 150000, total: 150000 },
      { description: "Electrical Wiring", qty: 1, rate: 100000, total: 100000 },
    ],
    remarks: [
      { user: "Admin", date: "2026-05-12", text: "Quotation sent to client" },
    ],
  },
];

const getStatusColor = (status: string) => {
  const colors = {
    "Pending Approval": "bg-amber-100 text-amber-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Expired: "bg-gray-100 text-gray-800",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newRemark, setNewRemark] = useState("");

  const quotation = mockQuotations.find(q => q.id === Number(id)) || mockQuotations[0];

  return (
    <div className="h-full bg-gray-50/50">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0">
          <div className="mx-auto space-y-4">
            <Tabs defaultValue="details" className="space-y-4">
              {/* Unified Header Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/quotations")}
                      className="gap-2 h-9 px-3 hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-gray-200 hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">{quotation.quotationNo}</h1>
                      <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">{quotation.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-full ${getStatusColor(quotation.status)}`}>
                      {quotation.status}
                    </span>
                    <Button variant="outline" size="sm" className="gap-2 h-9 px-3 font-semibold">
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button size="sm" className="bg-pink-700 hover:bg-pink-800 h-9 px-4 font-semibold">Send to Client</Button>
                  </div>
                </div>
                <div className="px-4 lg:px-5">
                  <TabsList className="h-12 bg-transparent p-0 gap-8">
                    <TabsTrigger
                      value="details"
                      className="h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all"
                    >
                      Quotation Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="remarks"
                      className="h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all"
                    >
                      Remarks
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="details" className="m-0">
                <div className="space-y-4">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quotation Date</label>
                      </div>
                      <p className="text-base font-semibold text-gray-900">{new Date(quotation.date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valid Until</label>
                      </div>
                      <p className="text-base font-semibold text-pink-700">{new Date(quotation.validUntil).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enquiry Ref</label>
                      </div>
                      <p className="text-base font-semibold text-blue-700">{quotation.enquiryNo}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-pink-700" />
                        <label className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">Total Amount</label>
                      </div>
                      <p className="text-xl font-bold text-pink-700">₹{quotation.total.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <h3 className="text-base font-semibold text-gray-900">Line Items</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate (₹)</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {quotation.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600">{item.qty}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-600">₹{item.rate.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900 font-semibold">₹{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50 border-t">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</td>
                            <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">₹{quotation.amount.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs font-medium text-gray-500">GST (18%)</td>
                            <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">₹{quotation.gst.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-pink-50/50">
                            <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total Amount</td>
                            <td className="px-4 py-3 text-right font-bold text-pink-700 text-lg">₹{quotation.total.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Terms & Conditions Placeholder */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>1. Payment terms: 50% advance, 50% on completion</p>
                      <p>2. GST @ 18% applicable on all items</p>
                      <p>3. Delivery timeline: 4-6 weeks from date of order confirmation</p>
                      <p>4. Installation and commissioning included</p>
                      <p>5. 1 year comprehensive warranty on all equipment</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="remarks" className="m-0">
                <div className="mx-auto space-y-6">
                  <div className="space-y-3">
                    {quotation.remarks.length > 0 ? (
                      quotation.remarks.map((remark, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-pink-100 shadow-sm">
                                <img
                                  src={`https://i.pravatar.cc/150?u=${encodeURIComponent(remark.user)}`}
                                  alt={remark.user}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="font-medium text-gray-900">{remark.user}</span>
                            </div>
                            <span className="text-sm text-gray-500">{remark.date}</span>
                          </div>
                          <p className="text-gray-700 pl-11">{remark.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-center py-8">No remarks yet</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4">Add New Remark</h4>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a remark or note..."
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          className="gap-2"
                          onClick={() => {
                            if (newRemark.trim()) {
                              setNewRemark("");
                            }
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Add Remark
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
