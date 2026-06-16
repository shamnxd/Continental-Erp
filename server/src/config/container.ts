import "reflect-metadata";
import { container } from "tsyringe";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { UserRepository } from "../repositories/mongo/UserRepository";
import { IClientRepository, GetClientsQuery, PaginatedClients } from "../interfaces/repositories/IClientRepository";
import { ClientRepository } from "../repositories/mongo/ClientRepository";
import { IAuditLogRepository } from "../interfaces/repositories/IAuditLogRepository";
import { AuditLogRepository } from "../repositories/mongo/AuditLogRepository";
import { ILeaveRequestRepository } from "../interfaces/repositories/ILeaveRequestRepository";
import { LeaveRequestRepository } from "../repositories/mongo/LeaveRequestRepository";
import { IProjectRepository } from "../interfaces/repositories/IProjectRepository";
import { ProjectRepository } from "../repositories/mongo/ProjectRepository";
import { CreateProjectUseCase } from "../usecases/projects/CreateProjectUseCase";
import { GetProjectsUseCase } from "../usecases/projects/GetProjectsUseCase";
import { GetProjectByIdUseCase } from "../usecases/projects/GetProjectByIdUseCase";
import { UpdateProjectUseCase } from "../usecases/projects/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "../usecases/projects/DeleteProjectUseCase";
import { ConvertQuotationUseCase } from "../usecases/quotations/ConvertQuotationUseCase";
import { IMinorJobRepository } from "../interfaces/repositories/IMinorJobRepository";
import { MinorJobRepository } from "../repositories/mongo/MinorJobRepository";
import { IProjectTaskRepository } from "../interfaces/repositories/IProjectTaskRepository";
import { ProjectTaskRepository } from "../repositories/mongo/ProjectTaskRepository";
import { ISubcontractRepository } from "../interfaces/repositories/ISubcontractRepository";
import { SubcontractRepository } from "../repositories/mongo/SubcontractRepository";
import { IPurchaseOrderRepository } from "../interfaces/repositories/IPurchaseOrderRepository";
import { PurchaseOrderRepository } from "../repositories/mongo/PurchaseOrderRepository";
import { CreateMinorJobUseCase } from "../usecases/minor-jobs/CreateMinorJobUseCase";
import { GetMinorJobsUseCase } from "../usecases/minor-jobs/GetMinorJobsUseCase";
import { GetMinorJobByIdUseCase } from "../usecases/minor-jobs/GetMinorJobByIdUseCase";
import { UpdateMinorJobUseCase } from "../usecases/minor-jobs/UpdateMinorJobUseCase";
import { DeleteMinorJobUseCase } from "../usecases/minor-jobs/DeleteMinorJobUseCase";


// Complaints & SMR Repositories
import { IComplaintRepository, GetComplaintsQuery, PaginatedComplaints } from "../interfaces/repositories/IComplaintRepository";
import { ComplaintRepository } from "../repositories/mongo/ComplaintRepository";
import { ISMRRepository } from "../interfaces/repositories/ISMRRepository";
import { SMRRepository } from "../repositories/mongo/SMRRepository";
import { IStaffRepository } from "../interfaces/repositories/IStaffRepository";
import { StaffRepository } from "../repositories/mongo/StaffRepository";

import { IUseCase } from "../interfaces/usecases/IUseCase";
import { LoginRequestDto, LoginResponseDto } from "../dtos/auth.dto";
import { LoginUseCase } from "../usecases/auth/LoginUseCase";
import { RefreshTokenUseCase } from "../usecases/auth/RefreshTokenUseCase";

import { CreateClientDto, UpdateClientDto } from "../dtos/client.dto";
import { IClient } from "../interfaces/models/IClient";
import { CreateClientUseCase } from "../usecases/clients/CreateClientUseCase";
import { GetClientsUseCase } from "../usecases/clients/GetClientsUseCase";
import { GetClientByIdUseCase } from "../usecases/clients/GetClientByIdUseCase";
import { UpdateClientUseCase } from "../usecases/clients/UpdateClientUseCase";
import { DeleteClientUseCase } from "../usecases/clients/DeleteClientUseCase";

