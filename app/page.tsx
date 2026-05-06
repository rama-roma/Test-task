"use client";

import { useState } from "react";

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

  const addClient = () => {
    // ПРОВЕРКА ИМЕНИ (только буквы, пробелы, дефисы)
    if (!name.trim()) {
      alert("Заполни имя!");
      return;
    }

    if (!/^[a-яёА-ЯЁa-zA-Z\s\-]+$/.test(name)) {
      alert("Имя может содержать только буквы, пробелы и дефисы!");
      return;
    }

    // ПРОВЕРКА ТЕЛЕФОНА (только цифры, +, пробелы, дефисы, скобки)
    if (!phone.trim()) {
      alert("Заполни телефон!");
      return;
    }

    if (!/^[\d\+\-\s()]+$/.test(phone)) {
      alert(
        "Телефон должен содержать только цифры и символы: +, -, ( ), пробелы!",
      );
      return;
    }

    if (editingId) {
      setClients(
        clients.map((client) =>
          client.id === editingId ? { ...client, name, phone } : client,
        ),
      );
      setEditingId(null);
    } else {
      const newClient: Client = {
        id: Date.now(),
        name,
        phone,
      };
      setClients([...clients, newClient]);
    }

    setName("");
    setPhone("");
  };
  const deleteClient = (id: number) => {
    setClients(clients.filter((client) => client.id !== id));
  };

  const editClient = (client: Client) => {
    setName(client.name);
    setPhone(client.phone);
    setEditingId(client.id);
  };

  const cancelEdit = () => {
    setName("");
    setPhone("");
    setEditingId(null);
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1>📱 Мини CRM</h1>

      {/* ФОРМА */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2>{editingId ? "✏️ Редактировать клиента" : "Добавить клиента"}</h2>

        <input
          type="text"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addClient()}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        />

        <input
          type="tel"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addClient()}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={addClient}
            style={{
              background: editingId ? "#28a745" : "#0052CC",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              flex: 1,
            }}
          >
            {editingId ? "💾 Сохранить" : "➕ Добавить клиента"}
          </button>

          {editingId && (
            <button
              onClick={cancelEdit}
              style={{
                background: "#6c757d",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                flex: 1,
              }}
            >
              ✖️ Отмена
            </button>
          )}
        </div>
      </div>

      {/* СПИСОК КЛИЕНТОВ */}
      <div>
        <h2>Список клиентов ({clients.length})</h2>

        {clients.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: "20px" }}>
            Нет клиентов. Добавьте первого!
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr style={{ background: "#e8e8e8" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                  }}
                >
                  Имя
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                  }}
                >
                  Телефон
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    border: "1px solid #ddd",
                    width: "150px",
                  }}
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: "1px solid #ddd",
                    background: editingId === client.id ? "#fff3cd" : "white",
                  }}
                >
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {client.name}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {client.phone}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      border: "1px solid #ddd",
                    }}
                  >
                    <div className="flex ">
                      <button
                        onClick={() => editClient(client)}
                        style={{
                          background: "#ffc107",
                          color: "#000",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          marginRight: "5px",
                        }}
                      >
                        ✏️ Изменить
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        style={{
                          background: "#ff4444",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
