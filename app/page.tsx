"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Table,
  Modal,
  Card,
  Space,
  message,
  Form,
  Empty,
  Popconfirm,
  Tag,
  Layout,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMediaQuery } from "react-responsive";

interface Client {
  id: number;
  name: string;
  phone: string;
}

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      message.error("Заполни имя!");
      return false;
    }
    if (!/^[a-яёА-ЯЁa-zA-Z\s\-]+$/.test(value)) {
      message.error("Имя может содержать только буквы, пробелы и дефисы!");
      return false;
    }
    return true;
  };

  const validatePhone = (value: string): boolean => {
    if (!value.trim()) {
      message.error("Заполни телефон!");
      return false;
    }
    if (!/^[\d\+\-\s()]+$/.test(value)) {
      message.error(
        "Телефон должен содержать только цифры и символы: +, -, ( ), пробелы!"
      );
      return false;
    }
    return true;
  };

  const addClient = () => {
    if (!validateName(name) || !validatePhone(phone)) {
      return;
    }

    if (editingId) {
      setClients(
        clients.map((client) =>
          client.id === editingId ? { ...client, name, phone } : client
        )
      );
      message.success("Клиент обновлён!");
      setEditingId(null);
    } else {
      const newClient: Client = {
        id: Date.now(),
        name,
        phone,
      };
      setClients([...clients, newClient]);
      message.success("Клиент добавлен!");
    }

    setName("");
    setPhone("");
    setIsModalVisible(false);
  };

  const editClient = (client: Client) => {
    setName(client.name);
    setPhone(client.phone);
    setEditingId(client.id);
    setIsModalVisible(true);
  };

  const deleteClient = (id: number) => {
    setClients(clients.filter((client) => client.id !== id));
    message.success("Клиент удалён!");
  };

  const cancelEdit = () => {
    setName("");
    setPhone("");
    setEditingId(null);
    setIsModalVisible(false);
  };

  // ДЕСКТОП ВЕРСИЯ
  const desktopColumns: ColumnsType<Client & { index: number }> = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: "5%",
      align: "center",
      render: (_, __, index) => <Tag color="blue">{index + 1}</Tag>,
    },
    {
      title: "Имя",
      dataIndex: "name",
      key: "name",
      width: "35%",
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontSize: "16px", fontWeight: "500" }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
      width: "35%",
      render: (text) => (
        <Space>
          <PhoneOutlined style={{ color: "#52c41a", fontSize: "18px" }} />
          <span style={{ fontSize: "16px", fontWeight: "500" }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: "25%",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="middle"
            onClick={() => editClient(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить клиента?"
            description="Вы уверены что хотите удалить этого клиента?"
            onConfirm={() => deleteClient(record.id)}
            okText="Да"
            cancelText="Отмена"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="middle">
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // МОБИЛЬНАЯ ВЕРСИЯ
  const mobileColumns: ColumnsType<Client & { index: number }> = [
    {
      title: "Имя",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{text}</div>
          <div style={{ fontSize: "12px", color: "#999" }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: "30%",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            block
            onClick={() => editClient(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить?"
            onConfirm={() => deleteClient(record.id)}
            okText="Да"
            cancelText="Отмена"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small" block>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dataWithIndex = clients.map((client, index) => ({
    ...client,
    index,
  }));

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Layout.Content style={{ padding: isMobile ? "16px" : "32px" }}>
        <Card
          title={
            <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "bold" }}>
              CRM Система
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={isMobile ? "middle" : "large"}
              onClick={() => {
                setEditingId(null);
                setName("");
                setPhone("");
                setIsModalVisible(true);
              }}
            >
              {isMobile ? "Добавить" : "Добавить клиента"}
            </Button>
          }
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        >
          {clients.length === 0 ? (
            <Empty description="Нет клиентов" style={{ padding: "40px 0" }} />
          ) : (
            <div>
              <div style={{ marginBottom: "16px", color: "#666" }}>
                <strong>Всего клиентов: {clients.length}</strong>
              </div>
              <Table
                columns={isMobile ? mobileColumns : desktopColumns}
                dataSource={dataWithIndex}
                rowKey="id"
                pagination={false}
                size={isMobile ? "small" : "large"}
                scroll={isMobile ? { x: true } : undefined}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "even-row" : "odd-row"
                }
              />
            </div>
          )}
        </Card>
      </Layout.Content>

      {/* МОДАЛ ДЛЯ ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ */}
      <Modal
        title={editingId ? "Редактировать клиента" : "Добавить клиента"}
        open={isModalVisible}
        onCancel={cancelEdit}
        width={isMobile ? "95%" : 500}
        footer={[
          <Button key="cancel" size="large" onClick={cancelEdit}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            size="large"
            onClick={addClient}
            icon={editingId ? <SaveOutlined /> : <PlusOutlined />}
          >
            {editingId ? "Сохранить" : "Добавить"}
          </Button>,
        ]}
      >
        <Form layout="vertical" style={{ marginTop: "20px" }}>
          <Form.Item label="Имя" required>
            <Input
              placeholder="Введите имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addClient()}
              size="large"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item label="Телефон" required>
            <Input
              placeholder="Введите телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addClient()}
              size="large"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .even-row {
          background-color: #fafafa;
        }
        .odd-row {
          background-color: #ffffff;
        }
      `}</style>
    </Layout>
  );
}