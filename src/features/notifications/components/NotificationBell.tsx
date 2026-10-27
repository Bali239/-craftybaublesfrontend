"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Dropdown, List, Button, Empty, Typography, Badge } from "antd";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { readSession } from "../lib/session";

type Notification = {
  _id: string;
  title: string;
  message: string;
  orderNumber?: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!readSession()) return;
    try {
      const data = await api<{ items: Notification[]; unreadCount: number }>(
        "/api/notifications",
      );
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const socket = getSocket();
    if (!socket) return;
    const handler = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await api("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const menu = (
    <div className="w-[320px] rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div className="max-h-[360px] overflow-auto">
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            className="py-6"
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`px-4 cursor-pointer ${item.read ? "" : "bg-blue-50/40"}`}
                onClick={() => {
                  if (!item.read) markRead(item._id);
                }}
              >
                <List.Item.Meta
                  title={<span className="text-sm">{item.title}</span>}
                  description={
                    <span className="text-xs text-[#666]">
                      {item.message}
                      <br />
                      {new Date(item.createdAt).toLocaleString("en-PK", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      popupRender={() => menu}
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#303429] hover:bg-black/5">
        <Bell size={18} />
        {unreadCount > 0 && (
          <Badge
            count={unreadCount}
            size="small"
            className="absolute -right-1 -top-1"
          />
        )}
      </button>
    </Dropdown>
  );
}
