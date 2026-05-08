"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Button,
  Input,
  Table,
  Modal,
  Space,
  message,
  Form,
  Popconfirm,
  ConfigProvider,
  theme,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  PhoneOutlined,
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMediaQuery } from "react-responsive";
import { useClientStore } from "@/lib/clientStore";
import type { Client } from "@/lib/types";

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const validateName = (value: string): string | null => {
  if (!value.trim()) return "Заполни имя!";
  if (!/^[a-яёА-ЯЁa-zA-Z\s\-]+$/.test(value))
    return "Имя может содержать только буквы, пробелы и дефисы!";
  return null;
};

const validatePhone = (value: string): string | null => {
  if (!value.trim()) return "Заполни телефон!";
  if (!/^[\d\+\-\s()]+$/.test(value))
    return "Телефон должен содержать только цифры и символы: +, -, ( ), пробелы!";
  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const {
    isLoading,
    isModalOpen,
    editingClient,
    searchQuery,
    currentPage,
    pageSize,
    addClient,
    updateClient,
    deleteClient,
    setSearch,
    setPage,
    openAddModal,
    openEditModal,
    closeModal,
    getPaginatedClients,
    getTotalFiltered,
    getStats,
  } = useClientStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  const [form] = Form.useForm<{ name: string; phone: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isHydrated = useRef(false);
  const [mounted, setMounted] = useState(false);

  // wait for zustand persist hydration
  useEffect(() => {
    setMounted(true);
    isHydrated.current = true;
  }, []);

  // sync debounced search → store
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // populate form when editing
  useEffect(() => {
    if (isModalOpen && editingClient) {
      form.setFieldsValue({
        name: editingClient.name,
        phone: editingClient.phone,
      });
    } else if (isModalOpen && !editingClient) {
      form.resetFields();
    }
  }, [isModalOpen, editingClient, form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const nameErr = validateName(values.name);
      const phoneErr = validatePhone(values.phone);
      if (nameErr) { messageApi.error(nameErr); return; }
      if (phoneErr) { messageApi.error(phoneErr); return; }

      if (editingClient) {
        await updateClient(editingClient.id, values.name, values.phone);
        messageApi.success("Клиент обновлён!");
      } else {
        await addClient(values.name, values.phone);
        messageApi.success("Клиент добавлен!");
      }
    } catch {
      // form validation failed — antd shows inline errors
    }
  }, [form, editingClient, updateClient, addClient, messageApi]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteClient(id);
      messageApi.success("Клиент удалён!");
    },
    [deleteClient, messageApi]
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    closeModal();
  }, [form, closeModal]);

  const stats = mounted ? getStats() : { total: 0, todayCount: 0 };
  const paginatedClients = mounted ? getPaginatedClients() : [];
  const totalFiltered = mounted ? getTotalFiltered() : 0;

  // ── Columns ────────────────────────────────────────────────────────────────
  const desktopColumns: ColumnsType<Client> = [
    {
      title: "№",
      key: "index",
      width: 56,
      align: "center",
      render: (_, __, idx) => (
        <span className="crm-date-text" style={{ fontWeight: 600 }}>
          {(currentPage - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      title: "Клиент",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="crm-name-badge">
          <div className="crm-avatar">{getInitials(text)}</div>
          <span className="crm-name-text">{text}</span>
        </div>
      ),
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => (
        <Space size={8}>
          <PhoneOutlined style={{ color: "var(--color-accent)", fontSize: 14 }} />
          <span className="crm-phone-text">{text}</span>
        </Space>
      ),
    },
    {
      title: "Добавлен",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (val: string) => (
        <span className="crm-date-text">{formatDate(val)}</span>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size={8}>
          <Button
            id={`edit-btn-${record.id}`}
            icon={<EditOutlined />}
            size="small"
            className="crm-action-btn"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Удалить клиента?"
            description="Это действие нельзя отменить."
            onConfirm={() => handleDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Button
              id={`delete-btn-${record.id}`}
              icon={<DeleteOutlined />}
              size="small"
              className="crm-action-btn crm-action-btn-danger"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const mobileColumns: ColumnsType<Client> = [
    {
      title: "Клиент",
      key: "client",
      render: (_, record) => (
        <div>
          <div className="crm-name-badge" style={{ marginBottom: 4 }}>
            <div className="crm-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {getInitials(record.name)}
            </div>
            <span className="crm-name-text" style={{ fontSize: 13 }}>
              {record.name}
            </span>
          </div>
          <span className="crm-phone-text" style={{ fontSize: 12, paddingLeft: 38 }}>
            {record.phone}
          </span>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Button
            icon={<EditOutlined />}
            size="small"
            className="crm-action-btn"
            block
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Удалить?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              className="crm-action-btn crm-action-btn-danger"
              block
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#6366f1",
          colorBgBase: "#1a1d27",
          colorBgContainer: "#1a1d27",
          borderRadius: 12,
          fontFamily: "Inter, -apple-system, sans-serif",
        },
      }}
    >
      {contextHolder}
      <div className="crm-root">
        {/* ── Header ── */}
        <header className="crm-header" id="crm-header">
          <div className="crm-header-brand">
            <div className="crm-header-logo">👥</div>
            <div>
              <div className="crm-header-title">ClientCRM</div>
              <div className="crm-header-subtitle">Управление клиентами</div>
            </div>
          </div>
          <Button
            id="add-client-btn"
            type="primary"
            icon={<PlusOutlined />}
            className="btn-primary"
            size={isMobile ? "middle" : "large"}
            onClick={openAddModal}
          >
            {isMobile ? "Добавить" : "Добавить клиента"}
          </Button>
        </header>

        {/* ── Content ── */}
        <main className="crm-content" id="crm-main">
          {/* ── Stats ── */}
          <div className="crm-stats" id="crm-stats">
            <div className="crm-stat-card">
              <div className="crm-stat-icon crm-stat-icon--primary">
                <TeamOutlined />
              </div>
              <div>
                <div className="crm-stat-value">{stats.total}</div>
                <div className="crm-stat-label">Всего клиентов</div>
              </div>
            </div>
            <div className="crm-stat-card">
              <div className="crm-stat-icon crm-stat-icon--accent">
                <CalendarOutlined />
              </div>
              <div>
                <div className="crm-stat-value">{stats.todayCount}</div>
                <div className="crm-stat-label">Добавлено сегодня</div>
              </div>
            </div>
            <div className="crm-stat-card">
              <div className="crm-stat-icon crm-stat-icon--success">
                <SearchOutlined />
              </div>
              <div>
                <div className="crm-stat-value">{totalFiltered}</div>
                <div className="crm-stat-label">Найдено</div>
              </div>
            </div>
          </div>

          {/* ── Table card ── */}
          <div className="crm-card" id="crm-table-card">
            <div className="crm-card-header">
              <div>
                <div className="crm-card-title">База клиентов</div>
                <div className="crm-card-meta">
                  {totalFiltered} из {stats.total} записей
                </div>
              </div>
              <div className="crm-toolbar">
                <Input
                  id="search-input"
                  placeholder="Поиск по имени или телефону…"
                  prefix={<SearchOutlined />}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  allowClear
                  style={{ width: isMobile ? "100%" : 280 }}
                  size="middle"
                />
                {localSearch && (
                  <Button
                    icon={<ReloadOutlined />}
                    size="middle"
                    className="crm-action-btn"
                    onClick={() => {
                      setLocalSearch("");
                      setSearch("");
                    }}
                  >
                    Сбросить
                  </Button>
                )}
              </div>
            </div>

            {!mounted || stats.total === 0 ? (
              <div className="crm-empty">
                <div className="crm-empty-icon">👤</div>
                <div className="crm-empty-title">Клиентов пока нет</div>
                <div className="crm-empty-desc">
                  Нажмите «Добавить клиента», чтобы начать
                </div>
              </div>
            ) : totalFiltered === 0 ? (
              <div className="crm-empty">
                <div className="crm-empty-icon">🔍</div>
                <div className="crm-empty-title">Ничего не найдено</div>
                <div className="crm-empty-desc">
                  Попробуйте изменить поисковый запрос
                </div>
              </div>
            ) : (
              <Table<Client>
                id="clients-table"
                columns={isMobile ? mobileColumns : desktopColumns}
                dataSource={paginatedClients}
                rowKey="id"
                loading={isLoading}
                size={isMobile ? "small" : "middle"}
                scroll={isMobile ? { x: true } : undefined}
                rowClassName={() => "crm-row-enter"}
                pagination={{
                  current: currentPage,
                  pageSize,
                  total: totalFiltered,
                  onChange: setPage,
                  showSizeChanger: false,
                  showTotal: (total, range) =>
                    `${range[0]}–${range[1]} из ${total}`,
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* ── Modal ── */}
      <Modal
        id="client-modal"
        title={editingClient ? "Редактировать клиента" : "Добавить клиента"}
        open={isModalOpen}
        onCancel={handleCancel}
        width={isMobile ? "95%" : 480}
        confirmLoading={isLoading}
        footer={[
          <Button key="cancel" size="large" onClick={handleCancel}>
            Отмена
          </Button>,
          <Button
            key="submit"
            id="modal-submit-btn"
            type="primary"
            size="large"
            loading={isLoading}
            onClick={handleSubmit}
            icon={editingClient ? <SaveOutlined /> : <PlusOutlined />}
            className="btn-primary"
          >
            {editingClient ? "Сохранить" : "Добавить"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="Имя"
            name="name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input
              id="input-name"
              placeholder="Введите имя клиента"
              prefix={<UserOutlined />}
              size="large"
              onPressEnter={handleSubmit}
            />
          </Form.Item>
          <Form.Item
            label="Телефон"
            name="phone"
            rules={[{ required: true, message: "Введите телефон" }]}
          >
            <Input
              id="input-phone"
              placeholder="+7 (999) 000-00-00"
              prefix={<PhoneOutlined />}
              size="large"
              onPressEnter={handleSubmit}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}