import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssetsList from "@/pages/dashboard/files/assets-list";
import React from "react";

type SelectAssetsModalProps = {
  onClose: () => void;
};

const SelectAssetsModal: React.FC<SelectAssetsModalProps> = ({ onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90dvh] min-w-0 overflow-y-auto sm:min-w-[min(90%,72rem)]">
        <DialogHeader>
          <DialogTitle>Select PDFs from Files</DialogTitle>
        </DialogHeader>
        <AssetsList enableSelect />
      </DialogContent>
    </Dialog>
  );
};

export default SelectAssetsModal;
