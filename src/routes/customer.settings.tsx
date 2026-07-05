import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";
import { Camera, Shield, Upload } from "lucide-react";

export const Route = createFileRoute("/customer/settings")({
  component: Settings,
});

function Settings() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [faceImage, setFaceImage] = useState(user?.faceImage || "");

  // Camera settings state
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: "user" }
      });
      setStream(mediaStream);
      setShowCamera(true);
      // Wait for DOM video mount
      setTimeout(() => {
        const video = document.getElementById("webcam-preview") as HTMLVideoElement;
        if (video) {
          video.srcObject = mediaStream;
          video.play().catch(err => console.error("Error playing video stream:", err));
        }
      }, 200);
    } catch (err) {
      toast.error("Could not open camera. Please check browser camera permissions.");
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById("webcam-preview") as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setFaceImage(dataUrl);
        toast.success("Profile photo captured!");
      }
    }
    stopCamera();
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFaceImage(base64String);
        toast.success("Face image uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile({
      name,
      phone,
      email,
      faceImage,
    });
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Settings</div>
        <h1 className="text-3xl font-display font-bold mt-1">Account & preferences</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 glass md:col-span-2 space-y-4">
          <div className="text-lg font-semibold border-b border-border/50 pb-2">Profile Details</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card/50 border-border" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card/50 border-border" />
            </div>
            <div className="sm:col-span-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card/50 border-border" />
            </div>
          </div>
        </Card>

        <Card className="p-6 glass md:col-span-1 flex flex-col items-center justify-between space-y-4">
          <div className="text-lg font-semibold w-full text-left border-b border-border/50 pb-2">Face Verification</div>
          
          <div className="relative group size-32 rounded-full overflow-hidden border-2 border-primary/40 bg-card/60 flex items-center justify-center">
            {faceImage ? (
              <img src={faceImage} alt="Face Profile" className="size-full object-cover" />
            ) : (
              <Camera className="size-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Button variant="outline" size="sm" onClick={startCamera} className="w-full">
              <Camera className="size-4 mr-2" /> Capture Camera
            </Button>
            <label className="w-full text-center">
              <span className="inline-flex items-center justify-center gap-1.5 w-full rounded-md text-xs font-semibold ring-1 ring-border py-2 bg-card/25 hover:bg-card/45 cursor-pointer transition">
                <Upload className="size-3.5" /> Upload Photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFaceUpload} />
            </label>
          </div>
          
          <p className="text-[11px] text-muted-foreground text-center">
            Used by the 7-layer verification desk for biometric confirmation.
          </p>
        </Card>
      </div>

      <Card className="p-6 glass space-y-4">
        <div className="text-lg font-semibold">Security preferences</div>
        {[
          { l: "Push notification for every SIM request", d: "Receive a push on your trusted device for every incoming request." },
          { l: "Auto-block on geo anomaly", d: "Reject any request originating from outside your registered state." },
          { l: "Email weekly security report", d: "Summary of risk score, attempts blocked, and lock status." },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-t border-border/60 first:border-t-0 first:pt-0">
            <div>
              <div className="font-medium">{s.l}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
            <Switch defaultChecked={i !== 2} />
          </div>
        ))}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save changes</Button>
      </div>

      {/* Real-time WebCam modal */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="glass-strong max-w-sm">
          <DialogHeader>
            <DialogTitle>Capture Face Profile</DialogTitle>
            <DialogDescription>Center your face in the camera view below.</DialogDescription>
          </DialogHeader>
          <div className="my-4 aspect-square bg-black rounded-xl overflow-hidden relative border border-border">
            <video id="webcam-preview" autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={stopCamera}>Cancel</Button>
            <Button onClick={capturePhoto}>Capture Photo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
