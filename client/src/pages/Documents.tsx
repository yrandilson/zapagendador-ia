import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const DOCUMENT_TYPES = [
  { value: "proof", label: "Comprovante" },
  { value: "receipt", label: "Recibo" },
  { value: "contract", label: "Contrato" },
  { value: "other", label: "Outro" },
] as const;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(String(reader.result ?? ""));
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

export default function Documents() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? 0;
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<(typeof DOCUMENT_TYPES)[number]["value"]>("proof");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const customersQuery = trpc.customer.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const documentsQuery = trpc.document.list.useQuery(
    { tenantId, clientId: selectedClientId ?? 0 },
    { enabled: Boolean(user?.tenantId && selectedClientId) }
  );

  const uploadMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      setSelectedFile(null);
      setIsUploading(false);
      void documentsQuery.refetch();
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  useEffect(() => {
    if (!selectedClientId && customersQuery.data?.length) {
      setSelectedClientId(customersQuery.data[0]?.id ?? null);
    }
  }, [customersQuery.data, selectedClientId]);

  const selectedClient = useMemo(
    () => customersQuery.data?.find((customer) => customer.id === selectedClientId) ?? null,
    [customersQuery.data, selectedClientId]
  );

  const handleUpload = async () => {
    if (!tenantId || !selectedClientId || !selectedFile) return;

    setIsUploading(true);
    const fileDataBase64 = await toBase64(selectedFile);

    uploadMutation.mutate({
      tenantId,
      clientId: selectedClientId,
      fileName: selectedFile.name,
      fileType: selectedFile.type || "application/octet-stream",
      fileSize: selectedFile.size,
      fileDataBase64,
      documentType,
    });
  };

  const documents = documentsQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Documentos</h1>
            <p className="text-slate-600 mt-1">Faça upload, visualize e gerencie arquivos dos clientes</p>
          </div>
          <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1.5">
            <FileText className="h-3.5 w-3.5" />
            Fluxo real com storage
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Upload de arquivo</CardTitle>
              <CardDescription>Selecione um cliente e envie um documento para o storage e banco</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select
                    value={selectedClientId ? String(selectedClientId) : ""}
                    onValueChange={(value) => setSelectedClientId(Number(value))}
                    disabled={!customersQuery.data?.length}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder={customersQuery.isFetching ? "Carregando clientes..." : "Selecione um cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customersQuery.data?.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo do documento</Label>
                  <Select value={documentType} onValueChange={(value) => setDocumentType(value as typeof documentType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-slate-500">Arquivos são enviados para o storage do servidor e registrados no banco.</p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Cliente selecionado</div>
                  <div className="font-medium">{selectedClient?.name ?? "Nenhum"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Arquivo</div>
                  <div className="font-medium">{selectedFile?.name ?? "Nenhum"}</div>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={isUploading || uploadMutation.isPending || !selectedClientId || !selectedFile}
                className="w-full"
              >
                {isUploading || uploadMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Enviar documento
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente atual</CardTitle>
              <CardDescription>Arquivos persistidos para este cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customersQuery.isFetching ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando clientes...
                </div>
              ) : selectedClient ? (
                <>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="text-muted-foreground">Nome</div>
                    <div className="font-medium">{selectedClient.name}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="text-muted-foreground">Telefone</div>
                    <div className="font-medium">{selectedClient.phone}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="text-muted-foreground">Documentos cadastrados</div>
                    <div className="font-medium">{documents.length}</div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-slate-500">
                  Selecione um cliente para visualizar os documentos.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documentos enviados</CardTitle>
            <CardDescription>Lista dos documentos já persistidos no backend</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsQuery.isFetching ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando documentos...
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <p className="font-medium text-slate-900">{document.fileName}</p>
                        <Badge variant="outline">{document.documentType ?? "arquivo"}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{document.fileType} · {(document.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(document.s3Url, "_blank", "noopener,noreferrer")}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                Nenhum documento enviado para este cliente ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
