import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Client } from "./types";

interface ClientStore {
  // Data
  clients: Client[];

  // UI state
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;

  // Modal state
  isModalOpen: boolean;
  editingClient: Client | null;

  // Async actions
  addClient: (name: string, phone: string) => Promise<void>;
  updateClient: (id: string, name: string, phone: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Sync actions
  setSearch: (query: string) => void;
  setPage: (page: number) => void;
  openAddModal: () => void;
  openEditModal: (client: Client) => void;
  closeModal: () => void;

  // Computed (helper)
  getFilteredClients: () => Client[];
  getPaginatedClients: () => Client[];
  getTotalFiltered: () => number;
  getStats: () => { total: number; todayCount: number };
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      searchQuery: "",
      currentPage: 1,
      pageSize: 10,
      isLoading: false,
      isModalOpen: false,
      editingClient: null,

      // ─── Async actions (simulate async with small delay) ──────────────────
      addClient: async (name, phone) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 300)); // simulate network
        const newClient: Client = {
          id: crypto.randomUUID(),
          name: name.trim(),
          phone: phone.trim(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          clients: [newClient, ...state.clients],
          isLoading: false,
          isModalOpen: false,
          currentPage: 1,
        }));
      },

      updateClient: async (id, name, phone) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 300));
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, name: name.trim(), phone: phone.trim() } : c
          ),
          isLoading: false,
          isModalOpen: false,
          editingClient: null,
        }));
      },

      deleteClient: async (id) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 200));
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          isLoading: false,
          // reset to page 1 if current page becomes empty
          currentPage: 1,
        }));
      },

      // ─── Sync actions ────────────────────────────────────────────────────
      setSearch: (query) => set({ searchQuery: query, currentPage: 1 }),
      setPage: (page) => set({ currentPage: page }),

      openAddModal: () =>
        set({ isModalOpen: true, editingClient: null }),

      openEditModal: (client) =>
        set({ isModalOpen: true, editingClient: client }),

      closeModal: () =>
        set({ isModalOpen: false, editingClient: null }),

      // ─── Computed helpers ────────────────────────────────────────────────
      getFilteredClients: () => {
        const { clients, searchQuery } = get();
        if (!searchQuery.trim()) return clients;
        const q = searchQuery.toLowerCase();
        return clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q)
        );
      },

      getPaginatedClients: () => {
        const { currentPage, pageSize } = get();
        const filtered = get().getFilteredClients();
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
      },

      getTotalFiltered: () => get().getFilteredClients().length,

      getStats: () => {
        const { clients } = get();
        const today = new Date().toDateString();
        const todayCount = clients.filter(
          (c) => new Date(c.createdAt).toDateString() === today
        ).length;
        return { total: clients.length, todayCount };
      },
    }),
    {
      name: "crm-clients-storage", // localStorage key
      partialize: (state) => ({
        clients: state.clients,
      }),
    }
  )
);