// Complaints Use Cases
import { IComplaint } from "../interfaces/models/IComplaint";
import { CreateComplaintDto, UpdateComplaintDto } from "../dtos/complaint.dto";
import { CreateComplaintUseCase } from "../usecases/complaints/CreateComplaintUseCase";
import { GetComplaintsUseCase } from "../usecases/complaints/GetComplaintsUseCase";
import { GetComplaintByIdUseCase } from "../usecases/complaints/GetComplaintByIdUseCase";
import { UpdateComplaintUseCase } from "../usecases/complaints/UpdateComplaintUseCase";
import { DeleteComplaintUseCase } from "../usecases/complaints/DeleteComplaintUseCase";

// SMR Use Cases
import { ISMR } from "../interfaces/models/ISMR";
import { CreateSMRDto, UpdateSMRDto } from "../dtos/smr.dto";
import { CreateSMRUseCase } from "../usecases/smrs/CreateSMRUseCase";
import { GetSMRByIdUseCase } from "../usecases/smrs/GetSMRByIdUseCase";
import { GetSMRsByComplaintUseCase } from "../usecases/smrs/GetSMRsByComplaintUseCase";
import { UpdateSMRUseCase } from "../usecases/smrs/UpdateSMRUseCase";
import { ApproveSMRUseCase, SMRApprovalInput } from "../usecases/smrs/ApproveSMRUseCase";

import { IStaff } from "../interfaces/models/IStaff";
import { StaffWorkHistoryItem } from "../interfaces/models/IStaff";
import { CreateStaffDto, UpdateStaffDto } from "../dtos/staff.dto";
import { GetStaffQuery, PaginatedStaff } from "../interfaces/repositories/IStaffRepository";
import { CreateStaffUseCase } from "../usecases/staff/CreateStaffUseCase";
import { GetStaffUseCase } from "../usecases/staff/GetStaffUseCase";
import { GetStaffByIdUseCase } from "../usecases/staff/GetStaffByIdUseCase";
import { UpdateStaffUseCase } from "../usecases/staff/UpdateStaffUseCase";
import { DeleteStaffUseCase } from "../usecases/staff/DeleteStaffUseCase";
import { GetStaffWorkHistoryUseCase } from "../usecases/staff/GetStaffWorkHistoryUseCase";

import { IAmcRepository, GetAmcQuery, PaginatedAmc } from "../interfaces/repositories/IAmcRepository";
import { AmcRepository } from "../repositories/mongo/AmcRepository";
import { IAmc } from "../interfaces/models/IAmc";
import { CreateAmcDto, UpdateAmcDto } from "../dtos/amc.dto";
import { CreateAmcUseCase } from "../usecases/amc/CreateAmcUseCase";
import { GetAmcUseCase } from "../usecases/amc/GetAmcUseCase";
import { GetAmcByIdUseCase } from "../usecases/amc/GetAmcByIdUseCase";
import { UpdateAmcUseCase } from "../usecases/amc/UpdateAmcUseCase";
import { DeleteAmcUseCase } from "../usecases/amc/DeleteAmcUseCase";
import { AddAmcRemarkUseCase } from "../usecases/amc/AddAmcRemarkUseCase";
import { RecordAmcPaymentUseCase } from "../usecases/amc/RecordAmcPaymentUseCase";
import { AddAmcRemarkDto, RecordAmcPaymentDto } from "../dtos/amcRemark.dto";

