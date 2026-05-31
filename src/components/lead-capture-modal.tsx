import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { upsertLeadUser } from "@/lib/bookings.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: (captured: boolean) => void;
}

export function LeadCaptureModal({ open, onClose }: Props) {
  const upsert = useServerFn(upsertLeadUser);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await upsert({ data: { name, phone } });
      sessionStorage.setItem("nuvia_lead", "captured");
      toast.success("Thanks — we'll personalise your view");
      onClose(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { sessionStorage.setItem("nuvia_lead","dismissed"); onClose(false); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Unlock full property details</DialogTitle>
          <DialogDescription>Get priority access and tailored recommendations.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="l-name">Name</Label>
            <Input id="l-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="l-phone">Phone</Label>
            <Input id="l-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
