import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import type { AmcContract } from "../interfaces/amc.interface";
import { canRenewAmc } from "../utils/amcRenewal";

interface AmcBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingContract: AmcContract | null;
  onRenew?: (contract: AmcContract) => void;
}

export function AmcBlockedModal({
  isOpen,
  onClose,
  existingContract,
  onRenew,
}: AmcBlockedModalProps) {
  const canRenew = existingContract ? canRenewAmc(existingContract) : false;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Client already has an AMC</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{existingContract?.clientName}</strong> already
                has contract{" "}
                <strong className="text-foreground">{existingContract?.amcNo}</strong> (
                {existingContract?.status}).
              </p>
              <p>You cannot create a second AMC for the same client. Use renewal to start a new contract period.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {canRenew && existingContract && onRenew && (
            <AlertDialogAction
              className="bg-pink-700 hover:bg-pink-800 text-white"
              onClick={() => {
                onRenew(existingContract);
                onClose();
              }}
            >
              Renew AMC
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