import { IEnquiryRepository, GetEnquiriesQuery, PaginatedEnquiries } from "../interfaces/repositories/IEnquiryRepository";
import { EnquiryRepository } from "../repositories/mongo/EnquiryRepository";
import { IEnquiry } from "../interfaces/models/IEnquiry";
import { CreateEnquiryDto, UpdateEnquiryDto } from "../dtos/enquiry.dto";
import { CreateEnquiryUseCase } from "../usecases/enquiries/CreateEnquiryUseCase";
import { GetEnquiriesUseCase } from "../usecases/enquiries/GetEnquiriesUseCase";
import { GetEnquiryByIdUseCase } from "../usecases/enquiries/GetEnquiryByIdUseCase";
import { UpdateEnquiryUseCase } from "../usecases/enquiries/UpdateEnquiryUseCase";
import { DeleteEnquiryUseCase } from "../usecases/enquiries/DeleteEnquiryUseCase";
import { AddEnquiryRemarkUseCase } from "../usecases/enquiries/AddEnquiryRemarkUseCase";
import { EditEnquiryRemarkUseCase } from "../usecases/enquiries/EditEnquiryRemarkUseCase";
import { EditAmcRemarkUseCase } from "../usecases/amc/EditAmcRemarkUseCase";
import { AddEnquiryDrawingUseCase, AddEnquiryDrawingInput } from "../usecases/enquiries/AddEnquiryDrawingUseCase";
import { AddEnquiryRemarkDto, EditEnquiryRemarkDto } from "../dtos/enquiryRemark.dto";

// Schedules Imports
import { IScheduleRepository, PaginatedSchedules, GetSchedulesQuery } from "../interfaces/repositories/IScheduleRepository";
import { ScheduleRepository } from "../repositories/mongo/ScheduleRepository";
import { ISchedule } from "../interfaces/models/ISchedule";
import { CreateScheduleDto, UpdateScheduleDto } from "../dtos/schedule.dto";
import { CreateScheduleUseCase } from "../usecases/schedules/CreateScheduleUseCase";
import { GetSchedulesUseCase } from "../usecases/schedules/GetSchedulesUseCase";
import { UpdateScheduleUseCase } from "../usecases/schedules/UpdateScheduleUseCase";
import { DeleteScheduleUseCase } from "../usecases/schedules/DeleteScheduleUseCase";

// Remark Imports
import { IRemarkRepository } from "../interfaces/repositories/IRemarkRepository";
import { RemarkRepository } from "../repositories/mongo/RemarkRepository";
import { IRemark, RemarkEntityType } from "../interfaces/models/IRemark";
import { GetRemarksUseCase } from "../usecases/remarks/GetRemarksUseCase";
import { AddRemarkUseCase, AddRemarkInput } from "../usecases/remarks/AddRemarkUseCase";

// Costing Imports
import { ICostingRepository } from "../interfaces/repositories/ICostingRepository";
import { CostingRepository } from "../repositories/mongo/CostingRepository";
import { CreateCostingUseCase } from "../usecases/costings/CreateCostingUseCase";
import { GetCostingsByEnquiryIdUseCase } from "../usecases/costings/GetCostingsByEnquiryIdUseCase";
import { CreateCostingRevisionUseCase } from "../usecases/costings/CreateCostingRevisionUseCase";
import { UpdateCostingUseCase } from "../usecases/costings/UpdateCostingUseCase";
import { CreateCostingDto, UpdateCostingDto } from "../dtos/costing.dto";
import { ICosting } from "../interfaces/models/ICosting";

import { IQuotationRepository, GetQuotationsQuery, PaginatedQuotations } from "../interfaces/repositories/IQuotationRepository";
import { QuotationRepository } from "../repositories/mongo/QuotationRepository";
import { IQuotation } from "../interfaces/models/IQuotation";
import { CreateQuotationDto, UpdateQuotationDto } from "../dtos/quotation.dto";
import { CreateQuotationUseCase } from "../usecases/quotations/CreateQuotationUseCase";
import { GetQuotationsUseCase } from "../usecases/quotations/GetQuotationsUseCase";
import { GetQuotationByIdUseCase } from "../usecases/quotations/GetQuotationByIdUseCase";
import { UpdateQuotationUseCase } from "../usecases/quotations/UpdateQuotationUseCase";
import { DeleteQuotationUseCase } from "../usecases/quotations/DeleteQuotationUseCase";
import { AddQuotationRemarkUseCase } from "../usecases/quotations/AddQuotationRemarkUseCase";
import { EditQuotationRemarkUseCase } from "../usecases/quotations/EditQuotationRemarkUseCase";
import { AddQuotationRemarkDto, EditQuotationRemarkDto } from "../dtos/quotationRemark.dto";

