'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LegacySelect as Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToastStore } from '@/stores/toastStore';
import {
  ArrowLeft,
  Shield,
  Package,
  Check,
  AlertTriangle,
} from 'lucide-react';

const weaponTypes = [
  { value: '9mm Pistol', label: '9mm Pistol' },
  { value: '.303 Rifle', label: '.303 Rifle' },
  { value: '7.62mm Rifle', label: '7.62mm Rifle' },
  { value: 'AK-47', label: 'AK-47' },
  { value: 'INSAS Rifle', label: 'INSAS Rifle' },
  { value: 'Tear Gas Gun', label: 'Tear Gas Gun' },
  { value: 'Stun Gun', label: 'Stun Gun' },
  { value: 'Lathi', label: 'Lathi' },
  { value: 'Baton', label: 'Baton' },
  { value: 'Other', label: 'Other' },
];

const weaponConditions = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
  { value: 'CONDEMNED', label: 'Condemned' },
];

const ammunitionTypes = [
  { value: '9mm', label: '9mm Rounds' },
  { value: '.303', label: '.303 Rounds' },
  { value: '7.62mm', label: '7.62mm Rounds' },
  { value: '5.56mm', label: '5.56mm Rounds' },
  { value: 'Tear Gas Shell', label: 'Tear Gas Shell' },
  { value: 'Rubber Bullets', label: 'Rubber Bullets' },
  { value: 'Blank Rounds', label: 'Blank Rounds' },
  { value: 'Other', label: 'Other' },
];

