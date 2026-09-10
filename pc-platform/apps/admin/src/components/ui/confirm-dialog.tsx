'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@pc-platform/ui';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  confirmationWord?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  confirmationWord,
}: ConfirmDialogProps) {
  const [typedWord, setTypedWord] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setTypedWord('');
    }
  }, [open]);

  const canConfirm = !confirmationWord || typedWord.trim().toLowerCase() === confirmationWord.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isLoading) onClose(); }}>
      <DialogContent className="max-w-md border-cyber-800 bg-[#0c101d] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-mono">
            {isDestructive ? (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-cyber-300 font-sans text-left pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {confirmationWord && (
          <div className="space-y-1.5 pt-2 border-t border-cyber-800/80">
            <label className="text-[11px] font-mono text-cyber-400">
              Type <span className="text-white font-bold underline">{confirmationWord}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              placeholder={confirmationWord}
              disabled={isLoading}
              className="w-full h-8 px-2.5 bg-cyber-900 border border-cyber-700 rounded text-xs font-mono text-white focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-cyber-800/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="font-mono text-xs"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDestructive ? 'danger' : 'gaming'}
            size="sm"
            onClick={() => {
              if (canConfirm) onConfirm();
            }}
            disabled={!canConfirm || isLoading}
            className="font-mono text-xs gap-1.5"
          >
            {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
            <span>{isLoading ? 'Processing...' : confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