// Finance Repositories
import { IClientInvoiceRepository } from "../interfaces/repositories/IClientInvoiceRepository";
import { ClientInvoiceRepository } from "../repositories/mongo/ClientInvoiceRepository";
import { IVendorBillRepository } from "../interfaces/repositories/IVendorBillRepository";
import { VendorBillRepository } from "../repositories/mongo/VendorBillRepository";
import { ILedgerEntryRepository } from "../interfaces/repositories/ILedgerEntryRepository";
import { LedgerEntryRepository } from "../repositories/mongo/LedgerEntryRepository";
import { IIncomeEntryRepository } from "../interfaces/repositories/IIncomeEntryRepository";
import { IncomeEntryRepository } from "../repositories/mongo/IncomeEntryRepository";
import { IExpenseEntryRepository } from "../interfaces/repositories/IExpenseEntryRepository";
import { ExpenseEntryRepository } from "../repositories/mongo/ExpenseEntryRepository";

// Finance Model Interfaces
import { IClientInvoice } from "../interfaces/models/IClientInvoice";
import { IVendorBill } from "../interfaces/models/IVendorBill";
import { ILedgerEntry } from "../interfaces/models/ILedgerEntry";
import { IIncomeEntry } from "../interfaces/models/IIncomeEntry";
import { IExpenseEntry } from "../interfaces/models/IExpenseEntry";

// Finance DTO types
import {
  CreateClientInvoiceDto,
  CreateVendorBillDto,
  CreateLedgerEntryDto,
  CreateIncomeEntryDto,
  CreateExpenseEntryDto,
  RecordInvoicePaymentDto,
  RecordVendorBillPaymentDto,
} from "../dtos/finance.dto";

// Finance Use Cases
import { CreateClientInvoiceUseCase } from "../usecases/finance/CreateClientInvoiceUseCase";
import { GetClientInvoicesUseCase } from "../usecases/finance/GetClientInvoicesUseCase";
import { GetClientInvoiceByIdUseCase } from "../usecases/finance/GetClientInvoiceByIdUseCase";
import { CreateVendorBillUseCase } from "../usecases/finance/CreateVendorBillUseCase";
import { GetVendorBillsUseCase } from "../usecases/finance/GetVendorBillsUseCase";
import { CreateLedgerEntryUseCase } from "../usecases/finance/CreateLedgerEntryUseCase";
import { GetLedgerEntriesUseCase } from "../usecases/finance/GetLedgerEntriesUseCase";
import { CreateIncomeEntryUseCase } from "../usecases/finance/CreateIncomeEntryUseCase";
import { GetIncomeEntriesUseCase } from "../usecases/finance/GetIncomeEntriesUseCase";
import { CreateExpenseEntryUseCase } from "../usecases/finance/CreateExpenseEntryUseCase";
import { GetExpenseEntriesUseCase } from "../usecases/finance/GetExpenseEntriesUseCase";
import { RecordInvoicePaymentUseCase } from "../usecases/finance/RecordInvoicePaymentUseCase";
import { RecordVendorBillPaymentUseCase } from "../usecases/finance/RecordVendorBillPaymentUseCase";
import { SendInvoiceEmailUseCase } from "../usecases/finance/SendInvoiceEmailUseCase";

import { IEmailService } from "../interfaces/services/IEmailService";
import { EmailService } from "../services/EmailService";

// Warranty Imports
import { IWarrantyRepository } from "../interfaces/repositories/IWarrantyRepository";
import { WarrantyRepository } from "../repositories/mongo/WarrantyRepository";
import { CreateWarrantyUseCase } from "../usecases/warranty/CreateWarrantyUseCase";
import { GetWarrantiesUseCase } from "../usecases/warranty/GetWarrantiesUseCase";
import { GetWarrantyByIdUseCase } from "../usecases/warranty/GetWarrantyByIdUseCase";
import { UpdateWarrantyUseCase } from "../usecases/warranty/UpdateWarrantyUseCase";

