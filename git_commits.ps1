# Commit 1: Minor Job models
git add "server/src/interfaces/models/IMinorJob.ts" "server/src/models/MinorJob.ts" "server/src/dtos/minorJob.dto.ts"
git commit -m "feat: add Minor Job model, interface, and DTOs"

# Commit 2: Project models
git add "server/src/interfaces/models/IProject.ts" "server/src/models/Project.ts" "server/src/dtos/project.dto.ts"
git commit -m "feat: add Project model, interface, and DTOs"

# Commit 3: Project Task models
git add "server/src/interfaces/models/IProjectTask.ts" "server/src/models/ProjectTask.ts"
git commit -m "feat: add Project Task model and interface"

# Commit 4: Purchase Order models
git add "server/src/interfaces/models/IPurchaseOrder.ts" "server/src/models/PurchaseOrder.ts"
git commit -m "feat: add Purchase Order model and interface"

# Commit 5: Subcontract models
git add "server/src/interfaces/models/ISubcontract.ts" "server/src/models/Subcontract.ts"
git commit -m "feat: add Subcontract model and interface"

# Commit 6: Minor Job repositories
git add "server/src/interfaces/repositories/IMinorJobRepository.ts" "server/src/repositories/mongo/MinorJobRepository.ts"
git commit -m "feat: add MinorJob repository interface and implementation"

# Commit 7: Project repositories
git add "server/src/interfaces/repositories/IProjectRepository.ts" "server/src/repositories/mongo/ProjectRepository.ts"
git commit -m "feat: add Project repository interface and implementation"

# Commit 8: Project Task repositories
git add "server/src/interfaces/repositories/IProjectTaskRepository.ts" "server/src/repositories/mongo/ProjectTaskRepository.ts"
git commit -m "feat: add ProjectTask repository interface and implementation"

# Commit 9: Purchase Order repositories
git add "server/src/interfaces/repositories/IPurchaseOrderRepository.ts" "server/src/repositories/mongo/PurchaseOrderRepository.ts"
git commit -m "feat: add PurchaseOrder repository interface and implementation"

# Commit 10: Subcontract repositories
git add "server/src/interfaces/repositories/ISubcontractRepository.ts" "server/src/repositories/mongo/SubcontractRepository.ts"
git commit -m "feat: add Subcontract repository interface and implementation"

# Commit 11: Minor Job usecases
git add "server/src/usecases/minor-jobs/"
git commit -m "feat: add MinorJob use cases for create, read, and update"

# Commit 12: Project usecases
git add "server/src/usecases/projects/"
git commit -m "feat: add Project use cases for create, read, and update"

# Commit 13: Quotation conversion usecase
git add "server/src/usecases/quotations/ConvertQuotationUseCase.ts"
git commit -m "feat: add ConvertQuotation use case"

# Commit 14: Minor Job Controller and Routes
git add "server/src/controllers/MinorJobController.ts" "server/src/routes/minorJob.routes.ts"
git commit -m "feat: add MinorJob controller and routes"

# Commit 15: Project Controller and Routes
git add "server/src/controllers/ProjectController.ts" "server/src/routes/project.routes.ts"
git commit -m "feat: add Project controller and routes"

# Commit 16: Server app configuration & container registrations
git add "server/src/config/container.ts" "server/src/app.ts"
git commit -m "feat: register project and minor job use cases and routes in server app container"

# Commit 17: Client interfaces
git add "client/src/interfaces/minorJob.interface.ts" "client/src/interfaces/project.interface.ts" "client/src/interfaces/projectTask.interface.ts" "client/src/interfaces/purchaseOrder.interface.ts" "client/src/interfaces/subcontract.interface.ts" "client/src/interfaces/enquiry.interface.ts" "client/src/interfaces/quotation.interface.ts" "client/src/interfaces/remark.interface.ts"
git commit -m "feat: add client TypeScript interfaces for project, minor job, subcontract, PO, and tasks"

# Commit 18: Client APIs
git add "client/src/api/"
git commit -m "feat: add client API endpoints for project, subcontract, PO, minor job, and task operations"

# Commit 19: Client Remarks Chat styling
git add "client/src/components/RemarksChat.tsx"
git commit -m "refactor: improve RemarksChat layout and responsive styling"

# Commit 20: Client Theme css styling
git add "client/src/styles/theme.css"
git commit -m "style: restore natural page scrolling for remarks chat views"

# Commit 21: Client navigation routes
git add "client/src/constants/routes.enum.ts" "client/src/routes.tsx" "client/src/layouts/RootLayout.tsx"
git commit -m "feat: configure client routes and sidebar navigation for subcontracts and PO lists"

# Commit 22: Convert Quotation Modal
git add "client/src/components/ConvertQuotationModal.tsx"
git commit -m "feat: add ConvertQuotationModal component"

# Commit 23: Client Enquiries view
git add "client/src/features/enquiries/" "client/src/components/EnquiryFormModal.tsx"
git commit -m "feat: update client enquiries pages with new layout and routing integration"

# Commit 24: Client Minor Jobs view
git add "client/src/features/minor-jobs/"
git commit -m "feat: update client minor-jobs pages with new layout and routing integration"

# Commit 25: Client Projects details & listings
git add "client/src/features/projects/ProjectDetail.tsx" "client/src/features/projects/Projects.tsx" "client/src/features/projects/PurchaseOrderDetail.tsx" "client/src/features/projects/PurchaseOrdersList.tsx" "client/src/features/projects/SubcontractDetail.tsx" "client/src/features/projects/SubcontractsList.tsx"
git commit -m "feat: update client projects, subcontracts, and PO listing pages"

# Commit 26: Client Quotations view
git add "client/src/features/quotations/"
git commit -m "feat: update client quotations pages with new layout and routing integration"

# Commit 27: Client Staff Details view
git add "client/src/features/staff/StaffDetail.tsx"
git commit -m "feat: update staff details page"

# Commit 28: Final check and commit of any remaining modified files on server and client
git add -A
git commit -m "refactor: minor backend improvements and integration updates"
