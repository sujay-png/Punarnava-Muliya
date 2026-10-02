"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { firestoreService } from "@/lib/api/firestore";
import { tenantsApi } from "@/features/tenants/api/tenants.api";
import { Tenant, TenantSchema } from "@/lib/models/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface TenantFormProps {
  initialData?: Tenant;
  initialDeposit?: { amount: number; mode: string };
}

export function TenantForm({ initialData, initialDeposit }: TenantFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [depositAmount, setDepositAmount] = useState<number>(initialDeposit?.amount ?? 5000);
  const [depositMode, setDepositMode] = useState<string>(initialDeposit?.mode ?? "upi");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Tenant>({
    resolver: zodResolver(TenantSchema) as any,
    defaultValues: initialData || {
      status: "active",
      recipientCount: 0,
      joinDate: new Date(),
    } as any,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: Tenant) => {
    try {
      setIsSubmitting(true);
      // fallback for emergency contact if empty
      if (!data.emergencyContact) {
        data.emergencyContact = data.guardianPhone || data.fatherPhone || "";
      }

      if (initialData?.id) {
        await tenantsApi.updateTenantWithDeposit(initialData.id, data as Tenant, depositAmount, depositMode, photoFile);
        toast.success("Tenant updated successfully");
      } else {
        await tenantsApi.registerTenantWithStay(data as Tenant, depositAmount, depositMode, photoFile);
        toast.success("Tenant registered successfully");
      }
      
      router.push("/dashboard/tenants");
    } catch (error: any) {
      toast.error("Failed to save tenant: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMsg = ({ field }: { field: keyof Tenant }) => {
    const msg = errors[field]?.message as string;
    return msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
  };

  const onInvalid = (errors: any) => {
    console.log("Form Validation Errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    toast.error(`Cannot save: ${firstError?.message || "Please check all required fields (marked with *)"}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
      
      {/* 1. Basic & Room Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
          <CardDescription>Primary identification and stay information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="col-span-full md:col-span-1 lg:col-span-1 row-span-2 flex flex-col items-center justify-center space-y-4 border rounded-xl p-4 bg-muted/20">
            <Avatar className="h-32 w-32 cursor-pointer border-2 border-border" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={photoPreview || ""} />
              <AvatarFallback className="bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoChange} 
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </Button>
            <p className="text-xs text-muted-foreground text-center">Passport size recommended</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="John Doe" {...register("name")} />
            <ErrorMsg field="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input id="phone" placeholder="9876543210" {...register("phone")} />
            <ErrorMsg field="phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomNo">Room Number <span className="text-destructive">*</span></Label>
            <Input id="roomNo" placeholder="A-101" {...register("roomNo")} />
            <ErrorMsg field="roomNo" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent (₹) <span className="text-destructive">*</span></Label>
            <Input id="monthlyRent" type="number" placeholder="5000" {...register("monthlyRent", { valueAsNumber: true })} />
            <ErrorMsg field="monthlyRent" />
          </div>

          <div className="space-y-2">
            <Label>Join Date <span className="text-destructive">*</span></Label>
            <DatePicker 
              value={watch("joinDate")} 
              onChange={(d) => d && setValue("joinDate", d)} 
            />
            <ErrorMsg field="joinDate" />
          </div>

        </CardContent>
      </Card>

      {/* Security Deposit */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle>Security Deposit</CardTitle>
            <CardDescription>Initial deposit details for the new stay</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount (₹) <span className="text-destructive">*</span></Label>
              <Input id="depositAmount" type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode <span className="text-destructive">*</span></Label>
              <Select onValueChange={(val) => val && setDepositMode(val)} value={depositMode}>
                <SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      {/* 2. Identity & Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="space-y-2">
            <Label>ID Proof Type <span className="text-destructive">*</span></Label>
            <Select onValueChange={(val) => setValue("idProofType", val as any)} value={watch("idProofType") || ""}>
              <SelectTrigger><SelectValue placeholder="Select ID Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                <SelectItem value="PAN">PAN</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <ErrorMsg field="idProofType" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number <span className="text-destructive">*</span></Label>
            <Input id="idNumber" placeholder="XXXX XXXX XXXX" {...register("idNumber")} />
            <ErrorMsg field="idNumber" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
            <ErrorMsg field="email" />
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <DatePicker 
              value={watch("dob") as Date} 
              onChange={(d) => d && setValue("dob", d)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" {...register("age", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label>Marital Status <span className="text-destructive">*</span></Label>
            <Select onValueChange={(val) => setValue("maritalStatus", val as any)} value={watch("maritalStatus") || ""}>
              <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Unmarried">Unmarried</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
              </SelectContent>
            </Select>
            <ErrorMsg field="maritalStatus" />
          </div>

          <div className="space-y-2 col-span-full">
            <Label htmlFor="permanentAddress">Permanent Address</Label>
            <Input id="permanentAddress" {...register("permanentAddress")} />
          </div>
        </CardContent>
      </Card>

      {/* 3. Occupation */}
      <Card>
        <CardHeader>
          <CardTitle>Occupation & Institute</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="space-y-2">
            <Label>Occupation Status <span className="text-destructive">*</span></Label>
            <Select onValueChange={(val) => setValue("occupationStatus", val as any)} value={watch("occupationStatus") || ""}>
              <SelectTrigger><SelectValue placeholder="Select Occupation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Working Professional">Working Professional</SelectItem>
                <SelectItem value="Business Owner">Business Owner</SelectItem>
              </SelectContent>
            </Select>
            <ErrorMsg field="occupationStatus" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company / Institute Name</Label>
            <Input id="companyName" {...register("companyName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone">Institute Phone</Label>
            <Input id="companyPhone" {...register("companyPhone")} />
          </div>

          <div className="space-y-2 col-span-full md:col-span-2">
            <Label htmlFor="companyAddress">Company / Institute Address</Label>
            <Input id="companyAddress" {...register("companyAddress")} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Guardian / Family */}
      <Card>
        <CardHeader>
          <CardTitle>Family & Guardian</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          
          <div className="space-y-4 border p-4 rounded-xl">
            <h4 className="font-medium text-sm">Father's Details</h4>
            <div className="space-y-2">
              <Label htmlFor="fatherName">Name</Label>
              <Input id="fatherName" {...register("fatherName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherPhone">Phone</Label>
              <Input id="fatherPhone" {...register("fatherPhone")} />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-xl">
            <h4 className="font-medium text-sm">Mother's Details</h4>
            <div className="space-y-2">
              <Label htmlFor="motherName">Name</Label>
              <Input id="motherName" {...register("motherName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherPhone">Phone</Label>
              <Input id="motherPhone" {...register("motherPhone")} />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-xl col-span-full md:col-span-1">
            <h4 className="font-medium text-sm">Local Guardian Details (Emergency)</h4>
            <div className="space-y-2">
              <Label htmlFor="guardianName">Name</Label>
              <Input id="guardianName" {...register("guardianName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Phone</Label>
              <Input id="guardianPhone" {...register("guardianPhone")} />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* 5. Health & Other */}
      <Card>
        <CardHeader>
          <CardTitle>Health & Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="space-y-2">
            <Label>Blood Group <span className="text-destructive">*</span></Label>
            <Select onValueChange={(val) => setValue("bloodGroup", val as any)} value={watch("bloodGroup") || ""}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ErrorMsg field="bloodGroup" />
          </div>

          <div className="space-y-2 col-span-full md:col-span-2">
            <Label htmlFor="healthCondition">Health Conditions (Any illness/medicines)</Label>
            <Input id="healthCondition" placeholder="List any existing conditions..." {...register("healthCondition")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleModel">Vehicle Model</Label>
            <Input id="vehicleModel" {...register("vehicleModel")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
            <Input id="vehicleNumber" {...register("vehicleNumber")} />
          </div>

        </CardContent>
      </Card>

      {/* 6. Declaration */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Declaration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            I hereby declare that the information provided above is true and correct to the best of my knowledge. I agree to abide by all the rules and regulations of the PG. I understand that violation of PG rules may lead to eviction without refund.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signature">Signature (Full Name) <span className="text-destructive">*</span></Label>
              <Input id="signature" {...register("signature")} />
              <ErrorMsg field="signature" />
            </div>
            <div className="space-y-2">
              <Label>Declaration Date</Label>
              <DatePicker 
                value={watch("declarationDate") as Date || new Date()} 
                onChange={(d) => d && setValue("declarationDate", d)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pb-10">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-32">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save</>}
        </Button>
      </div>

    </form>
  );
}