// Register repositories
container.registerSingleton<IUserRepository>("UserRepository", UserRepository);
container.registerSingleton<IClientRepository>("ClientRepository", ClientRepository);
container.registerSingleton<IComplaintRepository>("ComplaintRepository", ComplaintRepository);
container.registerSingleton<ISMRRepository>("SMRRepository", SMRRepository);
container.registerSingleton<IStaffRepository>("StaffRepository", StaffRepository);
container.registerSingleton<IAmcRepository>("AmcRepository", AmcRepository);
container.registerSingleton<IEnquiryRepository>("EnquiryRepository", EnquiryRepository);
container.registerSingleton<IQuotationRepository>("QuotationRepository", QuotationRepository);
container.registerSingleton<IAuditLogRepository>("AuditLogRepository", AuditLogRepository);
container.registerSingleton<ICostingRepository>("CostingRepository", CostingRepository);
container.registerSingleton<IScheduleRepository>("ScheduleRepository", ScheduleRepository);
container.registerSingleton<IRemarkRepository>("RemarkRepository", RemarkRepository);
container.registerSingleton<IProjectRepository>("ProjectRepository", ProjectRepository);
container.registerSingleton<IMinorJobRepository>("MinorJobRepository", MinorJobRepository);
container.registerSingleton<IProjectTaskRepository>("ProjectTaskRepository", ProjectTaskRepository);
container.registerSingleton<ISubcontractRepository>("SubcontractRepository", SubcontractRepository);
container.registerSingleton<IPurchaseOrderRepository>("PurchaseOrderRepository", PurchaseOrderRepository);
container.registerSingleton<IWarrantyRepository>("WarrantyRepository", WarrantyRepository);

// Finance Repositories
container.registerSingleton<IClientInvoiceRepository>("ClientInvoiceRepository", ClientInvoiceRepository);
container.registerSingleton<IVendorBillRepository>("VendorBillRepository", VendorBillRepository);
container.registerSingleton<ILedgerEntryRepository>("LedgerEntryRepository", LedgerEntryRepository);
container.registerSingleton<IIncomeEntryRepository>("IncomeEntryRepository", IncomeEntryRepository);
container.registerSingleton<IExpenseEntryRepository>("ExpenseEntryRepository", ExpenseEntryRepository);

// Register use case abstractions
container.registerSingleton<IUseCase<LoginRequestDto, LoginResponseDto>>("LoginUseCase", LoginUseCase);
container.registerSingleton<IUseCase<string, string>>("RefreshTokenUseCase", RefreshTokenUseCase);

container.registerSingleton<IUseCase<CreateClientDto, IClient>>("CreateClientUseCase", CreateClientUseCase);
container.registerSingleton<IUseCase<GetClientsQuery, PaginatedClients>>("GetClientsUseCase", GetClientsUseCase);
container.registerSingleton<IUseCase<string, IClient | null>>("GetClientByIdUseCase", GetClientByIdUseCase);
container.registerSingleton<IUseCase<{ id: string; data: UpdateClientDto }, IClient>>("UpdateClientUseCase", UpdateClientUseCase);
container.registerSingleton<IUseCase<string, boolean>>("DeleteClientUseCase", DeleteClientUseCase);

// Complaints Use Cases
container.registerSingleton<IUseCase<CreateComplaintDto, IComplaint>>("CreateComplaintUseCase", CreateComplaintUseCase);
container.registerSingleton<IUseCase<GetComplaintsQuery, PaginatedComplaints>>("GetComplaintsUseCase", GetComplaintsUseCase);
container.registerSingleton<IUseCase<string, IComplaint | null>>("GetComplaintByIdUseCase", GetComplaintByIdUseCase);
container.registerSingleton<IUseCase<{ id: string; data: UpdateComplaintDto }, IComplaint | null>>("UpdateComplaintUseCase", UpdateComplaintUseCase);
container.registerSingleton<IUseCase<string, boolean>>("DeleteComplaintUseCase", DeleteComplaintUseCase);

