'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, KeyRound, Languages, Phone, Search, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import {
  COMPLAINT_CATEGORIES,
  PublicApiError,
  publicComplaintsApi,
  type ComplaintCategory,
  type ComplaintStatus,
  type PublicComplaintView,
  type PublicSubmitResult,
} from '@/lib/api/complaints';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface PortalStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
}

interface FIRStatus {
  firNumber: string;
  stationName: string;
  registrationDate: string;
  status: string;
  statusDescription: string;
  lastUpdated: string;
}

const statusColors: Partial<Record<ComplaintStatus, string>> = {
  SUBMITTED: 'bg-gray-100 text-gray-800',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const selectClass =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

const emptyForm = {
  category: '' as ComplaintCategory | '',
  subject: '',
  description: '',
  incidentDate: '',
  incidentLocation: '',
  isAnonymous: false,
  name: '',
  phone: '',
  email: '',
};

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

const describe = (err: unknown) => (err instanceof Error ? err.message : String(err));

export default function CitizenPortalPage() {
  const { t, locale, setLocale } = useI18n();

  const [stats, setStats] = useState<PortalStats | null>(null);
  useEffect(() => {
    fetch(`${API_BASE}/public/stats`, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => setStats(null));
  }, []);

  // ------------------------------------------------------------ file
  const [form, setForm] = useState(emptyForm);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<PublicSubmitResult | null>(null);
  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    if (!form.category) {
      setFileError(t('grievanceScreen.portal.category'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await publicComplaintsApi.submit({
        category: form.category,
        subject: form.subject,
        description: form.description,
        incidentDate: form.incidentDate ? `${form.incidentDate}T00:00:00+05:30` : undefined,
        incidentLocation: form.incidentLocation || undefined,
        isAnonymous: form.isAnonymous,
        complainantName: form.isAnonymous ? undefined : form.name,
        complainantPhone: form.isAnonymous ? undefined : form.phone,
        complainantEmail: form.isAnonymous ? undefined : form.email || undefined,
      });
      setSubmitted(result);
      setForm(emptyForm);
    } catch (err) {
      setFileError(describe(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------ track
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [anonymousTrack, setAnonymousTrack] = useState(false);
  const [view, setView] = useState<PublicComplaintView | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  const track = async () => {
    setTrackError(null);
    setView(null);
    setTracking(true);
    try {
      setView(
        await publicComplaintsApi.track(
          trackingNumber,
          anonymousTrack ? { accessCode } : { phone: trackPhone },
        ),
      );
    } catch (err) {
      setTrackError(err instanceof PublicApiError || err instanceof Error ? err.message : describe(err));
    } finally {
      setTracking(false);
    }
  };

  // ------------------------------------------------------------ FIR
  const [firNumber, setFirNumber] = useState('');
  const [firPhone, setFirPhone] = useState('');
  const [firStatus, setFirStatus] = useState<FIRStatus | null>(null);
  const [firError, setFirError] = useState<string | null>(null);

  const checkFIR = async () => {
    setFirError(null);
    setFirStatus(null);
    try {
      const res = await fetch(`${API_BASE}/public/fir-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ firNumber, phone: firPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
      setFirStatus(data);
    } catch (err) {
      setFirError(describe(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-blue-900 py-6 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Shield className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">{t('grievanceScreen.portal.title')}</h1>
              <p className="text-blue-200">{t('grievanceScreen.portal.org')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-blue-300 bg-transparent text-white hover:bg-blue-800"
            onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
          >
            <Languages className="mr-2 h-4 w-4" />
            {t('grievanceScreen.portal.language')}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {stats && (
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {[
              { label: t('grievanceScreen.portal.statsTotal'), value: stats.totalComplaints, tone: 'text-blue-600' },
              { label: t('grievanceScreen.portal.statsResolved'), value: stats.resolvedComplaints, tone: 'text-green-600' },
              { label: t('grievanceScreen.portal.statsPending'), value: stats.pendingComplaints, tone: 'text-orange-600' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6 text-center">
                  <div className={`text-3xl font-bold ${s.tone}`}>{s.value.toLocaleString('en-IN')}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="file" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 md:grid-cols-4 lg:w-[640px]">
            <TabsTrigger value="file">{t('grievanceScreen.portal.tabFile')}</TabsTrigger>
            <TabsTrigger value="track">{t('grievanceScreen.portal.tabTrack')}</TabsTrigger>
            <TabsTrigger value="fir">{t('grievanceScreen.portal.tabFir')}</TabsTrigger>
            <TabsTrigger value="missing">{t('grievanceScreen.portal.tabMissing')}</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle>{t('grievanceScreen.portal.fileTitle')}</CardTitle>
                <CardDescription>{t('grievanceScreen.portal.fileDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="py-8 text-center" data-testid="submitted">
                    <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                    <h3 className="mb-4 text-xl font-bold">{t('grievanceScreen.portal.submittedTitle')}</h3>
                    <p className="text-sm text-gray-600">{t('grievanceScreen.portal.trackingNumber')}</p>
                    <p className="mb-4 font-mono text-2xl font-bold text-blue-700" data-testid="tracking-number">
                      {submitted.trackingNumber}
                    </p>
                    {submitted.accessCode && (
                      <>
                        <p className="text-sm text-gray-600">{t('grievanceScreen.portal.accessCode')}</p>
                        <p className="mb-4 flex items-center justify-center gap-2 font-mono text-2xl font-bold tracking-widest" data-testid="public-access-code">
                          <KeyRound className="h-5 w-5" />
                          {submitted.accessCode}
                        </p>
                      </>
                    )}
                    <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">{t('grievanceScreen.portal.keepSafe')}</p>
                    <Button onClick={() => setSubmitted(null)}>{t('grievanceScreen.portal.fileAnother')}</Button>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="pc-category" className="mb-2 block text-sm font-medium">
                          {t('grievanceScreen.portal.category')} *
                        </label>
                        <select
                          id="pc-category"
                          className={selectClass}
                          value={form.category}
                          onChange={(e) => set('category', e.target.value as ComplaintCategory)}
                        >
                          <option value="">—</option>
                          {COMPLAINT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {t(`grievanceScreen.categories.${c}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="pc-date" className="mb-2 block text-sm font-medium">
                          {t('grievanceScreen.portal.incidentDate')}
                        </label>
                        <Input id="pc-date" type="date" value={form.incidentDate} onChange={(v: string) => set('incidentDate', v)} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pc-subject" className="mb-2 block text-sm font-medium">
                        {t('grievanceScreen.portal.subject')} *
                      </label>
                      <Input id="pc-subject" value={form.subject} onChange={(v: string) => set('subject', v)} className="font-bengali" />
                    </div>
                    <div>
                      <label htmlFor="pc-location" className="mb-2 block text-sm font-medium">
                        {t('grievanceScreen.portal.location')}
                      </label>
                      <Input id="pc-location" value={form.incidentLocation} onChange={(v: string) => set('incidentLocation', v)} />
                    </div>
                    <div>
                      <label htmlFor="pc-description" className="mb-2 block text-sm font-medium">
                        {t('grievanceScreen.portal.description')} *
                      </label>
                      <Textarea
                        id="pc-description"
                        rows={5}
                        value={form.description}
                        onChange={(v: string) => set('description', v)}
                        className="font-bengali"
                      />
                    </div>
                    <div className="border-t pt-5">
                      <h3 className="mb-3 font-medium">{t('grievanceScreen.portal.contact')}</h3>
                      <label className="mb-4 flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="pc-anonymous"
                          className="mt-1"
                          checked={form.isAnonymous}
                          onChange={(e) => set('isAnonymous', e.target.checked)}
                        />
                        <span>
                          <span className="text-sm">{t('grievanceScreen.portal.anonymous')}</span>
                          <span className="block text-xs text-gray-500">{t('grievanceScreen.portal.anonymousHint')}</span>
                        </span>
                      </label>
                      {!form.isAnonymous && (
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label htmlFor="pc-name" className="mb-2 block text-sm font-medium">
                              {t('grievanceScreen.portal.name')} *
                            </label>
                            <Input id="pc-name" value={form.name} onChange={(v: string) => set('name', v)} />
                          </div>
                          <div>
                            <label htmlFor="pc-phone" className="mb-2 block text-sm font-medium">
                              {t('grievanceScreen.portal.phone')} *
                            </label>
                            <Input id="pc-phone" inputMode="tel" value={form.phone} onChange={(v: string) => set('phone', v)} />
                          </div>
                          <div>
                            <label htmlFor="pc-email" className="mb-2 block text-sm font-medium">
                              {t('grievanceScreen.portal.email')}
                            </label>
                            <Input id="pc-email" type="email" value={form.email} onChange={(v: string) => set('email', v)} />
                          </div>
                        </div>
                      )}
                    </div>
                    <ErrorText message={fileError} />
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? t('grievanceScreen.portal.submitting') : t('grievanceScreen.portal.submit')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-gray-500">{t('grievanceScreen.portal.privacy')}</p>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="track">
            <Card>
              <CardHeader>
                <CardTitle>{t('grievanceScreen.portal.trackTitle')}</CardTitle>
                <CardDescription>{t('grievanceScreen.portal.trackDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 grid gap-3 md:grid-cols-3">
                  <Input
                    aria-label={t('grievanceScreen.portal.trackingNumber')}
                    placeholder={t('grievanceScreen.portal.trackingNumber')}
                    value={trackingNumber}
                    onChange={(v: string) => setTrackingNumber(v)}
                  />
                  {anonymousTrack ? (
                    <Input
                      aria-label={t('grievanceScreen.portal.accessCode')}
                      placeholder={t('grievanceScreen.portal.accessCode')}
                      value={accessCode}
                      onChange={(v: string) => setAccessCode(v)}
                    />
                  ) : (
                    <Input
                      aria-label={t('grievanceScreen.portal.phone')}
                      placeholder={t('grievanceScreen.portal.phone')}
                      inputMode="tel"
                      value={trackPhone}
                      onChange={(v: string) => setTrackPhone(v)}
                    />
                  )}
                  <Button onClick={track} disabled={tracking || !trackingNumber}>
                    <Search className="mr-2 h-4 w-4" />
                    {t('grievanceScreen.portal.track')}
                  </Button>
                </div>
                <label className="mb-6 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={anonymousTrack} onChange={(e) => setAnonymousTrack(e.target.checked)} />
                  {t('grievanceScreen.portal.filedAnonymously')}
                </label>
                <ErrorText message={trackError} />

                {view && (
                  <div className="space-y-6" data-testid="public-view">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-500">{t('grievanceScreen.portal.trackingNumber')}</div>
                          <div className="font-mono font-bold">{view.trackingNumber}</div>
                        </div>
                        <Badge className={statusColors[view.status]}>{t(`grievanceScreen.statuses.${view.status}`)}</Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-sm text-gray-500">{t('grievanceScreen.portal.category')}</div>
                          <div>{t(`grievanceScreen.categories.${view.category}`)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">{t('grievanceScreen.portal.station')}</div>
                          <div>{view.stationName || '—'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">{t('grievanceScreen.portal.submittedAt')}</div>
                          <div>{new Date(view.submittedAt).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-gray-500">{t('grievanceScreen.portal.subject')}</div>
                        <div className="font-bengali">{view.subject}</div>
                      </div>
                      {view.handledWithRelated && (
                        <p className="mt-4 text-sm text-blue-800">{t('grievanceScreen.portal.handledWithRelated')}</p>
                      )}
                      {view.rejectionReason && (
                        <p className="mt-4 text-sm text-red-700">
                          {t('grievanceScreen.portal.rejectionReason')}: {view.rejectionReason}
                        </p>
                      )}
                    </div>

                    {view.responses.length > 0 && (
                      <div>
                        <h4 className="mb-3 font-medium">{t('grievanceScreen.portal.responses')}</h4>
                        <div className="space-y-3">
                          {view.responses.map((r, i) => (
                            <div key={i} className="rounded-lg border border-green-200 bg-green-50 p-4" data-testid="public-response">
                              <p className="whitespace-pre-wrap text-sm font-bengali">{r.body}</p>
                              <p className="mt-2 text-xs text-gray-500">{new Date(r.issuedAt).toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="mb-4 font-medium">{t('grievanceScreen.portal.progress')}</h4>
                      <div className="space-y-4">
                        {view.history.map((h, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="h-3 w-3 rounded-full bg-blue-500" />
                              {index < view.history.length - 1 && <div className="mt-1 h-full w-0.5 bg-gray-200" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="text-sm font-medium font-bengali">{h.message}</div>
                              <div className="text-xs text-gray-500">{new Date(h.at).toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fir">
            <Card>
              <CardHeader>
                <CardTitle>{t('grievanceScreen.portal.firTitle')}</CardTitle>
                <CardDescription>{t('grievanceScreen.portal.firDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <Input
                    aria-label={t('grievanceScreen.portal.firNumber')}
                    placeholder={t('grievanceScreen.portal.firNumber')}
                    value={firNumber}
                    onChange={(v: string) => setFirNumber(v)}
                  />
                  <Input
                    aria-label={t('grievanceScreen.portal.phone')}
                    placeholder={t('grievanceScreen.portal.phone')}
                    inputMode="tel"
                    value={firPhone}
                    onChange={(v: string) => setFirPhone(v)}
                  />
                  <Button onClick={checkFIR} disabled={!firNumber || !firPhone}>
                    <Search className="mr-2 h-4 w-4" />
                    {t('grievanceScreen.portal.check')}
                  </Button>
                </div>
                <ErrorText message={firError} />
                {firStatus && (
                  <div className="rounded-lg bg-gray-50 p-6" data-testid="fir-status">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="font-mono text-xl font-bold">{firStatus.firNumber}</div>
                      <Badge>{firStatus.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-gray-500">{t('grievanceScreen.portal.station')}</div>
                        <div>{firStatus.stationName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">{t('grievanceScreen.portal.registered')}</div>
                        <div>{new Date(firStatus.registrationDate).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">{t('grievanceScreen.portal.lastUpdated')}</div>
                        <div>{new Date(firStatus.lastUpdated).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                    <p className="mt-4 text-gray-700">{firStatus.statusDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="missing">
            <Card>
              <CardHeader>
                <CardTitle>{t('grievanceScreen.portal.missingTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{t('grievanceScreen.portal.missingBody')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('grievanceScreen.portal.emergency')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { n: '112', label: t('grievanceScreen.portal.emergencyAll') },
                { n: '100', label: t('grievanceScreen.portal.emergencyPolice') },
                { n: '1091', label: t('grievanceScreen.portal.emergencyWomen') },
                { n: '1098', label: t('grievanceScreen.portal.emergencyChild') },
                { n: '1930', label: t('grievanceScreen.portal.emergencyCyber') },
              ].map((e) => (
                <a key={e.n} href={`tel:${e.n}`} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                  <Phone className="h-6 w-6 text-blue-700" />
                  <div>
                    <div className="font-bold text-blue-700">{e.n}</div>
                    <div className="text-sm text-gray-600">{e.label}</div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
