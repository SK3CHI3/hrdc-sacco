'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nationalId: '',
    dateOfBirth: '',
    physicalAddress: '',
    postalAddress: '',
    occupation: '',
    employer: '',
    referralCode: '',
  });

  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    passport: null as File | null,
  });

  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUserId(session.user.id);

      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (member) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idFront' | 'idBack' | 'passport') => {
    if (e.target.files && e.target.files[0]) {
      setDocuments({
        ...documents,
        [type]: e.target.files[0],
      });
    }
  };

  const uploadDocument = async (file: File, memberId: string, docType: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${memberId}/${docType}_${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('member-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('member-documents')
      .getPublicUrl(fileName);

    return { url: publicUrl, fileName: file.name, size: file.size };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.nationalId || !formData.dateOfBirth) {
        setError('Please fill in all required fields');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!documents.idFront || !documents.idBack || !documents.passport) {
        setError('Please upload all required documents');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data: memberNumberData } = await supabase.rpc('generate_member_number');
        const { data: referralCodeData } = await supabase.rpc('generate_referral_code');

        let referredBy = null;
        if (formData.referralCode) {
          const { data: referrer } = await supabase
            .from('members')
            .select('id')
            .eq('referral_code', formData.referralCode)
            .single();
          
          if (referrer) {
            referredBy = referrer.id;
          }
        }

        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            user_id: userId!,
            member_number: memberNumberData,
            national_id: formData.nationalId,
            date_of_birth: formData.dateOfBirth,
            physical_address: formData.physicalAddress,
            postal_address: formData.postalAddress,
            occupation: formData.occupation,
            employer: formData.employer,
            referral_code: referralCodeData,
            referred_by: referredBy,
            status: 'PENDING_APPROVAL',
          })
          .select()
          .single();

        if (memberError) throw memberError;

        const docUploads = [
          { file: documents.idFront!, type: 'NATIONAL_ID_FRONT' },
          { file: documents.idBack!, type: 'NATIONAL_ID_BACK' },
          { file: documents.passport!, type: 'PASSPORT_PHOTO' },
        ];

        for (const doc of docUploads) {
          const { url, fileName, size } = await uploadDocument(doc.file, newMember.id, doc.type);
          
          await supabase.from('documents').insert({
            member_id: newMember.id,
            document_type: doc.type,
            file_url: url,
            file_name: fileName,
            file_size: size,
          });
        }

        if (referredBy) {
          await supabase.from('referrals').insert({
            referrer_member_id: referredBy,
            referred_member_id: newMember.id,
          });
        }

        await supabase.from('notifications').insert({
          user_id: userId!,
          title: 'Application Submitted',
          message: 'Your membership application has been submitted successfully. You will be notified once it is reviewed.',
          type: 'APPLICATION',
        });

        setSuccess('Application submitted successfully! Please wait for approval.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (err: any) {
        setError(err.message || 'Failed to submit application');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Member Onboarding</h1>
          <p className="text-slate-600 mt-2">Complete your profile to become a member</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Personal Info</span>
            </div>
            <div className="w-16 h-0.5 bg-slate-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Documents</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === 1 ? 'Personal Information' : 'Upload Documents'}</CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Provide your personal details as they appear on your National ID' 
                : 'Upload clear photos of your identification documents'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nationalId">National ID Number *</Label>
                      <Input
                        id="nationalId"
                        name="nationalId"
                        type="text"
                        placeholder="12345678"
                        value={formData.nationalId}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physicalAddress">Physical Address</Label>
                    <Input
                      id="physicalAddress"
                      name="physicalAddress"
                      type="text"
                      placeholder="Street, Building, City"
                      value={formData.physicalAddress}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalAddress">Postal Address</Label>
                    <Input
                      id="postalAddress"
                      name="postalAddress"
                      type="text"
                      placeholder="P.O. Box 12345-00100"
                      value={formData.postalAddress}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        type="text"
                        placeholder="Your occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employer">Employer</Label>
                      <Input
                        id="employer"
                        name="employer"
                        type="text"
                        placeholder="Company name"
                        value={formData.employer}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <Input
                      id="referralCode"
                      name="referralCode"
                      type="text"
                      placeholder="Enter referral code if you have one"
                      value={formData.referralCode}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                      <Label htmlFor="idFront" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-slate-400 mb-2" />
                          <span className="text-sm font-medium text-slate-900">National ID (Front)</span>
                          <span className="text-xs text-slate-600 mt-1">
                            {documents.idFront ? documents.idFront.name : 'Click to upload'}
                          </span>
                        </div>
                      </Label>
                      <Input
                        id="idFront"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'idFront')}
                        disabled={loading}
                      />
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                      <Label htmlFor="idBack" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-slate-400 mb-2" />
                          <span className="text-sm font-medium text-slate-900">National ID (Back)</span>
                          <span className="text-xs text-slate-600 mt-1">
                            {documents.idBack ? documents.idBack.name : 'Click to upload'}
                          </span>
                        </div>
                      </Label>
                      <Input
                        id="idBack"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'idBack')}
                        disabled={loading}
                      />
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                      <Label htmlFor="passport" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-slate-400 mb-2" />
                          <span className="text-sm font-medium text-slate-900">Passport Photo</span>
                          <span className="text-xs text-slate-600 mt-1">
                            {documents.passport ? documents.passport.name : 'Click to upload'}
                          </span>
                        </div>
                      </Label>
                      <Input
                        id="passport"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'passport')}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Please ensure all documents are clear and legible. Accepted formats: JPG, PNG, PDF
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <div className="flex justify-between">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className={step === 1 ? 'ml-auto' : ''}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : step === 1 ? 'Next' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