export default function NewArmouryItemPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('weapon');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weapon form state
  const [weaponForm, setWeaponForm] = useState({
    weaponId: '',
    type: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    caliber: '',
    condition: 'GOOD',
    purchaseDate: '',
    purchasePrice: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    notes: '',
  });

  // Ammunition form state
  const [ammoForm, setAmmoForm] = useState({
    type: '',
    quantity: '',
    batchNumber: '',
    manufacturer: '',
    manufactureDate: '',
    expiryDate: '',
    purchaseDate: '',
    purchasePrice: '',
    minStockLevel: '',
    notes: '',
  });

  const handleWeaponChange = (field: string, value: string) => {
    setWeaponForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAmmoChange = (field: string, value: string) => {
    setAmmoForm(prev => ({ ...prev, [field]: value }));
  };

  const generateWeaponId = () => {
    const prefix = 'WPN-KOR';
    const number = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    setWeaponForm(prev => ({ ...prev, weaponId: `${prefix}-${number}` }));
  };

  const handleWeaponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    addToast({
      type: 'success',
      title: 'Weapon Added',
      message: `Weapon ${weaponForm.weaponId} has been added to the armoury`,
    });

    setIsSubmitting(false);
    router.push('/armoury');
  };

  const handleAmmoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    addToast({
      type: 'success',
      title: 'Ammunition Added',
      message: `${ammoForm.quantity} units of ${ammoForm.type} ammunition added to inventory`,
    });

    setIsSubmitting(false);
    router.push('/armoury');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add to Armoury</h1>
              <p className="text-foreground-muted">Register new weapon or ammunition</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="weapon">
              <Shield className="h-4 w-4 mr-2" />
              Add Weapon
            </TabsTrigger>
            <TabsTrigger value="ammunition">
              <Package className="h-4 w-4 mr-2" />
              Add Ammunition
            </TabsTrigger>
          </TabsList>

          {/* Weapon Form */}
          <TabsContent value="weapon">
            <form onSubmit={handleWeaponSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weapon Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              label="Weapon ID *"
                              value={weaponForm.weaponId}
                              onChange={(v: string) => handleWeaponChange('weaponId', v)}
                              placeholder="WPN-KOR-0001"
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="mt-6"
                            onClick={generateWeaponId}
                          >
                            Generate
                          </Button>
                        </div>
                        <Select
                          label="Weapon Type *"
                          value={weaponForm.type}
                          onChange={(v: string) => handleWeaponChange('type', v)}
                          options={weaponTypes}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Serial Number *"
                          value={weaponForm.serialNumber}
                          onChange={(v: string) => handleWeaponChange('serialNumber', v)}
                          placeholder="Manufacturer serial number"
                          required
                        />
                        <Input
                          label="Caliber"
                          value={weaponForm.caliber}
                          onChange={(v: string) => handleWeaponChange('caliber', v)}
                          placeholder="e.g., 9mm, .303"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Manufacturer"
                          value={weaponForm.manufacturer}
                          onChange={(v: string) => handleWeaponChange('manufacturer', v)}
                          placeholder="e.g., IOF, Colt"
                        />
                        <Input
                          label="Model"
                          value={weaponForm.model}
                          onChange={(v: string) => handleWeaponChange('model', v)}
                          placeholder="Model name/number"
                        />
                      </div>
                      <Select
                        label="Condition *"
                        value={weaponForm.condition}
                        onChange={(v: string) => handleWeaponChange('condition', v)}
                        options={weaponConditions}
                      />
                    </CardContent>
                  </Card>

                  {/* Purchase & Maintenance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Purchase & Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Purchase Date"
                          type="date"
                          value={weaponForm.purchaseDate}
                          onChange={(v: string) => handleWeaponChange('purchaseDate', v)}
                        />
                        <Input
                          label="Purchase Price (Rs.)"
                          type="number"
                          value={weaponForm.purchasePrice}
                          onChange={(v: string) => handleWeaponChange('purchasePrice', v)}
                          placeholder="Amount in rupees"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Last Maintenance Date"
                          type="date"
                          value={weaponForm.lastMaintenanceDate}
                          onChange={(v: string) => handleWeaponChange('lastMaintenanceDate', v)}
                        />
                        <Input
                          label="Next Maintenance Due"
                          type="date"
                          value={weaponForm.nextMaintenanceDate}
                          onChange={(v: string) => handleWeaponChange('nextMaintenanceDate', v)}
                        />
                      </div>
                      <Textarea
                        label="Notes"
                        value={weaponForm.notes}
                        onChange={(v: string) => handleWeaponChange('notes', v)}
                        placeholder="Any additional notes about this weapon..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="border-warning/30 bg-warning/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                        <div>
                          <p className="font-medium text-warning">Important</p>
                          <ul className="text-sm text-foreground-muted mt-2 space-y-1 list-disc list-inside">
                            <li>Verify serial number before entry</li>
                            <li>Check weapon condition physically</li>
                            <li>Ensure proper documentation</li>
                            <li>Update maintenance schedule</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">...</span>
                        Adding Weapon...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Add Weapon
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* Ammunition Form */}
          <TabsContent value="ammunition">
            <form onSubmit={handleAmmoSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ammunition Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Ammunition Type *"
                          value={ammoForm.type}
                          onChange={(v: string) => handleAmmoChange('type', v)}
                          options={ammunitionTypes}
                        />
                        <Input
                          label="Quantity *"
                          type="number"
                          value={ammoForm.quantity}
                          onChange={(v: string) => handleAmmoChange('quantity', v)}
                          placeholder="Number of rounds"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Batch Number *"
                          value={ammoForm.batchNumber}
                          onChange={(v: string) => handleAmmoChange('batchNumber', v)}
                          placeholder="Manufacturer batch number"
                          required
                        />
                        <Input
                          label="Manufacturer"
                          value={ammoForm.manufacturer}
                          onChange={(v: string) => handleAmmoChange('manufacturer', v)}
                          placeholder="e.g., IOF, CBC"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Manufacture Date"
                          type="date"
                          value={ammoForm.manufactureDate}
                          onChange={(v: string) => handleAmmoChange('manufactureDate', v)}
                        />
                        <Input
                          label="Expiry Date"
                          type="date"
                          value={ammoForm.expiryDate}
                          onChange={(v: string) => handleAmmoChange('expiryDate', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Purchase & Stock */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Purchase & Stock Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Purchase Date"
                          type="date"
                          value={ammoForm.purchaseDate}
                          onChange={(v: string) => handleAmmoChange('purchaseDate', v)}
                        />
                        <Input
                          label="Purchase Price (Rs.)"
                          type="number"
                          value={ammoForm.purchasePrice}
                          onChange={(v: string) => handleAmmoChange('purchasePrice', v)}
                          placeholder="Total amount"
                        />
                      </div>
                      <Input
                        label="Minimum Stock Level"
                        type="number"
                        value={ammoForm.minStockLevel}
                        onChange={(v: string) => handleAmmoChange('minStockLevel', v)}
                        placeholder="Alert when stock falls below this"
                      />
                      <Textarea
                        label="Notes"
                        value={ammoForm.notes}
                        onChange={(v: string) => handleAmmoChange('notes', v)}
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="border-info/30 bg-info/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-info flex-shrink-0" />
                        <div>
                          <p className="font-medium text-info">Stock Management</p>
                          <ul className="text-sm text-foreground-muted mt-2 space-y-1 list-disc list-inside">
                            <li>Verify batch number</li>
                            <li>Check expiry dates</li>
                            <li>Store in designated area</li>
                            <li>Update inventory register</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">...</span>
                        Adding Ammunition...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Add Ammunition
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
