"use client";

import { useState } from "react";
import { Users, Shield, UserCheck, Key, Trash2, Plus, Search, CheckCircle2, AlertCircle, Loader2, User } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: "superadmin" | "organizer";
  organizerSlug: string | null;
  stripeConnectedAccountId: string | null;
  createdAt: string;
}

interface UserManagementProps {
  initialUsers: UserItem[];
}

export function UserManagementTable({ initialUsers }: UserManagementProps) {
  const [usersList, setUsersList] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"superadmin" | "organizer">("organizer");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Password Modal State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: targetRole }),
      });

      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: targetRole as any } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editPasswordValue) return;

    setEditLoading(true);
    setEditMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUserId, newPassword: editPasswordValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Passwort-Reset.");

      setEditMessage("Passwort erfolgreich aktualisiert!");
      setEditPasswordValue("");
      setTimeout(() => {
        setEditingUserId(null);
        setEditMessage(null);
      }, 1500);
    } catch (err: any) {
      setEditMessage(`Fehler: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Möchten Sie den Benutzer "${email}" wirklich unwiderruflich löschen?`)) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Erstellen des Benutzers.");

      const created: UserItem = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        organizerSlug: null,
        stripeConnectedAccountId: null,
        createdAt: new Date().toISOString(),
      };

      setUsersList([created, ...usersList]);
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name oder E-Mail suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Alle Rollen ({usersList.length})</option>
            <option value="superadmin">Superadmins</option>
            <option value="organizer">Organizers</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Neuen Benutzer anlegen
        </button>
      </div>

      {/* Users Container: Mobile Card List & Desktop Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Mobile View: Vertical Cards (< 768px) */}
        <div className="block md:hidden p-4 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Keine Benutzer gefunden.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                      {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-white text-sm truncate">{user.name || "Kein Name"}</p>
                      <p className="text-[11px] text-slate-300 font-mono truncate">{user.email}</p>
                    </div>
                  </div>

                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono border focus:outline-none shrink-0 ${
                      user.role === "superadmin"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : user.role === "organizer"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    <option value="superadmin">superadmin</option>
                    <option value="organizer">organizer</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">ID: {user.id.slice(0, 8)}...</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingUserId(user.id);
                        setEditMessage(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all min-h-[44px]"
                    >
                      <Key className="w-3.5 h-3.5 text-indigo-400" /> PW-Reset
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Benutzer löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Benutzer / Name</th>
                <th className="p-4">E-Mail Adresse</th>
                <th className="p-4">System-Rolle</th>
                <th className="p-4">Erstellt am</th>
                <th className="p-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Keine Benutzer gefunden.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                          {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.name || "Kein Name"}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border focus:outline-none ${
                          user.role === "superadmin"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : user.role === "organizer"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        <option value="superadmin">superadmin</option>
                        <option value="organizer">organizer</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditMessage(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-all min-h-[44px]"
                          title="Passwort zurücksetzen"
                        >
                          <Key className="w-3.5 h-3.5 text-indigo-400" /> PW-Reset
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Benutzer löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> Neues Passwort vergeben
            </h3>
            <p className="text-xs text-slate-400">
              Vergeben Sie ein neues Initialpasswort für den Benutzer <span className="font-mono text-indigo-300">{editingUserId}</span>.
            </p>

            {editMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  editMessage.startsWith("Fehler")
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {editMessage.startsWith("Fehler") ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{editMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Neues Passwort (min. 6 Zeichen)..."
                value={editPasswordValue}
                onChange={(e) => setEditPasswordValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Passwort speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Benutzer manuell anlegen
            </h3>
            <p className="text-xs text-slate-400">
              Erstellen Sie einen neuen Plattform-Benutzer (Superadmin oder Organizer).
            </p>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Name</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Max Mustermann"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">E-Mail Adresse</label>
                <input
                  type="email"
                  required
                  placeholder="email@beispiel.de"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Initiales Passwort</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Passwort (min. 6 Zeichen)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">System Rolle</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  <option value="organizer">organizer (Veranstalter)</option>
                  <option value="superadmin">superadmin (Root Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-2"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Benutzer anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
