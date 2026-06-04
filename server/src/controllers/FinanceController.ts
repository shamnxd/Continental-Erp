import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IClientInvoice } from "../interfaces/models/IClientInvoice";
import { IVendorBill } from "../interfaces/models/IVendorBill";
import { ILedgerEntry } from "../interfaces/models/ILedgerEntry";
import { IIncomeEntry } from "../interfaces/models/IIncomeEntry";
import { IExpenseEntry } from "../interfaces/models/IExpenseEntry";
import {
  CreateClientInvoiceDto,
  CreateVendorBillDto,
  CreateLedgerEntryDto,
  CreateIncomeEntryDto,
  CreateExpenseEntryDto,
  RecordInvoicePaymentDto,
  RecordVendorBillPaymentDto,
} from "../dtos/finance.dto";
import { StatusCode } from "../constants/statusCodes";

@autoInjectable()
export class FinanceController {
  constructor(
    @inject("CreateClientInvoiceUseCase")
    private _createInvoiceUseCase?: IUseCase<CreateClientInvoiceDto, IClientInvoice>,
    @inject("GetClientInvoicesUseCase")
    private _getInvoicesUseCase?: IUseCase<void, IClientInvoice[]>,
    @inject("GetClientInvoiceByIdUseCase")
    private _getInvoiceByIdUseCase?: IUseCase<string, IClientInvoice | null>,
    @inject("RecordInvoicePaymentUseCase")
    private _recordInvoicePaymentUseCase?: IUseCase<
      { invoiceId: string; data: RecordInvoicePaymentDto },
      IClientInvoice | null
    >,
    @inject("CreateVendorBillUseCase")
    private _createBillUseCase?: IUseCase<CreateVendorBillDto, IVendorBill>,
    @inject("GetVendorBillsUseCase")
    private _getBillsUseCase?: IUseCase<void, IVendorBill[]>,
    @inject("RecordVendorBillPaymentUseCase")
    private _recordBillPaymentUseCase?: IUseCase<
      { billId: string; data: RecordVendorBillPaymentDto },
      IVendorBill | null
    >,
    @inject("CreateLedgerEntryUseCase")
    private _createLedgerUseCase?: IUseCase<CreateLedgerEntryDto, ILedgerEntry>,
    @inject("GetLedgerEntriesUseCase")
    private _getLedgerUseCase?: IUseCase<void, ILedgerEntry[]>,
    @inject("CreateIncomeEntryUseCase")
    private _createIncomeUseCase?: IUseCase<CreateIncomeEntryDto, IIncomeEntry>,
    @inject("GetIncomeEntriesUseCase")
    private _getIncomeUseCase?: IUseCase<void, IIncomeEntry[]>,
    @inject("CreateExpenseEntryUseCase")
    private _createExpenseUseCase?: IUseCase<CreateExpenseEntryDto, IExpenseEntry>,
    @inject("GetExpenseEntriesUseCase")
    private _getExpenseUseCase?: IUseCase<void, IExpenseEntry[]>,
    @inject("SendInvoiceEmailUseCase")
    private _sendInvoiceEmailUseCase?: IUseCase<
      { invoiceId: string; recipientEmail: string; message?: string },
      boolean
    >
  ) {}

  // ── Client Invoices ──────────────────────────────────────────────────────────

  public createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateClientInvoiceDto;
      const invoice = await this._createInvoiceUseCase!.execute(dto);
      res.status(StatusCode.CREATED).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  };

  public getInvoices = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoices = await this._getInvoicesUseCase!.execute();
      res.status(StatusCode.OK).json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  };

  public getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this._getInvoiceByIdUseCase!.execute(req.params.id);
      if (!invoice) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Invoice not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  };

  public recordInvoicePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RecordInvoicePaymentDto;
      const invoice = await this._recordInvoicePaymentUseCase!.execute({
        invoiceId: req.params.id,
        data: dto,
      });
      if (!invoice) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Invoice not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  };

  public sendInvoiceEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { recipientEmail, message } = req.body;
      const success = await this._sendInvoiceEmailUseCase!.execute({
        invoiceId: req.params.id,
        recipientEmail,
        message,
      });
      if (success) {
        res.status(StatusCode.OK).json({
          success: true,
          message: "Invoice sent successfully",
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Failed to send invoice",
        });
      }
    } catch (error) {
      next(error);
    }
  };

  // ── Vendor Bills ─────────────────────────────────────────────────────────────

  public createBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateVendorBillDto;
      const bill = await this._createBillUseCase!.execute(dto);
      res.status(StatusCode.CREATED).json({ success: true, data: bill });
    } catch (error) {
      next(error);
    }
  };

  public getBills = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bills = await this._getBillsUseCase!.execute();
      res.status(StatusCode.OK).json({ success: true, data: bills });
    } catch (error) {
      next(error);
    }
  };

  public recordBillPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RecordVendorBillPaymentDto;
      const bill = await this._recordBillPaymentUseCase!.execute({
        billId: req.params.id,
        data: dto,
      });
      if (!bill) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Vendor bill not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: bill });
    } catch (error) {
      next(error);
    }
  };

  // ── Ledger ───────────────────────────────────────────────────────────────────

  public createLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateLedgerEntryDto;
      const entry = await this._createLedgerUseCase!.execute(dto);
      res.status(StatusCode.CREATED).json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };

  public getLedger = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this._getLedgerUseCase!.execute();
      res.status(StatusCode.OK).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  // ── Income ───────────────────────────────────────────────────────────────────

  public createIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateIncomeEntryDto;
      const entry = await this._createIncomeUseCase!.execute(dto);
      res.status(StatusCode.CREATED).json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };

  public getIncome = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this._getIncomeUseCase!.execute();
      res.status(StatusCode.OK).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  // ── Expenses ─────────────────────────────────────────────────────────────────

  public createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateExpenseEntryDto;
      const entry = await this._createExpenseUseCase!.execute(dto);
      res.status(StatusCode.CREATED).json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };

  public getExpenses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this._getExpenseUseCase!.execute();
      res.status(StatusCode.OK).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };
}