// SMR Use Cases
container.registerSingleton<IUseCase<CreateSMRDto, ISMR>>("CreateSMRUseCase", CreateSMRUseCase);
container.registerSingleton<IUseCase<string, ISMR | null>>("GetSMRByIdUseCase", GetSMRByIdUseCase);
container.registerSingleton<IUseCase<string, ISMR[]>>("GetSMRsByComplaintUseCase", GetSMRsByComplaintUseCase);
container.registerSingleton<IUseCase<{ id: string; data: UpdateSMRDto }, ISMR | null>>("UpdateSMRUseCase", UpdateSMRUseCase);
container.registerSingleton<IUseCase<SMRApprovalInput, ISMR | null>>("ApproveSMRUseCase", ApproveSMRUseCase);

container.registerSingleton<IUseCase<CreateStaffDto, IStaff>>("CreateStaffUseCase", CreateStaffUseCase);
container.registerSingleton<IUseCase<GetStaffQuery, PaginatedStaff>>("GetStaffUseCase", GetStaffUseCase);
container.registerSingleton<IUseCase<string, IStaff | null>>("GetStaffByIdUseCase", GetStaffByIdUseCase);
container.registerSingleton<IUseCase<{ id: string; data: UpdateStaffDto }, IStaff | null>>("UpdateStaffUseCase", UpdateStaffUseCase);
container.registerSingleton<IUseCase<string, boolean>>("DeleteStaffUseCase", DeleteStaffUseCase);
container.registerSingleton<IUseCase<string, StaffWorkHistoryItem[]>>("GetStaffWorkHistoryUseCase", GetStaffWorkHistoryUseCase);

container.registerSingleton<IUseCase<CreateAmcDto, IAmc>>("CreateAmcUseCase", CreateAmcUseCase);
container.registerSingleton<IUseCase<GetAmcQuery, PaginatedAmc>>("GetAmcUseCase", GetAmcUseCase);
container.registerSingleton<IUseCase<string, IAmc | null>>("GetAmcByIdUseCase", GetAmcByIdUseCase);
container.registerSingleton<IUseCase<{ id: string; data: UpdateAmcDto }, IAmc | null>>("UpdateAmcUseCase", UpdateAmcUseCase);
container.registerSingleton<IUseCase<string, boolean>>("DeleteAmcUseCase", DeleteAmcUseCase);
container.registerSingleton<
  IUseCase<{ amcId: string; data: AddAmcRemarkDto; user: string }, IAmc | null>
>("AddAmcRemarkUseCase", AddAmcRemarkUseCase);
container.registerSingleton<
  IUseCase<{ amcId: string; data: RecordAmcPaymentDto; user: string }, IAmc | null>
>("RecordAmcPaymentUseCase", RecordAmcPaymentUseCase);

container.registerSingleton<IUseCase<{ data: CreateEnquiryDto; user: string }, IEnquiry>>(
  "CreateEnquiryUseCase",
  CreateEnquiryUseCase,
);
container.registerSingleton<IUseCase<GetEnquiriesQuery, PaginatedEnquiries>>("GetEnquiriesUseCase", GetEnquiriesUseCase);
container.registerSingleton<IUseCase<string, IEnquiry | null>>("GetEnquiryByIdUseCase", GetEnquiryByIdUseCase);
container.registerSingleton<
  IUseCase<{ id: string; data: UpdateEnquiryDto; user: string }, IEnquiry | null>
>("UpdateEnquiryUseCase", UpdateEnquiryUseCase);
container.registerSingleton<IUseCase<string, boolean>>("DeleteEnquiryUseCase", DeleteEnquiryUseCase);
container.registerSingleton<
  IUseCase<{ enquiryId: string; data: AddEnquiryRemarkDto; user: string }, IEnquiry | null>
>("AddEnquiryRemarkUseCase", AddEnquiryRemarkUseCase);
container.registerSingleton<IUseCase<AddEnquiryDrawingInput, IEnquiry | null>>(
  "AddEnquiryDrawingUseCase",
  AddEnquiryDrawingUseCase,
);
container.registerSingleton<
  IUseCase<{ enquiryId: string; remarkKey: string; data: EditEnquiryRemarkDto; user: string }, IEnquiry | null>
