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
  Upload,
  Tooltip,
} from "antd";
import type { RcFile } from "antd/es/upload";
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
  MailOutlined,
  CameraOutlined,
  LoadingOutlined,
  BulbOutlined,
  BulbFilled,
  ExportOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  TagOutlined,
  StarOutlined,
  ClockCircleOutlined,
  DeleteFilled,
  FileTextOutlined,
} from "@ant-design/icons";
import { Select, Badge, Dropdown, Menu } from "antd";
import type { Client, ClientStatus } from "@/lib/types";
import { useClientStore } from "@/lib/clientStore";
import { useMediaQuery } from "react-responsive";
import type { ColumnsType } from "antd/es/table";

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

const validateEmail = (value: string): string | null => {
  if (!value.trim()) return "Введи email!";
  // RFC-5321 simplified: local@domain.tld
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value.trim()))
    return "Некорректный email. Пример: ivan@gmail.com";
  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const {
    isLoading,
    isModalOpen,
    editingClient,
    deleteClient,
    bulkDeleteClients,
    setSearch,
    setPage,
    openAddModal,
    openEditModal,
    closeModal,
    toggleTheme,
    themeMode,
    getPaginatedClients,
    getTotalFiltered,
    getStats,
    clients,
    searchQuery,
    currentPage,
    pageSize,
    addClient,
    updateClient,
  } = useClientStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  const [form] = Form.useForm<{ name: string; phone: string; email: string; status: ClientStatus }>();
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isHydrated = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Convert file to base64
  const fileToBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const beforeUpload = async (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      messageApi.error("Загрузите изображение (JPG, PNG, WEBP)!");
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error("Размер файла не должен превышать 2MB!");
      return false;
    }
    setAvatarLoading(true);
    const base64 = await fileToBase64(file);
    setAvatarUrl(base64);
    setAvatarLoading(false);
    return false; // prevent auto-upload
  };

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
        email: editingClient.email,
        status: editingClient.status,
      });
      setAvatarUrl(editingClient.avatarUrl);
    } else if (isModalOpen && !editingClient) {
      form.resetFields();
      form.setFieldValue("status", "active");
      setAvatarUrl(undefined);
    }
  }, [isModalOpen, editingClient, form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const nameErr = validateName(values.name);
      const phoneErr = validatePhone(values.phone);
      const emailErr = validateEmail(values.email);
      if (nameErr) { messageApi.error(nameErr); return; }
      if (phoneErr) { messageApi.error(phoneErr); return; }
      if (emailErr) { messageApi.error(emailErr); return; }

      if (editingClient) {
        await updateClient(editingClient.id, values.name, values.phone, values.email, values.status, avatarUrl);
        messageApi.success("Клиент обновлён!");
      } else {
        await addClient(values.name, values.phone, values.email, values.status, avatarUrl);
        messageApi.success("Клиент добавлен!");
      }
    } catch {
      // form validation failed — antd shows inline errors
    }
  }, [form, editingClient, updateClient, addClient, messageApi, avatarUrl]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    messageApi.info(`${label} скопирован в буфер`);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `crm_clients_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    messageApi.success("Экспорт завершён!");
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    await bulkDeleteClients(selectedRowKeys.map((k) => k.toString()));
    setSelectedRowKeys([]);
    messageApi.success(`Удалено клиентов: ${selectedRowKeys.length}`);
  };

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteClient(id);
      messageApi.success("Клиент удалён!");
    },
    [deleteClient, messageApi]
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    setAvatarUrl(undefined);
    closeModal();
  }, [form, closeModal]);

  const stats = mounted ? getStats() : { total: 0, todayCount: 0 };
  const paginatedClients = mounted ? getPaginatedClients() : [];
  const totalFiltered = mounted ? getTotalFiltered() : 0;

  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case "active":
        return { color: "#34d399", label: "Активен", icon: <CheckCircleOutlined /> };
      case "lead":
        return { color: "#6366f1", label: "Лид", icon: <StarOutlined /> };
      case "vip":
        return { color: "#f59e0b", label: "VIP", icon: <TagOutlined /> };
      case "inactive":
        return { color: "#94a3b8", label: "Неактивен", icon: <ClockCircleOutlined /> };
      default:
        return { color: "#94a3b8", label: "—", icon: null };
    }
  };

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
      render: (text: string, record: Client) => (
        <div className="crm-name-badge">
          {record.avatarUrl ? (
            <img
              src={record.avatarUrl}
              alt={text}
              className="crm-avatar crm-avatar-img"
            />
          ) : (
            <div className="crm-avatar">{getInitials(text)}</div>
          )}
          <span className="crm-name-text">{text}</span>
        </div>
      ),
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PhoneOutlined style={{ color: "var(--color-accent)", fontSize: 14 }} />
          <span className="crm-phone-text">{text}</span>
          <Tooltip title="Копировать">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 12, opacity: 0.5 }} />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(text, "Телефон");
              }}
              style={{ width: 24, height: 24, padding: 0 }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MailOutlined style={{ color: "#a78bfa", fontSize: 14 }} />
          <a
            href={`mailto:${text}`}
            className="crm-email-link"
            onClick={(e) => e.stopPropagation()}
          >
            {text}
          </a>
          <Tooltip title="Копировать">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 12, opacity: 0.5 }} />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(text, "Email");
              }}
              style={{ width: 24, height: 24, padding: 0 }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: ClientStatus) => {
        const info = getStatusBadge(status);
        return (
          <div className="crm-status-tag" style={{ "--status-color": info.color } as any}>
            {info.icon}
            <span>{info.label}</span>
          </div>
        );
      },
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
            {record.avatarUrl ? (
              <img
                src={record.avatarUrl}
                alt={record.name}
                className="crm-avatar crm-avatar-img"
                style={{ width: 28, height: 28 }}
              />
            ) : (
              <div className="crm-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                {getInitials(record.name)}
              </div>
            )}
            <span className="crm-name-text" style={{ fontSize: 13 }}>
              {record.name}
            </span>
          </div>
          <span className="crm-phone-text" style={{ fontSize: 12, paddingLeft: 38 }}>
            {record.phone}
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 10, opacity: 0.5 }} />}
              onClick={() => copyToClipboard(record.phone, "Телефон")}
              style={{ width: 20, height: 20, padding: 0, marginLeft: 4 }}
            />
          </span>
          <div style={{ paddingLeft: 38, marginTop: 2 }}>
            <a href={`mailto:${record.email}`} className="crm-email-link" style={{ fontSize: 12 }}>
              {record.email}
            </a>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ fontSize: 10, opacity: 0.5 }} />}
              onClick={() => copyToClipboard(record.email, "Email")}
              style={{ width: 20, height: 20, padding: 0, marginLeft: 4 }}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Статус",
      key: "status",
      render: (_, record) => {
        const info = getStatusBadge(record.status);
        return (
          <div className="crm-status-tag" style={{ "--status-color": info.color, fontSize: "10px", padding: "2px 8px" } as any}>
            <span>{info.label}</span>
          </div>
        );
      },
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
        algorithm: themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#6366f1",
          colorBgBase: themeMode === "dark" ? "#1a1d27" : "#ffffff",
          colorBgContainer: themeMode === "dark" ? "#1a1d27" : "#ffffff",
          borderRadius: 12,
          fontFamily: "Inter, -apple-system, sans-serif",
        },
      }}
    >
      {contextHolder}
      <div className={`crm-root ${themeMode}-theme`}>
        {/* ── Header ── */}
        <header className="crm-header" id="crm-header">
          <div className="crm-header-brand">
            <div className="crm-header-logo">
              <TeamOutlined style={{ color: "#fff" }} />
            </div>
            <div>
              <h1 className="crm-header-title">CRM</h1>
              <p className="crm-header-subtitle">Управление клиентами</p>
            </div>
          </div>

          <Space size={12}>
            <Tooltip title={themeMode === "dark" ? "Светлая тема" : "Темная тема"}>
              <Button
                shape="circle"
                icon={themeMode === "dark" ? <BulbOutlined /> : <BulbFilled />}
                onClick={toggleTheme}
                className="crm-header-btn"
              />
            </Tooltip>
            {!isMobile && (
              <Button
                type="text"
                icon={<ExportOutlined />}
                onClick={handleExport}
                className="crm-header-btn"
              >
                Экспорт
              </Button>
            )}
            <Button
              id="add-client-btn-header"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              className="btn-primary"
            >
              {isMobile ? "" : "Новый клиент"}
            </Button>
          </Space>
        </header>

        <main className="crm-content">
          {/* ── Stats Dashboard ── */}
          <div className="crm-stats">
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
                <SearchOutlined />
              </div>
              <div>
                <div className="crm-stat-value">{totalFiltered}</div>
                <div className="crm-stat-label">Найдено</div>
              </div>
            </div>
            <div className="crm-stat-card">
              <div className="crm-stat-icon crm-stat-icon--success">
                <CalendarOutlined />
              </div>
              <div>
                <div className="crm-stat-value">{stats.todayCount}</div>
                <div className="crm-stat-label">Добавлено сегодня</div>
              </div>
            </div>
          </div>

          {/* ── Main Data Table ── */}
          <div className="crm-card">
            <div className="crm-card-header">
              <div>
                <h2 className="crm-card-title">Список контактов</h2>
                <p className="crm-card-meta">
                  {totalFiltered} {totalFiltered === 1 ? "клиент" : "клиентов"} в базе
                </p>
              </div>

              <div className="crm-toolbar">
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`Удалить ${selectedRowKeys.length} клиентов?`}
                    onConfirm={handleBulkDelete}
                    okText="Удалить"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      type="primary"
                      icon={<DeleteFilled />}
                      className="crm-bulk-delete-btn"
                    >
                      Удалить ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
                <div className="crm-search-wrap">
                  <Input
                    id="search-input"
                    placeholder="     Поиск..."
                    prefix={<SearchOutlined />}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    allowClear
                    style={{ width: isMobile ? "100%" : 240 }}
                    size="middle"
                  />
                </div>
                {!isMobile && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setLocalSearch("");
                      setPage(1);
                    }}
                  />
                )}
              </div>
            </div>

            <Table<Client>
              id="crm-clients-table"
              columns={isMobile ? mobileColumns : desktopColumns}
              dataSource={paginatedClients}
              rowKey="id"
              loading={isLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalFiltered,
                onChange: (p) => setPage(p),
                showSizeChanger: false,
                position: ["bottomCenter"],
              }}
              rowClassName="crm-row-enter"
              onRow={(record) => ({
                onDoubleClick: () => openEditModal(record),
              })}
              locale={{
                emptyText: (
                  <div className="crm-empty">
                    <div className="crm-empty-icon">📂</div>
                    <h3 className="crm-empty-title">Клиенты не найдены</h3>
                    <p className="crm-empty-desc">
                      Попробуйте изменить запрос или добавить нового клиента
                    </p>
                    <Button
                      type="primary"
                      style={{ marginTop: 24 }}
                      onClick={openAddModal}
                      icon={<PlusOutlined />}
                    >
                      Добавить первого клиента
                    </Button>
                  </div>
                ),
              }}
            />
          </div>
        </main>

        {/* ── Client Modal ── */}
        <Modal
          title={editingClient ? "Редактировать клиента" : "Новый контакт"}
          open={isModalOpen}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
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
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <Form.Item label="Фотография" style={{ marginBottom: 24 }}>
                <div className="crm-avatar-upload-wrap">
                  <Upload
                    id="upload-avatar"
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    accept="image/jpeg,image/png,image/webp"
                  >
                    <Tooltip title="Нажмите, чтобы загрузить фото">
                      <div className="crm-avatar-trigger">
                        {avatarLoading ? (
                          <LoadingOutlined style={{ fontSize: 24, color: "#6366f1" }} />
                        ) : avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="avatar"
                            className="crm-avatar-preview"
                          />
                        ) : (
                          <div className="crm-avatar-placeholder">
                            <CameraOutlined style={{ fontSize: 28, color: "var(--color-text-faint)" }} />
                            <span className="crm-avatar-hint">Загрузить</span>
                          </div>
                        )}
                        <div className="crm-avatar-overlay">
                          <CameraOutlined style={{ fontSize: 18, color: "#fff" }} />
                        </div>
                      </div>
                    </Tooltip>
                  </Upload>
                  {avatarUrl && (
                    <button
                      type="button"
                      className="crm-avatar-remove"
                      onClick={() => setAvatarUrl(undefined)}
                      title="Удалить фото"
                    >
                      ×
                    </button>
                  )}
                </div>
              </Form.Item>

              <div style={{ flex: 1, minWidth: 200 }}>
                <Form.Item
                  label="Статус клиента"
                  name="status"
                  initialValue="active"
                >
                  <Select
                    size="large"
                    options={[
                      { label: "Активен", value: "active" },
                      { label: "Лид (Потенциальный)", value: "lead" },
                      { label: "VIP Клиент", value: "vip" },
                      { label: "Неактивен", value: "inactive" },
                    ]}
                  />
                </Form.Item>
              </div>
            </div>

            <Form.Item
              label="Имя"
              name="name"
              rules={[{ required: true, message: "Введите имя" }]}
            >
              <Input
                id="input-name"
                placeholder="Иван Иванов"
                prefix={<UserOutlined />}
                size="large"
                onPressEnter={handleSubmit}
              />
            </Form.Item>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
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
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Введите email" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const err = validateEmail(value);
                      return err ? Promise.reject(new Error(err)) : Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  id="input-email"
                  placeholder="ivan@gmail.com"
                  prefix={<MailOutlined />}
                  size="large"
                  onPressEnter={handleSubmit}
                  autoComplete="email"
                />
              </Form.Item>
            </div>
        </Form>
      </Modal>
      </div>
    </ConfigProvider>
  );
}