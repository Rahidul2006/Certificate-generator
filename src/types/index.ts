export interface DocumentSizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation?: "landscape" | "portrait";
  description?: string;
}

export interface CertificateVariable {
  key: string;
  label: string;
  placeholder: string;
  category?: "recipient" | "event" | "meta";
}

export interface CertificateTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  backgroundName?: string | null;
  canvasJSON: Record<string, unknown> | null;
  thumbnailUrl?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomFabricData {
  isVariable?: boolean;
  variableName?: string;
  isCertificateBackground?: boolean;
  originalText?: string;
}

export interface SelectedElementProperties {
  type: "text" | "textbox" | "rect" | "circle" | "line" | "image" | "group";
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: "normal" | "italic";
  underline?: boolean;
  linethrough?: boolean;
  textAlign?: "left" | "center" | "right" | "justify";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  lineHeight?: number;
  charSpacing?: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  angle?: number;
  lockAspectRatio?: boolean;
  isVariable?: boolean;
  variableName?: string;
  isCertificateBackground?: boolean;
}

export interface SampleRecipient {
  id: string;
  name: string;
  email: string;
  event: string;
  date: string;
  position: string;
  certificate_id: string;
  [key: string]: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface GeneratedCertificateRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  campaignId?: string;
  campaignName?: string;
  templateId: string;
  templateName: string;
  issueDate: string;
  verificationCode: string;
  certificateFilename: string;
  certificateDataUrl: string;
  format: "png" | "pdf";
  dimensions: { width: number; height: number };
}