>("EditEnquiryRemarkUseCase", EditEnquiryRemarkUseCase);
container.registerSingleton<
  IUseCase<{ amcId: string; remarkKey: string; data: EditEnquiryRemarkDto; user: string }, IAmc | null>
>("EditAmcRemarkUseCase", EditAmcRemarkUseCase);

// Schedule Use Cases
container.registerSingleton<IUseCase<{ data: CreateScheduleDto; user: string }, ISchedule>>("CreateScheduleUseCase", CreateScheduleUseCase);
container.registerSingleton<IUseCase<GetSchedulesQuery, PaginatedSchedules>>("GetSchedulesUseCase", GetSchedulesUseCase);
container.registerSingleton<IUseCase<{ id: string; data: UpdateScheduleDto; user: string }, ISchedule | null>>("UpdateScheduleUseCase", UpdateScheduleUseCase);
container.registerSingleton<IUseCase<{ id: string; user: string }, boolean>>("DeleteScheduleUseCase", DeleteScheduleUseCase);

// Remark Use Cases
container.registerSingleton<IUseCase<{ entityType: RemarkEntityType; entityId: string }, IRemark[]>>("GetRemarksUseCase", GetRemarksUseCase);
container.registerSingleton<IUseCase<AddRemarkInput, IRemark>>("AddRemarkUseCase", AddRemarkUseCase);

// Costing UseCases
container.registerSingleton<IUseCase<{ data: CreateCostingDto }, ICosting>>(
  "CreateCostingUseCase",
  CreateCostingUseCase
);
container.registerSingleton<IUseCase<string, ICosting[]>>(
  "GetCostingsByEnquiryIdUseCase",
  GetCostingsByEnquiryIdUseCase
);
container.registerSingleton<IUseCase<{ id: string; preparedBy: string }, ICosting>>(
  "CreateCostingRevisionUseCase",
  CreateCostingRevisionUseCase
);
container.registerSingleton<IUseCase<{ id: string; data: UpdateCostingDto }, ICosting | null>>(
  "UpdateCostingUseCase",
  UpdateCostingUseCase
);

import { CreateQuotationRevisionUseCase } from "../usecases/quotations/CreateQuotationRevisionUseCase";

container.registerSingleton<IUseCase<CreateQuotationDto, IQuotation>>(
  "CreateQuotationUseCase",
  CreateQuotationUseCase,
);
container.registerSingleton<IUseCase<{ id: string }, IQuotation>>(
  "CreateQuotationRevisionUseCase",
  CreateQuotationRevisionUseCase,
);
container.registerSingleton<IUseCase<GetQuotationsQuery, PaginatedQuotations>>(
  "GetQuotationsUseCase",
  GetQuotationsUseCase,
);
container.registerSingleton<IUseCase<string, IQuotation | null>>("GetQuotationByIdUseCase", GetQuotationByIdUseCase);
container.registerSingleton<
  IUseCase<{ id: string; data: UpdateQuotationDto }, IQuotation | null>
>("UpdateQuotationUseCase", UpdateQuotationUseCase);
container.registerSingleton<IUseCase<string, boolean>>("DeleteQuotationUseCase", DeleteQuotationUseCase);
container.registerSingleton<
  IUseCase<{ quotationId: string; data: AddQuotationRemarkDto; user: string }, IQuotation | null>
>("AddQuotationRemarkUseCase", AddQuotationRemarkUseCase);
container.registerSingleton<
  IUseCase<{ quotationId: string; remarkKey: string; data: EditQuotationRemarkDto; user: string }, IQuotation | null>
>("EditQuotationRemarkUseCase", EditQuotationRemarkUseCase);

// Finance Use Cases
container.registerSingleton<IUseCase<CreateClientInvoiceDto, IClientInvoice>>("CreateClientInvoiceUseCase", CreateClientInvoiceUseCase);
container.registerSingleton<IUseCase<void, IClientInvoice[]>>("GetClientInvoicesUseCase", GetClientInvoicesUseCase);
container.registerSingleton<IUseCase<string, IClientInvoice | null>>("GetClientInvoiceByIdUseCase", GetClientInvoiceByIdUseCase);
container.registerSingleton<
  IUseCase<{ invoiceId: string; data: RecordInvoicePaymentDto }, IClientInvoice | null>
