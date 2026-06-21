import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Quotation } from "../interfaces/quotation.interface";
import { PdfExportOptions, exportQuotationToPdf } from "../features/quotations/quotationPdfExport";
import { toast } from "sonner";

interface PdfExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
}

export function PdfExportConfigModal({ isOpen, onClose, quotation }: PdfExportConfigModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Introductory & Equipment Details states
  const [subjectText, setSubjectText] = useState(`Airconditioning works for ${quotation.clientName}.`);
  const [introText, setIntroText] = useState("With reference to the discussions, we are pleased to submit our offer for the airconditioning works , based on the following terms and conditions.");
  const [locationText, setLocationText] = useState(`${quotation.clientName}${quotation.clientAddress ? ", " + quotation.clientAddress : ""}`);
  const [unitTypeText, setUnitTypeText] = useState("Ductable Split Unit");
  const [makeText, setMakeText] = useState("DAIKIN");

  // States with default values matching the Carmel Auditorium PDF template
  const [includeSpecialNote, setIncludeSpecialNote] = useState(true);
  const [specialNoteText, setSpecialNoteText] = useState("Special Note: Deliver of A/C units will take minimum 3 weeks from the date of 100% payment.");

  const [includeNotes, setIncludeNotes] = useState(true);
  const [notesText, setNotesText] = useState(
    "1. The quantities mentioned in BOQ are tentative, exact measurements can be appraised only after approval of shop drawings, locations of indoor and out door units etc. and any additional requirement, except the scope of work and quantity mentioned, will be charged extra.\n" +
    "2. Any structural support/Scaffolding necessary for our installation shall be done by the client to our requirement.\n" +
    "3. Service access for Indoor and outdoor units shall be provided by the customer."
  );

  const [includeExclusions, setIncludeExclusions] = useState(true);
  const [exclusionsText, setExclusionsText] = useState(
    "1. All types of civil / builders work such as wall /ceiling openings, unit foundations, angle support for IDU/ODU, Core cutting, ceiling, cladding, painting, water proofing, finishing etc. and are to executed to our requirements.\n" +
    "2. Power supply terminated in isolators to IDU/ ODU, Exhaust works, Provision of drain points near to IDU, Hoist for locating condensing units.\n" +
    "3. Power stabilizers, BMS, home atomization etc and related works.\n" +
    "4. Fees, approvals, Insurance etc from any Governmental institutions, Municipality, civil defence, union staffs or any other agencies involved.\n" +
    "5. Spare parts, consumables, refrigerant, PPM service etc. during warranty period.\n" +
    "6. Power required during our installation and commissioning.\n" +
    "7. Any other item specifically not mentioned by us.\n" +
    "8. MS Angle frame works for outdoor unit support, catwalk etc."
  );

  const [includeValidity, setIncludeValidity] = useState(true);
  const [validityText, setValidityText] = useState("Our offer is valid for a period of 15 days from the date of our offer and subject to written confirmation thereafter.");

  const [includeWarranty, setIncludeWarranty] = useState(true);
  const [warrantyText, setWarrantyText] = useState("12 months from the date of commissioning of machines or 18 months from the date of billing which ever comes early.");

  const [includePaymentTerms, setIncludePaymentTerms] = useState(true);
  const [paymentTermsText, setPaymentTermsText] = useState(
    "1. 100% advance payment for A/C ( High Side) unit along with P.O\n" +
    "2. 50% advance payment for  low side works.\n" +
    "3. 25% against delivery of materials at site.\n" +
    "4. 20% against erection of units, laying of copper pipes, installation of ducts & grills at site.\n" +
    "5. 5% prior to testing and commissioning."
  );

  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [closingLine1, setClosingLine1] = useState("We hope the above quote meet your requirements. Expecting your earliest confirmation and we will ensure our sincere attention");
  const [closingLine2, setClosingLine2] = useState("Should you have any clarifications, please do not hesitate to contact us.");
  const [signerName, setSignerName] = useState("Sreejith Balan");
  const [signerTitle, setSignerTitle] = useState("Sales Manager");
  const [ccListText, setCcListText] = useState(
    "Martin Xavier, MD\nT.P. Paul, TD\nRoy Pascal, GM"
  );

  const parseLines = (text: string): string[] => {
    return text.split("\n").map(l => l.trim()).filter(Boolean);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const options: PdfExportOptions = {
        includeSpecialNote,
        specialNoteText: specialNoteText.trim(),
        includeNotes,
        notes: parseLines(notesText),
        includeExclusions,
        exclusions: parseLines(exclusionsText),
        includeValidity,
        validityText: validityText.trim(),
        includeWarranty,
        warrantyText: warrantyText.trim(),
        includePaymentTerms,
        paymentTerms: parseLines(paymentTermsText),
        includeSignatures,
        closingLine1: closingLine1.trim(),
        closingLine2: closingLine2.trim(),
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim(),
        ccList: parseLines(ccListText),
        subjectText: subjectText.trim(),
        introText: introText.trim(),
        locationText: locationText.trim(),
        unitTypeText: unitTypeText.trim(),
        makeText: makeText.trim(),
      };

      await exportQuotationToPdf(quotation, options);
      toast.success("PDF exported successfully!", { id: toastId });
      onClose();
    } catch (err) {
      console.error("Failed to generate PDF", err);
      toast.error("Failed to generate PDF.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Customize PDF Content & Sections</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-6 my-2">
          {/* Introductory & Equipment Details */}
          <div className="flex flex-col gap-4 pb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Introductory & Equipment Details</h3>
            <div className="grid grid-cols-1 gap-3 pl-2">
              <div className="space-y-1">
                <Label htmlFor="pdf-subject" className="text-xs font-semibold text-slate-700">Subject</Label>
                <Input
                  id="pdf-subject"
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  className="text-xs"
                  placeholder="Enter subject..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pdf-intro" className="text-xs font-semibold text-slate-700">Intro Paragraph</Label>
                <Textarea
                  id="pdf-intro"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={2}
                  className="text-xs leading-normal"
                  placeholder="Enter intro paragraph..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pdf-location" className="text-xs font-semibold text-slate-700">Building Location</Label>
                <Input
                  id="pdf-location"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="text-xs"
                  placeholder="Enter building location..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pdf-unit-type" className="text-xs font-semibold text-slate-700">Type of Unit</Label>
                  <Input
                    id="pdf-unit-type"
                    value={unitTypeText}
                    onChange={(e) => setUnitTypeText(e.target.value)}
                    className="text-xs"
                    placeholder="E.g. Ductable Split Unit"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pdf-make" className="text-xs font-semibold text-slate-700">Make</Label>
                  <Input
                    id="pdf-make"
                    value={makeText}
                    onChange={(e) => setMakeText(e.target.value)}
                    className="text-xs"
                    placeholder="E.g. DAIKIN"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Note */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-special-note"
                checked={includeSpecialNote}
                onCheckedChange={(c) => setIncludeSpecialNote(!!c)}
              />
              <Label htmlFor="include-special-note" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                Special Note (AC Delivery)
              </Label>
            </div>
            {includeSpecialNote && (
              <Input
                value={specialNoteText}
                onChange={(e) => setSpecialNoteText(e.target.value)}
                className="text-xs"
                placeholder="Enter Special Note..."
              />
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-notes"
                checked={includeNotes}
                onCheckedChange={(c) => setIncludeNotes(!!c)}
              />
              <Label htmlFor="include-notes" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                IV. Notes
              </Label>
            </div>
            {includeNotes && (
              <Textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                className="text-xs font-mono leading-relaxed"
                placeholder="Enter notes (one per line)..."
              />
            )}
          </div>

          {/* Exclusions */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-exclusions"
                checked={includeExclusions}
                onCheckedChange={(c) => setIncludeExclusions(!!c)}
              />
              <Label htmlFor="include-exclusions" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                V. Works Excluded
              </Label>
            </div>
            {includeExclusions && (
              <Textarea
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
                rows={5}
                className="text-xs font-mono leading-relaxed"
                placeholder="Enter exclusions (one per line)..."
              />
            )}
          </div>

          {/* Validity */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-validity"
                checked={includeValidity}
                onCheckedChange={(c) => setIncludeValidity(!!c)}
              />
              <Label htmlFor="include-validity" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                VI. Validity
              </Label>
            </div>
            {includeValidity && (
              <Input
                value={validityText}
                onChange={(e) => setValidityText(e.target.value)}
                className="text-xs"
                placeholder="Enter Validity text..."
              />
            )}
          </div>

          {/* Warranty */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-warranty"
                checked={includeWarranty}
                onCheckedChange={(c) => setIncludeWarranty(!!c)}
              />
              <Label htmlFor="include-warranty" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                VII. Warranty
              </Label>
            </div>
            {includeWarranty && (
              <Input
                value={warrantyText}
                onChange={(e) => setWarrantyText(e.target.value)}
                className="text-xs"
                placeholder="Enter Warranty text..."
              />
            )}
          </div>

          {/* Terms of Payment */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-payment"
                checked={includePaymentTerms}
                onCheckedChange={(c) => setIncludePaymentTerms(!!c)}
              />
              <Label htmlFor="include-payment" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                VIII. Terms of Payment
              </Label>
            </div>
            {includePaymentTerms && (
              <Textarea
                value={paymentTermsText}
                onChange={(e) => setPaymentTermsText(e.target.value)}
                rows={4}
                className="text-xs font-mono leading-relaxed"
                placeholder="Enter payment terms (one per line)..."
              />
            )}
          </div>

          {/* Signatures & Closing */}
          <div className="flex flex-col gap-3 pb-2">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="include-signatures"
                checked={includeSignatures}
                onCheckedChange={(c) => setIncludeSignatures(!!c)}
              />
              <Label htmlFor="include-signatures" className="font-bold text-sm cursor-pointer select-none text-slate-800">
                Closing Paragraph & Signature CCs
              </Label>
            </div>
            {includeSignatures && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 mt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500">Closing Message 1</Label>
                  <Textarea
                    value={closingLine1}
                    onChange={(e) => setClosingLine1(e.target.value)}
                    rows={2}
                    className="text-xs"
                    placeholder="Enter closing line 1..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500">Closing Message 2</Label>
                  <Textarea
                    value={closingLine2}
                    onChange={(e) => setClosingLine2(e.target.value)}
                    rows={2}
                    className="text-xs"
                    placeholder="Enter closing line 2..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500">Signer Name</Label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="text-xs"
                    placeholder="E.g. Sreejith Balan"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500">Signer Title</Label>
                  <Input
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="text-xs"
                    placeholder="E.g. Sales Manager"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <Label className="text-xs font-medium text-slate-500">CC List (one per line)</Label>
                  <Textarea
                    value={ccListText}
                    onChange={(e) => setCcListText(e.target.value)}
                    rows={3}
                    className="text-xs font-mono"
                    placeholder="Enter CC items..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            {isExporting ? "Exporting..." : "Generate PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
