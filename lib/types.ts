export type ClientStatus = "active" | "lead" | "vip" | "inactive";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string; // base64 data URL, optional
  status: ClientStatus;
  createdAt: string; // ISO string
}