>("RecordInvoicePaymentUseCase", RecordInvoicePaymentUseCase);
container.registerSingleton<IUseCase<CreateVendorBillDto, IVendorBill>>("CreateVendorBillUseCase", CreateVendorBillUseCase);
container.registerSingleton<IUseCase<void, IVendorBill[]>>("GetVendorBillsUseCase", GetVendorBillsUseCase);
container.registerSingleton<
  IUseCase<{ billId: string; data: RecordVendorBillPaymentDto }, IVendorBill | null>
>("RecordVendorBillPaymentUseCase", RecordVendorBillPaymentUseCase);
container.registerSingleton<IUseCase<CreateLedgerEntryDto, ILedgerEntry>>("CreateLedgerEntryUseCase", CreateLedgerEntryUseCase);
container.registerSingleton<IUseCase<void, ILedgerEntry[]>>("GetLedgerEntriesUseCase", GetLedgerEntriesUseCase);
container.registerSingleton<IUseCase<CreateIncomeEntryDto, IIncomeEntry>>("CreateIncomeEntryUseCase", CreateIncomeEntryUseCase);
container.registerSingleton<IUseCase<void, IIncomeEntry[]>>("GetIncomeEntriesUseCase", GetIncomeEntriesUseCase);
container.registerSingleton<IUseCase<CreateExpenseEntryDto, IExpenseEntry>>("CreateExpenseEntryUseCase", CreateExpenseEntryUseCase);
container.registerSingleton<IUseCase<void, IExpenseEntry[]>>("GetExpenseEntriesUseCase", GetExpenseEntriesUseCase);

// Repositories
container.registerSingleton<ILeaveRequestRepository>("LeaveRequestRepository", LeaveRequestRepository);

// Services
container.registerSingleton<IEmailService>("EmailService", EmailService);

// Email Use Cases
container.registerSingleton<
  IUseCase<
    { invoiceId: string; recipientEmail: string; message?: string },
    boolean
  >
>("SendInvoiceEmailUseCase", SendInvoiceEmailUseCase);

// Project Use Cases
container.registerSingleton<IUseCase<any, any>>("CreateProjectUseCase", CreateProjectUseCase);
container.registerSingleton<IUseCase<any, any>>("GetProjectsUseCase", GetProjectsUseCase);
container.registerSingleton<IUseCase<any, any>>("GetProjectByIdUseCase", GetProjectByIdUseCase);
container.registerSingleton<IUseCase<any, any>>("UpdateProjectUseCase", UpdateProjectUseCase);
container.registerSingleton<IUseCase<any, any>>("DeleteProjectUseCase", DeleteProjectUseCase);
container.registerSingleton<IUseCase<any, any>>("ConvertQuotationUseCase", ConvertQuotationUseCase);

// Minor Job Use Cases
container.registerSingleton<IUseCase<any, any>>("CreateMinorJobUseCase", CreateMinorJobUseCase);
container.registerSingleton<IUseCase<any, any>>("GetMinorJobsUseCase", GetMinorJobsUseCase);
container.registerSingleton<IUseCase<any, any>>("GetMinorJobByIdUseCase", GetMinorJobByIdUseCase);
container.registerSingleton<IUseCase<any, any>>("UpdateMinorJobUseCase", UpdateMinorJobUseCase);
container.registerSingleton<IUseCase<any, any>>("DeleteMinorJobUseCase", DeleteMinorJobUseCase);

// Warranty Use Cases
container.registerSingleton<IUseCase<any, any>>("CreateWarrantyUseCase", CreateWarrantyUseCase);
container.registerSingleton<IUseCase<any, any>>("GetWarrantiesUseCase", GetWarrantiesUseCase);
container.registerSingleton<IUseCase<any, any>>("GetWarrantyByIdUseCase", GetWarrantyByIdUseCase);
container.registerSingleton<IUseCase<any, any>>("UpdateWarrantyUseCase", UpdateWarrantyUseCase);
